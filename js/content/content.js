const content = {
    init() {
        const extensionApi = typeof browser !== 'undefined' ? browser : chrome;
        if (extensionApi.runtime && extensionApi.runtime.onMessage) {
            extensionApi.runtime.onMessage.addListener((message) => {
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
        const $restButton = restButton.createRestButton();
        $restButton.style.display  = 'none';

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

        content.mutationObserver($restButton);
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
        icsGenerator.generateICSFile(new ActivityDay(activityData));
    },

    async _restDaysToCalendar() {
        const restData = await restingDay.getRestData(content.restJson);
        icsGenerator.generateICSFile(new RestDays(month = restData.month, year = restData.year, restDays = restData.restDays));
    },

    mutationObserver($element) {
        $element.style.display = 'none';

        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    $element.style.display = utils.$selectListeMoisElement.style.display === 'none' ? 'none' : 'flex';
                }
            }
        });

        const config = { attributes: true, attributeFilter: ['style'] };

        observer.observe(utils.$selectListeMoisElement, config);
    }
}

content.init();