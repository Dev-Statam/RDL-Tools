const utils = {
    // $modalVacationsElement: document.getElementById('modalVacations'),
    // $listeActivitesJournee: document.getElementById('listeActivitesJournee'),
    // $titleActiviteJournee: document.getElementById('titleActiviteJournee'),
    // $tableauRoulementElement: document.getElementById('tableau_roulement_id'),
    $selectListeMoisElement: document.getElementById('liste_mois_tr_id'),
    $headerActivite: document.getElementById('header_Activite'),
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
    arrayAvtivityConvert: {
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
    textConverter(textToConvert) {
        if (utils.arrayAvtivityConvert[textToConvert] === null || utils.arrayAvtivityConvert[textToConvert] === '') {
            return '';
        }

        return utils.arrayAvtivityConvert[textToConvert] || textToConvert;
    },
    convertDigitMonthToText(monthDigit) {
        for (const [monthText, monthNumber] of Object.entries(utils.arrayMonthsConvert)) {
            if (monthNumber === monthDigit) {
                return monthText;
            }
        }
        return '';
    }
}