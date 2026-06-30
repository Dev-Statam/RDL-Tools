const content = {
    extensionApi: null,

    async init() {
        content.extensionApi = utils.extensionApi;
        surveyorActivities.init(content.extensionApi);
        await surveyorActivities.sanitizeStoredActivities();
        await surveyorActivities.surveyTableauRoulement();

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
        content._observeActivityClicks();
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
        await surveyorActivities.persistPendingActivity(activityData);
        await surveyorActivities.surveyTableauRoulement();
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
            await surveyorActivities.surveyTableauRoulement();
        });

        const observer = new MutationObserver(async (mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const isVisible = utils.$selectListeMoisElement.style.display !== 'none';
                    $element.style.display = isVisible ? 'flex' : 'none';
                    
                    // Si le select vient de devenir visible, surveiller le tableau
                    if (isVisible) {
                        await surveyorActivities.surveyTableauRoulement();
                    }
                }
            }
        });

        const config = { attributes: true, attributeFilter: ['style'] };

        observer.observe(utils.$selectListeMoisElement, config);
    }
}

content.init();