const content = {
    init() {
        const $calendarButton = calendarButton.createCalendarButton();
        const $restButton = restButton.createRestButton();

        try {
            utils.$headerActivite.appendChild($calendarButton);
            $calendarButton.addEventListener('click', content._handleCalendarButtonClick);
        } catch (error) {
            console.error('[RDL Tools] Erreur lors de l\'ajout du bouton d\'ajout au calendrier : ', error);
        }

        try {
            utils.$selectListeMoisElement.parentNode.before($restButton);
            $restButton.addEventListener('click', content._handleRestButtonClick);
        } catch (error) {
            console.error('[RDL Tools] Erreur lors de l\'ajout du bouton d\'ajout des jours de repos au calendrier : ', error);
        }
    },

    _handleCalendarButtonClick(event) {
        event.preventDefault();
        if (utils.$titleActiviteJournee 
            && utils.$listeActivitesJournee
            && utils.$titleActiviteJournee.innerText != null
            && utils.$titleActiviteJournee.innerText != ''
            && utils.$listeActivitesJournee.innerHTML != null
            && utils.$listeActivitesJournee.innerHTML != '' ) {

            content._workingDayToCalendar();

        } else {
            console.warn('[RDL Tools] Impossible de récupérer les informations de la journée. Veuillez vous assurer que les éléments nécessaires sont présents et contiennent des données valides.');
        }
    },

    _handleRestButtonClick(event) {
        event.preventDefault();
        if (utils.$tableauRoulementElement.querySelectorAll('table').length > 0) {
            content._restDaysToCalendar();
        } else {
            console.warn('[RDL Tools] Impossible de récupérer les informations du tableau de roulement. Veuillez vous assurer que l\'élément nécessaire est présent et contient des données valides.');
        }
    },

    async _workingDayToCalendar() {
        const activityData = await workingDay.getActivityData();
        icsGenerator.generateICSFile(new ActivityDay(activityData));
    },

    async _restDaysToCalendar() {
        const restData = await restingDay.getRestData();
        icsGenerator.generateICSFile(new RestDays(month = restData.month, year = restData.year, restDays = restData.restDays));
    }

}

content.init();