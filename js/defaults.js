// Fichier centralisant les constantes par défaut de l'extension
// Utilisé par utils.js (content script) et options.js (page d'options)

const DEFAULT_ACTIVITY_MAPPING = {
    '(Aller)': null,
    '(Retour)': null,
    '(Sortie)': null,
    '(Entrée)': null,
    'Opération du véhicule': null,
    'Dép. de l\'emplacement précédent': 'Rappat.',
    'Dép. vers l\'emplacement suivant': 'Rappat.',
    'Pièce de disponibilité habillage': 'Dispo.',
    'T_PDVA': 'V1',
    'T_PDVD': 'V2',
    'T1_DO2': 'DD',
    'T_LASO': 'VS'
};
