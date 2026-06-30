/**
 * Module d'extraction et traitement des jours de repos.
 * 
 * Responsabilités :
 * - Extraction des données de jours de repos depuis le JSON de l'API
 * - Filtrage des jours selon les codes de service définis (utils.restCode)
 * - Construction d'objets RestDay avec date et code de repos
 * 
 * Méthodes publiques :
 * - getRestData(restJson) : Extrait les données des jours de repos et retourne un objet
 *   contenant l'année, le mois et la liste des jours de repos
 */
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