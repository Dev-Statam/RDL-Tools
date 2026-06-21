const workingDay = {
    getActivityData() {
        let activityData = {};
        const headerServiceData = utils.$titleActiviteJournee.innerHTML;
        const listeActivitesJourneeData = utils.$listeActivitesJournee.childNodes[0].childNodes[0];

        try {
            activityData.service = workingDay._getService(headerServiceData);
            activityData.line = workingDay._getLine(headerServiceData);
            activityData.codeCDM = workingDay._getCodeCDM(headerServiceData);
            activityData.schedule = workingDay._getSchedule(headerServiceData);
            activityData.date = workingDay._getDate(headerServiceData);
            activityData.startTime = workingDay._getStartTime(listeActivitesJourneeData);
            activityData.endTime = workingDay._getEndTime(listeActivitesJourneeData);

            let activityDetails = [];
            if (listeActivitesJourneeData) {
                listeActivitesJourneeData.childNodes.forEach((element) => {
                    if (element != listeActivitesJourneeData.childNodes[0]) {
                        activityDetails.push(workingDay._getAndCleanActivity(element));
                    }
                })
            }
            activityData.activityDetails = activityDetails;

        } catch (error) {
            console.error('[RDL Tools] Erreur lors de la récupération des données de la journée : ', error);
        }

        return activityData;

    },

    _getLine(headerServiceData) {
        return headerServiceData.split('<br>')[2].split(/\s+/)[1].split('-')[0].trim();
    },

    _getService(headerServiceData) {
        return headerServiceData.split('<br>')[2].split(/\s+/)[1].split('-')[1].trim();
    },

    _getCodeCDM(headerServiceData) {
        return headerServiceData.split('<br>')[2].split(/\s+/)[0].trim();
    },

    _getSchedule(headerServiceData) {
        return headerServiceData.split('<br>')[2].split(/\s+/)[3].trim();
    },

    _getDate(headerServiceData) {
        return headerServiceData.split('<br>')[0].split(/\s+/).slice(-3).join(' ').trim();
    },

    _getStartTime(listeActivitesJourneeData) {
        const startActivity = listeActivitesJourneeData.childNodes[1];
        let startIndex = 3;
        if (startActivity.innerText && startActivity.childNodes[0].hasAttribute('colspan')) {
            startIndex = 1;
        }
        return startActivity.childNodes[startIndex].innerText.split(/\s+/)[0];
    },

    _getEndTime(listeActivitesJourneeData) {
        const endActivity = listeActivitesJourneeData.lastChild;
        return endActivity.lastChild.previousSibling.innerText.split(/\s+/)[0];
    },

    _getAndCleanActivity(activityToClean) {
        let texte = null;
        activityToClean.childNodes.forEach((element) => {
            if (element.innerText && element.hasAttribute('colspan')) {
                texte = texte ? texte + '\n' + utils.textConverter(element.innerText) : utils.textConverter(element.innerText);
            } else if (element.innerText && element == activityToClean.childNodes[2] && !activityToClean.childNodes[0].hasAttribute('colspan')) {
                texte = texte ? texte + ' ' + utils.textConverter(element.innerText) : utils.textConverter(element.innerText);
            } else if (element.innerText) {
                element.innerText.split(/\s+/).forEach((mot) => {
                    texte = texte ? texte + ' ' + utils.textConverter(mot) : utils.textConverter(mot);        
                })
            }
        })
        return texte.replace(/\s+/g, ' ').trim();    
    }
}