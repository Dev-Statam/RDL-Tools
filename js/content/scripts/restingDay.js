const restingDay = {
    getRestData() {
        let restDatas = {};

        try {
            restDatas.month = restingDay._getSelectedMonth();
            restDatas.year = restingDay._getSelectedYear(restDatas.month);
            restDatas.restDays = restingDay._getRestDays();
        } catch (error) {
            console.error('[RDL Tools] Erreur lors de la récupération des données des jours de repos : ', error);
        }

        return restDatas;
    },

    _getSelectedMonth() {
        return utils.$selectListeMoisElement.value.padStart(2, '0');
    },

    _getSelectedYear(selectedMonth) {
        const currentDate = new Date();
        if (selectedMonth < (currentDate.getMonth() + 1)) {
            return currentDate.getFullYear() + 1;
        }
        return currentDate.getFullYear();
    },

    _getRestDays() {
        let restDays = [];
        utils.$tableauRoulementElement.querySelectorAll('tr').forEach((day) => {
            if (utils.restCode.includes(day.childNodes[1].innerText.trim())) {
                const restDay = new RestDay(
                    date = day.childNodes[0].innerText.split('. ')[1].padStart(2, '0'),
                    restCode = day.childNodes[1].innerText.trim()
                );
                restDays.push(restDay);
            }
        })
        return restDays;
    }
}