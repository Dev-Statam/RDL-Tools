/**
 * Script d'arrière-plan pour intercepter et enregistrer les réponses JSON de l'endpoint API spécifié.
 * Le script ne modifie pas les réponses, il se contente de les enregistrer.
 */
browser.webRequest.onBeforeRequest.addListener(
    async details => {
        if (details.method !== "GET") return;

        const filter = browser.webRequest.filterResponseData(details.requestId);
        const decoder = new TextDecoder("utf-8");
        const encoder = new TextEncoder();

        let data = '';

        filter.ondata = event => {
            data += decoder.decode(event.data, { stream: true });
        };

        filter.onstop = async () => {
            let json;
            try {
               json = JSON.parse(data);
            } catch (error) {
                console.error("[RDL Tools] Erreur lors de la lecture des données du serveur (parsing JSON) : ", error);
                filter.write(encoder.encode(data));
                filter.disconnect();
                return; // Arrête l'exécution si le JSON est invalide
            }

            if (details.tabId !== -1) {
                if (details.url.toLowerCase().includes("/activitesJournee/".toLowerCase())) {
                    browser.tabs.sendMessage(
                        details.tabId,
                        { type: "activity-json", payload: json }
                    ).catch(error => {
                        console.error("[RDL Tools] Erreur lors de l'envoie des informations au script-content : ", error);
                    });
                }

                if (details.url.toLowerCase().includes("/roulement-month/".toLowerCase())) {
                    browser.tabs.sendMessage(
                        details.tabId,
                        { type: "rest-json", payload: json }
                    ).catch(error => {
                        console.error("[RDL Tools] Erreur lors de l'envoie des informations au script-content : ", error);
                    });
                }
            }
            filter.write(encoder.encode(data));
            filter.disconnect();
        };


    },
    { urls: ["https://srv-voitures.ml.tcl.fr/api/activitesJournee/*", "https://srv-voitures.ml.tcl.fr/api/roulement-month/*"], types: ["xmlhttprequest"]},
    ["blocking"]

);