/**
 * Module de génération et téléchargement de fichiers ICS (calendrier).
 * 
 * Responsabilités :
 * - Conversion des données d'activité (ActivityDay) en format ICS (iCalendar)
 * - Conversion des jours de repos (RestDays) en format ICS
 * - Génération et téléchargement du fichier ICS au format iCalendar 2.0
 * - Formatage des dates et heures selon la norme RFC 5545
 * 
 * Méthodes publiques :
 * - generateICSFile(activityToICS) : Génère et lance le téléchargement d'un fichier ICS
 *   Accepte ActivityDay (activité de travail) ou RestDays (jours de repos)
 */
const icsGenerator = {
    /**
     * 
     * @param {ActivityDay|RestDays} activityToICS - Les données de l'activité ou du jour de repos à inclure dans le fichier ICS
     */
    async generateICSFile(activityToICS) {
        let fileName;
        if (activityToICS instanceof ActivityDay) {
            const [year, month, day] = activityToICS.date.split('-');
            const fileNameDate = `${day} ${utils.convertDigitMonthToText(month)} ${year}`;
            fileName = `journée du ${fileNameDate}.ics`;
        }

        if (activityToICS instanceof RestDays) {
            fileName = `repos de ${utils.convertDigitMonthToText(activityToICS.month)} ${activityToICS.year}.ics`;
        }

        const icsFile = new Blob([await icsGenerator._generateICSData(activityToICS)], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(icsFile);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = fileName;
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
    },

    /**
     * 
     * @param {ActivityDay|RestDays} datas - Les données de l'activité ou du jour de repos à inclure dans le fichier ICS
     * @returns {string} - Le contenu du fichier ICS généré
     */
    _generateICSData(datas) {
        const escape = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
        const formatICSDateTime = (dateStr) => dateStr.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        const generateUID = (identifier) => `${identifier}-${Math.random().toString(36).slice(2)}@rdltools3.fr`;
        
        let icsDatas = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//RDL Tools//FR',
            'CALSCALE:GREGORIAN',
            icsGenerator._getVTimezoneComponent()
        ];

        if (datas instanceof ActivityDay) {
            const formatedStartTime = datas.startTime.replace('h', ':');
            const formatedEndTime = datas.endTime.replace('h', ':');
            const startDateAndTime = `${datas.date}T${formatedStartTime}:0000`;
            const endDateAndTime = `${datas.date}T${formatedEndTime}:0000`;
            const dtstamp = formatICSDateTime(new Date().toISOString().replace('Z', ''));

            icsDatas.push(
                'BEGIN:VEVENT',
                `DTSTART;TZID=Europe/Paris:${formatICSDateTime(startDateAndTime)}`,
                `DTEND;TZID=Europe/Paris:${formatICSDateTime(endDateAndTime)}`,
                `DTSTAMP:${dtstamp}Z`,
                `UID:${generateUID(startDateAndTime)}`,
                `SUMMARY:${escape(datas.line)} - ${escape(datas.service)} (${escape(datas.schedule)})`,
                `DESCRIPTION:${escape(datas.activityDetails.join('\r\n'))}`,
                'END:VEVENT'
            );
        }

        if (datas instanceof RestDays) {
            const dtStamp = formatICSDateTime(new Date().toISOString().replace('Z', '')) + 'Z';
            
            datas.restDays.forEach((restDay) => {
                const dateEvent = datas.year + datas.month + restDay.date;
                icsDatas.push(
                    'BEGIN:VEVENT',
                    `DTSTART;VALUE=DATE:${dateEvent}`,
                    `DTEND;VALUE=DATE:${icsGenerator._getNextDay(dateEvent)}`,
                    `DTSTAMP:${dtStamp}`,
                    `UID:${generateUID(dateEvent)}`,
                    `SUMMARY:${escape(restDay.restCode)}`,
                    'END:VEVENT'
                );
            });
        }

        icsDatas.push('END:VCALENDAR');

        return icsDatas.join('\r\n');
    },

    /**
     * Génère le composant VTIMEZONE pour Europe/Paris.
     * @returns {string} Le composant VTIMEZONE formaté
     */
    _getVTimezoneComponent() {
        const vtimezone = [
            'BEGIN:VTIMEZONE',
            'TZID:Europe/Paris',
            'BEGIN:STANDARD',
            'TZOFFSETFROM:+0200',
            'TZOFFSETTO:+0100',
            'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
            'DTSTART:19961027T030000',
            'TZNAME:CET',
            'END:STANDARD',
            'BEGIN:DAYLIGHT',
            'TZOFFSETFROM:+0100',
            'TZOFFSETTO:+0200',
            'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
            'DTSTART:19810329T020000',
            'TZNAME:CEST',
            'END:DAYLIGHT',
            'END:VTIMEZONE'
        ].join('\r\n');
        
        return vtimezone;
    },

    /**
     * Calcule le jour suivant au format ICS (YYYYMMDD).
     * Utilisé pour la fin des événements all-day (jours de repos).
     * @param {string} dateString Format YYYYMMDD
     * @returns {string} Le jour suivant au format YYYYMMDD
     */
    _getNextDay(dateString) {
        const year = parseInt(dateString.slice(0, 4), 10);
        const month = parseInt(dateString.slice(4, 6), 10) - 1;
        const day = parseInt(dateString.slice(6, 8), 10);

        const date = new Date(Date.UTC(year, month, day));
        const next = new Date(date.getTime() + 86400000);
        const pad = n => String(n).padStart(2, '0');

        return `${next.getUTCFullYear()}${pad(next.getUTCMonth() + 1)}${pad(next.getUTCDate())}`;
    }
}