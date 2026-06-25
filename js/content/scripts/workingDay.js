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
            if (activityJson.length !== 0) {
                activityJson.forEach((element) => {
                    let partialActivity = null;
                    if (element.DESC_ACTIVITE === 'Opération du véhicule') {
                        partialActivity = partialActivity ? partialActivity + '\n' + element.LIGNE_ACTIVITE + '-' + element.VOITURE.replace(/\s/g, ''): element.LIGNE_ACTIVITE + '-' + element.VOITURE.replace(/\s/g, '');
                    } else {
                        partialActivity = partialActivity ? partialActivity + '\n' + utils.textConverter(element.DESC_ACTIVITE) : utils.textConverter(element.DESC_ACTIVITE);
                    }
                    partialActivity += ' ' + element.HEURE_DEB_ACT + '-';
                    element.LIEU_DEB_ACT.trim().split(/\s/g).forEach((place) => {
                        partialActivity += utils.textConverter(place);
                    })
                    partialActivity += ' ' + element.HEURE_FIN_ACT + '-';
                    element.LIEU_FIN_ACT.trim().split(/\s/g).forEach((place) => {
                        partialActivity += utils.textConverter(place);
                    })

                    activityDetails.push(partialActivity);
                })
            }
        return activityDetails;
    }
}