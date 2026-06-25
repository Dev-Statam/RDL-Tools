const icsGenerator = {
    /**
     * 
     * @param {ActivityDay|RestDays} activityToICS - Les données de l'activité ou du jour de repos à inclure dans le fichier ICS
     */
    async generateICSFile(activityToICS) {
        let fileName;
        if (activityToICS instanceof ActivityDay) {
            fileNameDate = activityToICS.date.split('-')[2] + ' ' + utils.convertDigitMonthToText(activityToICS.date.split('-')[1]) + ' ' + activityToICS.date.split('-')[0];
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
        let icsDatas = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//RDL Tools//FR'
        ];

        if (datas instanceof ActivityDay) {
            // const formatedDate = icsGenerator._dateFormate(datas.date);
            const formatedStartTime = datas.startTime.replace('h', ':')
            const formatedEndTime = datas.endTime.replace('h', ':');
            const startDateAndTime = `${datas.date}T${formatedStartTime}:0000`;
            const endDateAndTime = `${datas.date}T${formatedEndTime}:0000`;

            icsDatas.push(
                'BEGIN:VEVENT',
                `DTSTART:${startDateAndTime.replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
                `DTEND:${endDateAndTime.replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
                `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '').replace('Z','')}`,
                `UID:${startDateAndTime}-${Math.random().toString(36).slice(2)}@rdltools.fr`,
                `SUMMARY:${escape(datas.line)} - ${escape(datas.service)} (${escape(datas.schedule)})`,
                `DESCRIPTION:${escape(datas.activityDetails.join('\r\n'))}`,
                'END:VEVENT'
            );
        }

        if (datas instanceof RestDays) {
            const dtStamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '').replace('Z','');
            
            datas.restDays.forEach((restDay) => {
                const dateEvent = datas.year + datas.month + restDay.date;
                icsDatas.push(
                    'BEGIN:VEVENT',
                    `DTSTART;VALUE=DATE:${dateEvent}`,
                    `DTEND;VALUE=DATE:${icsGenerator._getNextDay(dateEvent)}`,
                    `DTSTAMP:${dtStamp}`,
                    `UID:${dateEvent}-${Math.random().toString(36).slice(2)}@rdltools.fr`,
                    `SUMMARY:${escape(restDay.restCode)}`,
                    'END:VEVENT'
                );
            });
        }

        icsDatas.push('END:VCALENDAR');

        return icsDatas.join('\r\n');
    },

    /**
     * Formate une date du format "DD MMMM YYYY" (ex. "10 juin 2024") au format "YYYY-MM-DD" (ex. "2024-06-10").
     * @param {string} date 
     * @returns {string} La date formatée au format ISO (YYYY-MM-DD)
     */
    _dateFormate(date) {
        // Séparer le jour, le mois et l'année
        const [day, monthName, year] = date.toLowerCase().split(' ');

        // Retourner au format ISO (YYYY‑MM‑DD)
        return `${year}-${utils.arrayMonthsConvert[monthName]}-${day.padStart(2, '0')}`;
    },

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