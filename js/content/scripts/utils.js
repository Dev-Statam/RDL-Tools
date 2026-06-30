const utils = {
    extensionApi: typeof browser !== 'undefined' ? browser : chrome,
    $selectListeMoisElement: document.getElementById('liste_mois_tr_id'),
    $headerActivite: document.getElementById('header_Activite'),
    $tableauRoulementElement: document.getElementById('tableau_roulement_id'),
    storageKeys: {
        syncActivities: 'RDLToolsSynchedActivities',
        localActivities: 'RDLToolsSavedActivities'
    },
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
    arrayActivityConvert: {
        '(Aller)': null,
        '(Retour)': null,
        '(Sortie)': null,
        '(Entrée)': null,
        'Opération du véhicule': null,
        'Dép. de l\'emplacement précédent': 'Rappat.',
        'Dép. vers l\'emplacement suivant': 'Rappat.',
        'Pièce de disponibilité habillage': 'Dispo.',
        'DP_MEY': 'DZ',
        'T_MEZI': 'Q4',
        'T_PDVA': 'V1',
        'T_PDVD': 'V2',
        'T1_DO2': 'DD',
        'T_LASO': 'VS'
    },
    restCode: ['RN', 'RHE', 'HEC', 'CA', 'RX', 'FL', 'LN'],

    // Mapping inverse pour convertir rapidement les chiffres en mois texte
    _digitToMonthMap: {
        '01': 'janvier', '02': 'février', '03': 'mars', '04': 'avril',
        '05': 'mai', '06': 'juin', '07': 'juillet', '08': 'août',
        '09': 'septembre', '10': 'octobre', '11': 'novembre', '12': 'décembre'
    },

    textConverter(textToConvert) {
        if (utils.arrayActivityConvert[textToConvert] === null || utils.arrayActivityConvert[textToConvert] === '') {
            return '';
        }

        return utils.arrayActivityConvert[textToConvert] || textToConvert;
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