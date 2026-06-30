/**
 * Module d'extraction des données d'activité (journée de travail).
 * 
 * Responsabilités :
 * - Extraction des informations de la journée de travail depuis le JSON de l'API
 * - Récupération du service, ligne, horaire, date et détails des activités
 * - Formatage des détails des activités avec conversion de codes et lieux
 * 
 * Méthodes publiques :
 * - getActivityData(activityJson) : Extrait et retourne l'ensemble des données de la journée
 *   (service, ligne, horaire, date, heures, détails des activités)
 */
const workingDay = {
    getActivityData(activityJson) {
        let activityData = {};
        
        try {
            activityData.service = workingDay._getService(activityJson);
            activityData.line = workingDay._getLine(activityJson);
            activityData.codeCDM = workingDay._getCodeCDM(activityJson);
            activityData.schedule = workingDay._getSchedule(activityJson);
            activityData.date = workingDay._getDate(activityJson);
            activityData.startTime = workingDay._getStartTime(activityJson);
            activityData.endTime = workingDay._getEndTime(activityJson);
            activityData.activityDetails = workingDay._getActivityDetails(activityJson.Activites);           

        } catch (error) {
            console.error('[RDL Tools] Erreur lors de la récupération des données de la journée : ', error);
        }

        return activityData;

    },

    _getLine(activityJson) {
        return activityJson.Activites[0].LIGNE_ACTIVITE;
    },

    _getService(activityJson) {
        return activityJson.Activites[0].CODE_SERVICE.split('-')[1].trim();
    },

    _getCodeCDM(activityJson) {
        return activityJson.Activites[0].CODE_UNITE_HORAIRE;
    },

    _getSchedule(activityJson) {
        return activityJson.Titre.split(' - ').at(-1);
    },

    _getDate(activityJson) {
        return activityJson.Activites[0].DATE_JOUR_TRAVAIL;
    },

    _getStartTime(activityJson) {
        return activityJson.Activites[0].HEURE_DEB_ACT;
    },

    _getEndTime(activityJson) {
        return activityJson.Activites.at(-1).HEURE_FIN_ACT;
    },

    _getActivityDetails(activityJson) {
        let activityDetails = [];
        if (activityJson.length === 0) {
            return activityDetails;
        }

        activityJson.forEach((element) => {
            let partialActivity = '';

            if (element.DESC_ACTIVITE === 'Opération du véhicule') {
                partialActivity = element.LIGNE_ACTIVITE + '-' + element.VOITURE.replace(/\s/g, '');
            } else {
                partialActivity = utils.textConverter(element.DESC_ACTIVITE);
            }

            partialActivity += ' ' + element.HEURE_DEB_ACT + '-';
            partialActivity += element.LIEU_DEB_ACT.trim().split(/\s/g)
                .map(place => utils.textConverter(place))
                .join('');
            
            partialActivity += ' ' + element.HEURE_FIN_ACT + '-';
            partialActivity += element.LIEU_FIN_ACT.trim().split(/\s/g)
                .map(place => utils.textConverter(place))
                .join('');

            activityDetails.push(partialActivity);
        });

        return activityDetails;
    }
}