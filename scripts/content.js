const modalVacationsElement = document.getElementById('modalVacations');
const selectListeMoisElement = document.getElementById('liste_mois_tr_id');
const mois = {
    janvier: '01', février: '02', mars: '03', avril: '04',
    mai: '05', juin: '06', juillet: '07', août: '08',
    septembre: '09', octobre: '10', novembre: '11', décembre: '12'
};

// +++++++ JOURS DE TRAVAIL +++++++

// On ne procède à la suite que si la modale existe
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

            const infosActivite = recupererInfosActivite();
            if (infosActivite == null || Object.keys(infosActivite).length === 0) {
                console.warn('[RDL Tools] Impossible de récupérer les informations de la journée. Veuillez vous assurer que les éléments nécessaires sont présents et contiennent des données valides.');
                return;
            }
            const donneesICS = creerDonneesICS(infosActivite);
            try {
                genererICS(donneesICS, `journée du ${infosActivite.date}`);
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

} else {
    console.warn('[RDL Tools] La modale nécessaire n\'a pas été trouvée. L\'ajout au calendrier ne sera pas possible.');
}

// ------- JOURS DE TRAVAIL -------

// +++++++ JOURS DE REPOS +++++++

if (selectListeMoisElement) {
    // console.log('[RDL Tools] Élément de sélection du mois trouvé, initialisation de la fonctionnalité d\'ajout des jours de repos au calendrier en cours...');

    const codesRepos = ['RN', 'RHE', 'HEC', 'CA', 'RX', 'FL'];

    const tableauRoulement = document.getElementById('tableau_roulement_id');

    // Création du bouton de repos
    const reposImage = document.createElement('img');
    reposImage.src = chrome.runtime.getURL('icons/repos-24.png');
    reposImage.alt = 'Ajouter les repos dans le calendrier';
    //reposImage.style.width = '24px';
    //reposImage.style.height = '24px';

    const reposButton = document.createElement('button');
    reposButton.type = 'button';
    //reposButton.style.display = 'none';
    reposButton.appendChild(reposImage);

    try {
        selectListeMoisElement.parentNode.before(reposButton);
    } catch (error) {
        console.error('[RDL Tools] Erreur lors de l\'ajout du bouton d\'ajout des repos au calendrier : ', error);
    }

    // Ajout de l'event listener
    reposButton.addEventListener('click', handleReposButtonClick);

    function handleReposButtonClick(event) {
        event.preventDefault();
        if (tableauRoulement.querySelectorAll('table').length > 0) {
            const infosRepos = recupererInfosRepos();
            if (infosRepos == null || Object.keys(infosRepos).length != 3) {
                console.warn('[RDL Tools] Impossible de récupérer les informations de repos. Veuillez vous assurer que l\'élément nécessaire est présent et contient des données valides.');
                return;
            }
            const donneesReposICS = creerDonneesReposICS(infosRepos.joursRepos, infosRepos.mois, infosRepos.annee);
            try {
                genererICS(donneesReposICS, `repos de ${convertirMoisEnTexte(infosRepos.mois)} ${infosRepos.annee}`);
            } catch (error) {
                console.error('[RDL Tools] Erreur lors de la génération du fichier ICS : ', error);
            }

        } else {
            console.warn('[RDL Tools] Impossible de récupérer les informations du tableau de roulement. Veuillez vous assurer que l\'élément nécessaire est présent et contient des données valides.');
        }
    }

    function recupererInfosRepos() {
        const infosRepos = {
                mois: recupererMoisSelectionne(),
                annee: recupererAnneeSelectionnee(),
                joursRepos: recupererJoursRepos()
        };
        return infosRepos;
    }

    function recupererAnneeSelectionnee(moisSelectionne) {
        const maintenant = new Date();
        if (moisSelectionne < (maintenant.getMonth() + 1)) {
            return maintenant.getFullYear() + 1;
        }
        return maintenant.getFullYear();

    }

    function recupererMoisSelectionne() {
        const moisSelectionne = selectListeMoisElement.value;
        return formaterMoisSur2Chiffres(moisSelectionne);
    }

    function recupererJoursRepos() {
        let joursRepos = [];
        const listeDesJoursDuMois = tableauRoulement.querySelectorAll('tr');
        listeDesJoursDuMois.forEach((jour) => {
            if (codesRepos.includes(jour.childNodes[1].innerText)) {
                const jourRepos = {
                    date: formaterMoisSur2Chiffres(jour.childNodes[0].innerText.split('. ')[1]),
                    code: jour.childNodes[1].innerText
                };
                joursRepos.push(jourRepos);
            }
        })
        return joursRepos;
    }

    function creerDonneesReposICS(joursRepos, mois, annee) {
        const escape = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
        const dtStamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '').replace('Z','');

        let donneesReposICS = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//RDL Tools//FR'
        ];

        joursRepos.forEach((jour) => {
            const dateEvenement = annee + mois + jour.date;
            donneesReposICS.push(
                'BEGIN:VEVENT',
                `DTSTART;VALUE=DATE:${dateEvenement}`,
                `DTEND;VALUE=DATE:${jourSuivant(dateEvenement)}`,
                `DTSTAMP:${dtStamp}`,
                `UID:${dateEvenement}-${Math.random().toString(36).slice(2)}@rdltools.fr`,
                `SUMMARY:${jour.code}`,
                'END:VEVENT'
            );
        });

        donneesReposICS.push('END:VCALENDAR');

        return donneesReposICS.join('\r\n');
    }


} else {
    console.warn('[RDL Tools] L\'élément de sélection du mois n\'a pas été trouvé. L\'ajout des jours de repos au calendrier ne sera pas possible.');
}


