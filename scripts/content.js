const modalVacationsElement = document.getElementById('modalVacations');

// On ne procède à la suita que si la modale existe
if (modalVacationsElement) {
    // console.log('[RDL Tools] Modale trouvée, initialisation de l\'extension en cours...');

    const tableauConversions = {
        '(Aller)': null,
        '(Retour)': null,
        '(Sortie)': null,
        '(Entrée)': null,
        'Opération du véhicule': null,
        'Dép. de l\'emplacement précédent': 'Rappat.',
        'Dép. vers l\'emplacement suivant': 'Rappat.',
        'Pièce de disponibilité habillage': 'Dispo.',
        'DP_MEY': 'DZ',
        'T_MEZI': 'Q4',
        'T_PDVA': 'V1',
        'T_PDVD': 'V2',
        'T1_DO2': 'DD',
        'T_LASO': 'VS'
    };

    const headerActivite = document.getElementById('header_Activite');
    const listeActivitesJournee = document.getElementById('listeActivitesJournee');
    const titleActiviteJournee = document.getElementById('titleActiviteJournee');

    // Création du bouton de calendrier
    const calendarImage = document.createElement('img');
    calendarImage.src = chrome.runtime.getURL('icons/calendrier-24.png');
    calendarImage.alt = 'Ajouter la journée dans le calendrier';
    calendarImage.style.width = '24px';
    calendarImage.style.height = '24px';

    const calendarButton = document.createElement('button');
    calendarButton.classList.add('close');
    calendarButton.type = 'button';
    calendarButton.style.cssText = 'right: 7px!important; top: 45px!important';
    calendarButton.appendChild(calendarImage);

    // Ajout de l'event listener
    calendarButton.addEventListener('click', handlecalendarButtonClick);

    try {
        headerActivite.appendChild(calendarButton);
    } catch (error) {
        console.error('[RDL Tools] Erreur lors de l\'ajout du bouton d\'ajout au calendrier : ', error);
    }

    function handlecalendarButtonClick(event) {
        event.preventDefault();
        if (titleActiviteJournee 
            && listeActivitesJournee
            && titleActiviteJournee.innerText != null
            && titleActiviteJournee.innerText != ''
            && listeActivitesJournee.innerHTML != null
            && listeActivitesJournee.innerHTML != '') {

            const infosAcvtivite = recupererInfosActivite();
            if (infosAcvtivite == null || Object.keys(infosAcvtivite).length === 0) {
                console.warn('[RDL Tools] Impossible de récupérer les informations de la journée. Veuillez vous assurer que les éléments nécessaires sont présents et contiennent des données valides.');
                return;
            }
            const donneesICS = creerDonneesICS(infosAcvtivite);
            try {
                genererICS(donneesICS, infosAcvtivite.date);
            } catch (error) {
                console.error('[RDL Tools] Erreur lors de la génération du fichier ICS : ', error);
            }

        } else {
            console.warn('[RDL Tools] Impossible de récupérer les informations de la journée. Veuillez vous assurer que les éléments nécessaires sont présents et contiennent des données valides.');
        }
    }

    function recupererInfosActivite() {
        let infosActivite = {};

        // -- Récupération du titre de l'activité --
        const titreActivite = titleActiviteJournee.innerHTML.split('<br>')[2].split(/\s+/)[1]; // On prend uniquement le titre (sous forme "ligne-voiture") qui se situe en deuxième position sur la troisième ligne du titre
        infosActivite.titre = convertirTexte(titreActivite).replace('-', ' - ');

        // -- Récupération de la date de l'activité --
        const dateActivite = titleActiviteJournee.innerHTML.split('<br>')[0].split(/\s+/).slice(-3); // On prend les trois derniers éléments de la première ligne du titre qui correspondent à la date;
        infosActivite.date = dateActivite.join(' ');

        // -- Récupération de l'heure de début et de fin de l'activité --
        const debutActivite = listeActivitesJournee.childNodes[0].childNodes[0].childNodes[1]
        let indexDebut = 3;
        if (debutActivite.innerText && debutActivite.childNodes[0].hasAttribute('colspan')) {
            indexDebut = 1;
        }
        const heureDebutActivite = debutActivite.childNodes[indexDebut].innerText.split(/\s+/)[0];

        const finActivite = listeActivitesJournee.childNodes[0].childNodes[0].lastChild;
        const heureFinActivite = finActivite.lastChild.previousSibling.innerText.split(/\s+/)[0];

        infosActivite.heureDebut = heureDebutActivite;
        infosActivite.heureFin = heureFinActivite;

        // -- Récupération du détail de la journée --
        let descriptionActivite = '';
        if (listeActivitesJournee) {
            const detailJournee = listeActivitesJournee.childNodes[0].childNodes[0].childNodes;
            detailJournee.forEach((element) => {
                if (element != detailJournee[0]) {
                    descriptionActivite = descriptionActivite != '' ? descriptionActivite + '\r\n' + recupereEtNettoieLeTexte(element) : recupereEtNettoieLeTexte(element);
                }
            })
        }

        infosActivite.description = descriptionActivite;
        descriptionActivite = null; // Réinitialisation de la variable après utilisation

        return infosActivite;
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

    function creerDonneesICS(infosActivite) {
        const escape = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
        const dateFormatee = formaterDate(infosActivite.date);
        const heureDebutFormatee = infosActivite.heureDebut.replace('h', ':')
        const heureFinFormatee = infosActivite.heureFin.replace('h', ':');
        const dateEtHeureDebut = `${dateFormatee}T${heureDebutFormatee}:0000`;
        const dateEtHeureFin = `${dateFormatee}T${heureFinFormatee}:0000`;

        return [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//RDL Tools//FR',
            'BEGIN:VEVENT',
            `DTSTART:${dateEtHeureDebut.replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
            `DTEND:${dateEtHeureFin.replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
            `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '').replace('Z','')}`,
            `UID:${dateEtHeureDebut}-${Math.random().toString(36).slice(2)}@rdltools.fr`,
            `SUMMARY:${escape(infosActivite.titre)}`,
            `DESCRIPTION:${escape(infosActivite.description)}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');
    }

    function formaterDate(date) {
         // Mapping des mois français → numéro (01‑12)
        const mois = {
            janvier: '01', février: '02', mars: '03', avril: '04',
            mai: '05', juin: '06', juillet: '07', août: '08',
            septembre: '09', octobre: '10', novembre: '11', décembre: '12'
        };

        // Séparer le jour, le mois et l'année
        const [jour, moisNom, annee] = date.toLowerCase().split(' ');

        // Retourner au format ISO (YYYY‑MM‑DD)
        return `${annee}-${mois[moisNom]}-${jour.padStart(2, '0')}`;
    }

    function genererICS(data, nom) {
        const ficherICS = new Blob([data], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(ficherICS);
        const lienTelechargement = document.createElement('a');
        lienTelechargement.href = url;
        lienTelechargement.download = `journéé du ${nom}.ics`;
        lienTelechargement.style.display = 'none';
        document.body.appendChild(lienTelechargement);
        lienTelechargement.click();
        document.body.removeChild(lienTelechargement);
        URL.revokeObjectURL(url);
    }

} else {
    console.warn('[RDL Tools] La modale nécessaire n\'a pas été trouvée. L\'ajout au calendrier ne sera pas possible.');
}