const restingDay = {
    getRestData(restJson) {
        let restDatas = {};

        try {
            restDatas.month = restJson[0].DATE_JT.split('-')[1];
            restDatas.year = restJson[0].DATE_JT.split('-')[0];
            restDatas.restDays = restingDay._getRestDays(restJson);
        } catch (error) {
            console.error('[RDL Tools] Erreur lors de la récupération des données des jours de repos : ', error);
        }

        return restDatas;
    },

    _getRestDays(restJson) {
        let restDays = [];
        restJson.forEach((day) => {
            if (utils.restCode.includes(day.TID_CODE_SERVICE.trim())) {
                const restDay = new RestDay(
                    date = day.DATE_JT.split('-')[2],
                    restCode = day.TID_CODE_SERVICE.trim()
                );
                restDays.push(restDay);
            }
        })
        return restDays;
    }
}