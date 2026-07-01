const utils = {
    extensionApi: typeof browser !== 'undefined' ? browser : chrome,
    $selectListeMoisElement: document.getElementById('liste_mois_tr_id'),
    $headerActivite: document.getElementById('header_Activite'),
    $tableauRoulementElement: document.getElementById('tableau_roulement_id'),
    storageKeys: {
        syncActivities: 'RDLToolsSynchedActivities',
        localActivities: 'RDLToolsSavedActivities',
        extensionEnabled: 'RDLToolsExtensionEnabled',
        surveyorEnabled: 'RDLToolsSurveyorEnabled',
        customActivityMapping: 'RDLToolsCustomActivityMapping'
    },
    _customActivityMapping: {},
    _defaultActivityMapping: {},
    _mergedActivityMapping: {},
    assets: {
        warningCalendarIcon: 'assets/calendrier-warn-24.png'
    },
    messages: {
        modifiedDayTooltip: 'Cette journée a été modifié depuis le dernier enregistrement'
    },
    arrayMonthsConvert: {
        janvier: '01',
        février: '02',
        mars: '03',
        avril: '04',
        mai: '05',
        juin: '06',
        juillet: '07',
        août: '08',
        septembre: '09',
        octobre: '10',
        novembre: '11',
        décembre: '12'
    },
    // Référence les défauts définis dans js/defaults.js
    arrayActivityConvert: DEFAULT_ACTIVITY_MAPPING,
    restCode: ['RN', 'RHE', 'HEC', 'CA', 'RX', 'FL', 'LN', 'RCR'],

    // Mapping inverse pour convertir rapidement les chiffres en mois texte
    _digitToMonthMap: {
        '01': 'janvier', '02': 'février', '03': 'mars', '04': 'avril',
        '05': 'mai', '06': 'juin', '07': 'juillet', '08': 'août',
        '09': 'septembre', '10': 'octobre', '11': 'novembre', '12': 'décembre'
    },

    textConverter(textToConvert) {
        const mapping = utils._mergedActivityMapping;
        const lowerTextToConvert = textToConvert.toLowerCase();
        
        // Recherche insensible à la casse, mais retourne la valeur stockée avec la casse originale
        for (const key of Object.keys(mapping)) {
            if (key.toLowerCase() === lowerTextToConvert) {
                const value = mapping[key];
                if (value === null || value === '') {
                    return '';
                }
                return value;
            }
        }
        
        return textToConvert;
    },

    async initActivityMapping() {
        try {
            utils._defaultActivityMapping = { ...utils.arrayActivityConvert };
            const storedKey = utils.storageKeys.customActivityMapping;
            const storedValues = await utils.extensionApi.storage.sync.get(storedKey);
            const customMapping = storedValues && storedValues[storedKey];
            
            if (customMapping && typeof customMapping === 'object') {
                utils._customActivityMapping = customMapping;
            } else {
                utils._customActivityMapping = {};
            }

            utils._mergedActivityMapping = {
                ...utils._defaultActivityMapping,
                ...utils._customActivityMapping
            };
        } catch (error) {
            console.warn('[RDL Tools] Erreur lors de l\'initialisation du mapping d\'activités :', error);
            utils._mergedActivityMapping = { ...utils.arrayActivityConvert };
        }
    },

    convertDigitMonthToText(monthDigit) {
        return utils._digitToMonthMap[monthDigit] || '';
    },
    parseFindActivitesJournee(onclickValue) {
        const match = onclickValue.match(/findActivitesJournee\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*\)/);
        if (!match) {
            return null;
        }

        return {
            date: match[2],
            schedule: match[3],
            ligne: match[4]
        };
    },
    isIsoDate(value) {
        return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
    },
    getTodayLocalDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    },
    getRuntimeURL(path) {
        return utils.extensionApi.runtime.getURL(path);
    }
}