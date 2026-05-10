const headerActivite = document.getElementById('header_Activite');

// On ne procède à la suita que si la modale existe
if (headerActivite) {

    const tableauConversions = {
        '(Aller)': null,
        '(Retour)': null,
        '(Sortie)': null,
        '(Entrée)': null,
        'Opération du véhicule': null,
        'Dép. de l\'emplacement précédent': 'Rappat.',
        'Pièce de disponibilité habillage': 'Dispo.',
        'DP_MEY': 'DZ',
        'T_MEZI': 'Q4',
        'T_PDVA': 'V1',
        'T_PDVD': 'V2',
        'T1_DO2': 'DD',
        'T_LASO': 'VS'
    };

    let textToClipboard = null;

    // Création du bouton de clipboard
    const clipboardImage = document.createElement('img');
    clipboardImage.src = chrome.runtime.getURL('icons/clipboard-24.png');
    clipboardImage.alt = 'Copier le détail de la journée dans le presse-papier';
    clipboardImage.style.width = '24px';
    clipboardImage.style.height = '24px';

    const clipboardButton = document.createElement('button');
    clipboardButton.classList.add('close');
    clipboardButton.type = 'button';
    clipboardButton.style.cssText = 'right: 7px!important; top: 45px!important';
    clipboardButton.appendChild(clipboardImage);

    // Ajout de l'event listener
    clipboardButton.addEventListener('click', handleClipboardButtonClick);

    try {
        headerActivite.appendChild(clipboardButton);
    } catch (error) {
        console.error('[RDL Tools] Erreur lors de l\'ajout du bouton de copie : ', error);
    }

    function handleClipboardButtonClick(event) {
        event.preventDefault();
        const listeActivitesJournee = document.getElementById('listeActivitesJournee');
        if (listeActivitesJournee) {
            const detailJournee = listeActivitesJournee.childNodes[0].childNodes[0].childNodes;

            detailJournee.forEach((element) => {
                if (element != detailJournee[0]) {
                    textToClipboard = textToClipboard ? textToClipboard + '\n' + recupereEtNettoieLeTexte(element) : recupereEtNettoieLeTexte(element);
                }
            })

            copyTextToClipboard(textToClipboard);
            textToClipboard = null; // Réinitialisation de la variable après utilisation
        }
    }

    function recupereEtNettoieLeTexte(partieDeLaJournée) {
        let texte = null;
        partieDeLaJournée.childNodes.forEach((element) => {
            if (element.innerText && element.hasAttribute('colspan')) {
                texte = texte ? texte + '\n' + convertirTexte(element.innerText) : convertirTexte(element.innerText);
            } else if (element.innerText && element == partieDeLaJournée.childNodes[2] && !partieDeLaJournée.childNodes[0].hasAttribute('colspan')) {
                texte = texte ? texte + ' ' + convertirTexte(element.innerText) : convertirTexte(element.innerText);
            } else if (element.innerText) {
                element.innerText.split(/\s+/).forEach((mot) => {
                    texte = texte ? texte + ' ' + convertirTexte(mot) : convertirTexte(mot);        
                })
            }
        })
        return texte.replace(/\s+/g, ' ').trim();    
    }

    function convertirTexte(texteAConvertir) {
        if (tableauConversions[texteAConvertir] === null || tableauConversions[texteAConvertir] === '') {
            return '';
        }

        return tableauConversions[texteAConvertir] || texteAConvertir;
    }

    function copyTextToClipboard(text) {
        try {
            navigator.clipboard.writeText(text);
            console.log('Text copié dans le presse-papier !');
        } catch (err) {
            console.error('Erreur lors de la copie dans le presse-papier : ', err);
        }
        return;
    }

} else {
    console.warn('[RDL Tools] La modale nécessaire n\'a pas été trouvée. Le bouton de copie ne sera pas ajouté.');
}