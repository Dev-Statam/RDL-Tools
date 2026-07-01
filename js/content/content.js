const content = {
    extensionApi: null,
    surveyorEnabled: true,

    async init() {
        content.extensionApi = utils.extensionApi;
        await utils.initActivityMapping();
        const settings = await content._loadSettings();
        const isEnabled = settings.isEnabled;

        content.surveyorEnabled = settings.surveyorEnabled;

        // Écouteur pour les changements de mappages personnalisés
        content.extensionApi.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'sync' && 'RDLToolsCustomActivityMapping' in changes) {
                utils.initActivityMapping().catch(error => {
                    console.warn('[RDL Tools] Erreur lors de la mise à jour des mappages :', error);
                });
            }
        });

        if (!isEnabled) {
            console.info('[RDL Tools] Extension désactivée depuis les options.');
            return;
        }

        if (content.surveyorEnabled) {
            surveyorActivities.init(content.extensionApi);
            await surveyorActivities.sanitizeStoredActivities();
            await surveyorActivities.surveyTableauRoulement();
        }

        if (content.extensionApi.runtime && content.extensionApi.runtime.onMessage) {
            content.extensionApi.runtime.onMessage.addListener((message) => {
                content._updateJsonCache(message);
            });
        }

        window.addEventListener('message', (event) => {
            if (!networkBridge.isFromBridge(event)) {
                return;
            }
            content._updateJsonCache(event.data);
        });

        const $calendarButton = calendarButton.createCalendarButton();

        try {
            utils.$headerActivite.appendChild($calendarButton);
            $calendarButton.addEventListener('click', content._handleCalendarButtonClick);
        } catch (error) {
            console.error('[RDL Tools] Erreur lors de l\'ajout du bouton d\'ajout au calendrier : ', error);
        }

        const $restButton = restButton.createRestButton();
        $restButton.style.display = 'none';

        try {
            utils.$selectListeMoisElement.parentNode.before($restButton);
            $restButton.addEventListener('click', content._handleRestButtonClick);
            content.mutationObserver($restButton);
        } catch (error) {
            console.error('[RDL Tools] Erreur lors de l\'ajout du bouton d\'ajout des jours de repos au calendrier : ', error);
        }

        if (content.surveyorEnabled) {
            content._observeActivityClicks();
        }
    },

    _observeActivityClicks() {
        document.addEventListener('click', (event) => {
            surveyorActivities.captureClickedActivity(event.target);
        }, true);
    },

    _updateJsonCache(message) {
        if (message.type === "activity-json") {
            content.activityJson = message.payload;
        }
        if (message.type === "rest-json") {
            content.restJson = message.payload;
        }
    },

    _handleCalendarButtonClick(event) {
        event.preventDefault();
        if (content.activityJson && content.activityJson.Activites.length > 0) {

            content._workingDayToCalendar();

        } else {
            console.warn('[RDL Tools] Impossible de récupérer les informations de la journée. Veuillez vous assurer que les éléments nécessaires sont présents et contiennent des données valides.');
        }
    },

    _handleRestButtonClick(event) {
        event.preventDefault();
        if (content.restJson && content.restJson.length > 0) {
            content._restDaysToCalendar();
        } else {
            console.warn('[RDL Tools] Impossible de récupérer les informations du tableau de roulement. Veuillez vous assurer que l\'élément nécessaire est présent et contient des données valides.');
        }
    },

    async _workingDayToCalendar() {
        const activityData = await workingDay.getActivityData(content.activityJson);
        await icsGenerator.generateICSFile(new ActivityDay(activityData));

        if (content.surveyorEnabled) {
            await surveyorActivities.persistPendingActivity(activityData);
            await surveyorActivities.surveyTableauRoulement();
        }
    },

    async _restDaysToCalendar() {
        const restData = await restingDay.getRestData(content.restJson);
        icsGenerator.generateICSFile(new RestDays(month = restData.month, year = restData.year, restDays = restData.restDays));
    },

    mutationObserver($element) {
        $element.style.display = 'none';

        // Listener pour les changements d'option du select
        utils.$selectListeMoisElement.addEventListener('change', async () => {
            // Laisser du temps à getRoulementToThisMonth() de mettre à jour le contenu du tableau
            await new Promise(resolve => setTimeout(resolve, 500));
            if (content.surveyorEnabled) {
                await surveyorActivities.surveyTableauRoulement();
            }
        });

        const observer = new MutationObserver(async (mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const isVisible = utils.$selectListeMoisElement.style.display !== 'none';
                    $element.style.display = isVisible ? 'flex' : 'none';
                    
                    // Si le select vient de devenir visible, surveiller le tableau
                    if (isVisible && content.surveyorEnabled) {
                        await surveyorActivities.surveyTableauRoulement();
                    }
                }
            }
        });

        const config = { attributes: true, attributeFilter: ['style'] };

        observer.observe(utils.$selectListeMoisElement, config);
    },

    async _loadSettings() {
        try {
            const extensionEnabledKey = utils.storageKeys.extensionEnabled;
            const surveyorEnabledKey = utils.storageKeys.surveyorEnabled;
            const storedValues = await content.extensionApi.storage.sync.get([extensionEnabledKey, surveyorEnabledKey]);
            const storedEnabledValue = storedValues && storedValues[extensionEnabledKey];
            const storedSurveyorValue = storedValues && storedValues[surveyorEnabledKey];
            const isEnabled = typeof storedEnabledValue === 'boolean' ? storedEnabledValue : true;
            const surveyorEnabled = typeof storedSurveyorValue === 'boolean' ? storedSurveyorValue : true;

            return {
                isEnabled,
                surveyorEnabled
            };
        } catch (error) {
            console.warn('[RDL Tools] Lecture de la configuration impossible, extension active par défaut.', error);
            return {
                isEnabled: true,
                surveyorEnabled: true
            };
        }
    }
}

content.init();