/**
 * Formate une date du format "DD MMMM YYYY" (ex. "10 juin 2024") au format "YYYY-MM-DD" (ex. "2024-06-10").
 * @param {*} date 
 * @returns {string} La date formatée au format ISO (YYYY-MM-DD)
 */
function formaterDate(date) {
    // Séparer le jour, le mois et l'année
    const [jour, moisNom, annee] = date.toLowerCase().split(' ');

    // Retourner au format ISO (YYYY‑MM‑DD)
    return `${annee}-${mois[moisNom]}-${jour.padStart(2, '0')}`;
}

/**
 * Convertit un numéro de mois en son nom correspondant (ex. "01" → "janvier").
 * @param {number|string} moisAConvertir - Le numéro du mois à convertir (ex. "01" pour janvier)
 * @returns {string|null} Le nom du mois correspondant ou null si le numéro n'est pas valide
 */
function convertirMoisEnTexte(moisAConvertir) {
    for (const [nomMois, numeroMois] of Object.entries(mois)) {
        if (numeroMois === moisAConvertir) {
            return String(nomMois);
        }
    } 
    return null;
}

/**
 * Ajout d'un zéro devant les mois de 1 à 9 pour les formater en MM
 * 
 * @param {number|string} mois - Le mois à formater 
 * @returns {string} Le mois formaté sur 2 chiffres
 */
function formaterMoisSur2Chiffres(mois) {
    return mois.length === 1 ? '0' + mois : mois;
}

/**
 * Retourne la date du jour suivant au format YYYYMMDD.
 * @param {string} amj - date au format "AAAAMMDD" (ex. "20240610")
 * @returns {string} - date du jour suivant au même format
 */
function jourSuivant(amj) {
  // Découpage de la chaîne
  const year  = parseInt(amj.slice(0, 4), 10);
  const month = parseInt(amj.slice(4, 6), 10) - 1; // mois 0‑based
  const day   = parseInt(amj.slice(6, 8), 10);

  // Création d’un objet Date en UTC pour éviter les décalages de fuseau
  const date = new Date(Date.UTC(year, month, day));

  // Ajout d’un jour (24 h = 86400000 ms)
  const next = new Date(date.getTime() + 86400000);

  // Formatage YYYYMMDD
  const pad = n => String(n).padStart(2, '0');
  return `${next.getUTCFullYear()}${pad(next.getUTCMonth() + 1)}${pad(next.getUTCDate())}`;
}

/**
 * Génère un fichier ICS à partir des données fournies et déclenche son téléchargement.
 * 
 * @param {*} data - Les données à inclure dans le fichier ICS, formatées selon les spécifications iCalendar
 * @param {string} nom - Le nom à donner au fichier ICS (sans extension)
 */
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