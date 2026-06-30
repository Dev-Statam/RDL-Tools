/**
 * Module de gestion des activités avec stockage multi-plateforme et détection des modifications.
 * 
 * Responsabilités :
 * - Capture des clics sur les activités du tableau de roulement
 * - Sauvegarde/restauration des activités (browser.storage.sync + localStorage en fallback)
 * - Déduplication des activités par date (garde la version la plus récente)
 * - Filtrage des activités obsolètes (< aujourd'hui)
 * - Comparaison des activités stockées vs. affichées (détection de modifications)
 * - Affichage/masquage d'un avertissement visuel en cas de modification
 * 
 * Méthodes publiques :
 * - init(extensionApi) : Initialise le module avec l'API de l'extension
 * - captureClickedActivity(target) : Enregistre l'activité cliquée en tant qu'activité en attente
 * - sanitizeStoredActivities() : Supprime les doublons et les entrées obsolètes du stockage
 * - persistPendingActivity(activityData) : Enregistre l'activité en attente dans le stockage
 * - surveyTableauRoulement() : Compare les activités stockées vs. affichées et met à jour les avertissements
 */
const surveyorActivities = {
    extensionApi: null,
    pendingActivity: null,

    init(extensionApi) {
        surveyorActivities.extensionApi = extensionApi;
    },

    captureClickedActivity(target) {
        const element = target instanceof Element ? target : target && target.parentElement;
        if (!element || typeof element.closest !== 'function') {
            return;
        }

        const link = element.closest('a[onclick]');
        if (!link) {
            return;
        }

        if (!utils.$tableauRoulementElement || !utils.$tableauRoulementElement.contains(link)) {
            return;
        }

        const parsedActivity = utils.parseFindActivitesJournee(link.getAttribute('onclick') || '');
        if (!parsedActivity) {
            return;
        }

        surveyorActivities.pendingActivity = {
            date: parsedActivity.date,
            schedule: parsedActivity.schedule,
            ligne: parsedActivity.ligne,
            capturedAt: new Date().toISOString()
        };
    },

    async sanitizeStoredActivities() {
        try {
            const syncActivities = await surveyorActivities._readSyncActivities();
            const sanitizedSyncActivities = surveyorActivities._sanitizeActivities(syncActivities);
            await surveyorActivities._writeSyncActivities(sanitizedSyncActivities);
        } catch (error) {
            console.warn('[RDL Tools] Unable to sanitize storage.sync activities: ', error);
        }

        try {
            const localActivities = surveyorActivities._readLocalActivities();
            const sanitizedLocalActivities = surveyorActivities._sanitizeActivities(localActivities);
            surveyorActivities._writeLocalActivities(sanitizedLocalActivities);
        } catch (error) {
            console.warn('[RDL Tools] Unable to sanitize localStorage activities: ', error);
        }
    },

    async persistPendingActivity(activityData) {
        if (!surveyorActivities.pendingActivity) {
            return;
        }

        if (activityData && activityData.date && surveyorActivities.pendingActivity.date !== activityData.date) {
            return;
        }

        const activityToSave = surveyorActivities.pendingActivity;

        try {
            const syncActivities = await surveyorActivities._readSyncActivities();
            const upsertedSyncActivities = surveyorActivities._upsertActivityByDate(syncActivities, activityToSave);
            await surveyorActivities._writeSyncActivities(upsertedSyncActivities);
        } catch (error) {
            console.warn('[RDL Tools] Unable to save activity in storage.sync: ', error);
        }

        try {
            const localActivities = surveyorActivities._readLocalActivities();
            const upsertedLocalActivities = surveyorActivities._upsertActivityByDate(localActivities, activityToSave);
            surveyorActivities._writeLocalActivities(upsertedLocalActivities);
        } catch (error) {
            console.warn('[RDL Tools] Unable to save activity in localStorage: ', error);
        }

        surveyorActivities.pendingActivity = null;
    },

    async surveyTableauRoulement() {
        if (!utils.$tableauRoulementElement) {
            return;
        }

        const storedActivitiesByDate = await surveyorActivities._getStoredActivitiesByDate();
        const links = Array.from(utils.$tableauRoulementElement.querySelectorAll('a[onclick]'));

        links.forEach((link) => {
            const pageActivity = utils.parseFindActivitesJournee(link.getAttribute('onclick') || '');
            if (!pageActivity) {
                surveyorActivities._removeWarningIcon(link);
                return;
            }

            const storedActivity = storedActivitiesByDate.get(pageActivity.date);
            const hasChanged = Boolean(
                storedActivity
                && (
                    storedActivity.schedule !== pageActivity.schedule
                    || storedActivity.ligne !== pageActivity.ligne
                )
            );

            if (hasChanged) {
                surveyorActivities._appendWarningIcon(link);
            } else {
                surveyorActivities._removeWarningIcon(link);
            }
        });
    },

    async _getStoredActivitiesByDate() {
        const byDateWithMeta = new Map();

        try {
            const syncActivities = await surveyorActivities._readSyncActivities();
            surveyorActivities._mergeActivitiesByDate(byDateWithMeta, syncActivities);
        } catch (error) {
            console.warn('[RDL Tools] Unable to read storage.sync activities for survey: ', error);
        }

        try {
            const localActivities = surveyorActivities._readLocalActivities();
            surveyorActivities._mergeActivitiesByDate(byDateWithMeta, localActivities);
        } catch (error) {
            console.warn('[RDL Tools] Unable to read localStorage activities for survey: ', error);
        }

        const byDate = new Map();
        for (const [date, entry] of byDateWithMeta.entries()) {
            byDate.set(date, entry.activity);
        }

        return byDate;
    },

    _sanitizeActivities(activities) {
        const dedupedActivities = surveyorActivities._dedupeActivitiesKeepLatest(activities);
        return surveyorActivities._filterActivitiesFromToday(dedupedActivities);
    },

    async _readSyncActivities() {
        const storage = surveyorActivities.extensionApi && surveyorActivities.extensionApi.storage && surveyorActivities.extensionApi.storage.sync;
        if (!storage) {
            return [];
        }

        const syncData = await surveyorActivities._storageGet(storage, utils.storageKeys.syncActivities);
        const syncActivities = syncData && syncData[utils.storageKeys.syncActivities];
        return Array.isArray(syncActivities) ? syncActivities : [];
    },

    async _writeSyncActivities(activities) {
        const storage = surveyorActivities.extensionApi && surveyorActivities.extensionApi.storage && surveyorActivities.extensionApi.storage.sync;
        if (!storage) {
            return;
        }

        await surveyorActivities._storageSet(storage, { [utils.storageKeys.syncActivities]: activities });
    },

    _readLocalActivities() {
        const localData = localStorage.getItem(utils.storageKeys.localActivities);
        const localActivities = localData ? JSON.parse(localData) : [];
        return Array.isArray(localActivities) ? localActivities : [];
    },

    _writeLocalActivities(activities) {
        localStorage.setItem(utils.storageKeys.localActivities, JSON.stringify(activities));
    },

    _mergeActivitiesByDate(targetMap, activities) {
        activities.forEach((activity, index) => {
            if (!activity || typeof activity.date !== 'string') {
                return;
            }

            const current = targetMap.get(activity.date);
            if (!current) {
                targetMap.set(activity.date, { activity, index });
                return;
            }

            const currentTime = Date.parse(current.activity.capturedAt || '');
            const candidateTime = Date.parse(activity.capturedAt || '');
            const hasValidCurrentTime = Number.isFinite(currentTime);
            const hasValidCandidateTime = Number.isFinite(candidateTime);

            // Si les deux ont des timestamps valides, garder le plus récent
            if (hasValidCurrentTime && hasValidCandidateTime) {
                if (candidateTime >= currentTime) {
                    targetMap.set(activity.date, { activity, index });
                }
            }
            // Si seul le candidat a un timestamp valide
            else if (!hasValidCurrentTime && hasValidCandidateTime) {
                targetMap.set(activity.date, { activity, index });
            }
            // Si aucun n'a de timestamp valide, garder le dernier en occurrence
            else if (index >= current.index) {
                targetMap.set(activity.date, { activity, index });
            }
        });
    },

    _upsertActivityByDate(activities, activityToSave) {
        const existingIndex = activities.findIndex((activity) => activity && activity.date === activityToSave.date);
        if (existingIndex === -1) {
            return [...activities, activityToSave];
        }

        const updatedActivities = [...activities];
        updatedActivities[existingIndex] = activityToSave;
        return updatedActivities;
    },

    _dedupeActivitiesKeepLatest(activities) {
        const byDate = new Map();
        surveyorActivities._mergeActivitiesByDate(byDate, activities);

        return Array.from(byDate.values())
            .sort((a, b) => a.index - b.index)
            .map((entry) => entry.activity);
    },

    _filterActivitiesFromToday(activities) {
        const today = utils.getTodayLocalDateString();

        return activities.filter((activity) => {
            if (!activity || !utils.isIsoDate(activity.date)) {
                return false;
            }

            return activity.date >= today;
        });
    },

    _appendWarningIcon(link) {
        const cell = link.closest('td');
        if (!cell) {
            return;
        }

        if (cell.querySelector('.rdl-tools-warning-icon')) {
            return;
        }

        const icon = warningCalendarIcon.createWarningIcon();
        cell.appendChild(icon);
    },

    _removeWarningIcon(link) {
        const cell = link.closest('td');
        if (!cell) {
            return;
        }

        const icon = cell.querySelector('.rdl-tools-warning-icon');
        if (icon) {
            icon.remove();
        }
    },

    _storageGet(storage, key) {
        if (storage.get.length <= 1) {
            return storage.get(key);
        }

        return new Promise((resolve, reject) => {
            storage.get(key, (result) => {
                const runtime = surveyorActivities.extensionApi && surveyorActivities.extensionApi.runtime;
                if (runtime && runtime.lastError) {
                    reject(new Error(runtime.lastError.message));
                    return;
                }
                resolve(result || {});
            });
        });
    },

    _storageSet(storage, data) {
        if (storage.set.length <= 1) {
            return storage.set(data);
        }

        return new Promise((resolve, reject) => {
            storage.set(data, () => {
                const runtime = surveyorActivities.extensionApi && surveyorActivities.extensionApi.runtime;
                if (runtime && runtime.lastError) {
                    reject(new Error(runtime.lastError.message));
                    return;
                }
                resolve();
            });
        });
    }
};
