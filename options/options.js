const extensionApi = typeof browser !== 'undefined' ? browser : chrome;
const extensionEnabledKey = 'RDLToolsExtensionEnabled';
const surveyorEnabledKey = 'RDLToolsSurveyorEnabled';
const customActivityMappingKey = 'RDLToolsCustomActivityMapping';

const toggleElement = document.getElementById('extension-enabled');
const surveyorSettingsElement = document.getElementById('surveyor-settings');
const surveyorEnabledElement = document.getElementById('surveyor-enabled');
const activityMappingSettingsElement = document.getElementById('activity-mapping-settings');
const mappingListElement = document.getElementById('mapping-list');
const mappingInputKeyElement = document.getElementById('mapping-input-key');
const mappingInputValueElement = document.getElementById('mapping-input-value');
const mappingBtnAddElement = document.getElementById('mapping-btn-add');
const mappingBtnCancelElement = document.getElementById('mapping-btn-cancel');
const statusElement = document.getElementById('save-status');

let defaultActivityMapping = {};
let customActivityMapping = {};

// État pour l'édition
let editingKey = null;

async function loadSettings() {
    try {
        const storedValues = await extensionApi.storage.sync.get([extensionEnabledKey, surveyorEnabledKey, customActivityMappingKey]);
        const storedEnabledValue = storedValues && storedValues[extensionEnabledKey];
        const storedSurveyorValue = storedValues && storedValues[surveyorEnabledKey];
        const storedCustomMapping = storedValues && storedValues[customActivityMappingKey];
        const isEnabled = typeof storedEnabledValue === 'boolean' ? storedEnabledValue : true;
        const isSurveyorEnabled = typeof storedSurveyorValue === 'boolean' ? storedSurveyorValue : true;

        toggleElement.checked = isEnabled;
        surveyorEnabledElement.checked = isSurveyorEnabled;
        
        defaultActivityMapping = { ...DEFAULT_ACTIVITY_MAPPING };
        customActivityMapping = (storedCustomMapping && typeof storedCustomMapping === 'object') ? storedCustomMapping : {};
        
        updateIcsVisibility();
        renderMappingList();
        setStatus(isEnabled ? 'Extension active.' : 'Extension désactivée.');
    } catch (error) {
        setStatus('Impossible de lire les options.');
        console.error('[RDL Tools] Erreur lors du chargement des options :', error);
    }
}

async function saveSettings() {
    try {
        const isEnabled = toggleElement.checked;
        await extensionApi.storage.sync.set({ [extensionEnabledKey]: isEnabled });
        updateIcsVisibility();
        setStatus(isEnabled ? 'Extension activée.' : 'Extension désactivée.');
    } catch (error) {
        setStatus('Impossible d\'enregistrer les options.');
        console.error('[RDL Tools] Erreur lors de l\'enregistrement des options :', error);
    }
}

function updateIcsVisibility() {
    const isExtensionEnabled = toggleElement.checked;
    if (surveyorSettingsElement) {
        surveyorSettingsElement.hidden = !isExtensionEnabled;
    }
    if (activityMappingSettingsElement) {
        activityMappingSettingsElement.hidden = !isExtensionEnabled;
    }
    surveyorEnabledElement.disabled = !isExtensionEnabled;
}

function renderMappingList() {
    mappingListElement.innerHTML = '';

    const allMappings = { ...defaultActivityMapping, ...customActivityMapping };
    
    Object.entries(allMappings).forEach(([key, value]) => {
        const isDefault = key in defaultActivityMapping;
        const isModified = key in customActivityMapping;
        const itemDiv = document.createElement('div');
        itemDiv.className = `mapping-item ${isDefault && !isModified ? 'default' : ''}`;

        // Conteneur info
        const infoDiv = document.createElement('div');
        infoDiv.className = 'mapping-item-info';

        const keySpan = document.createElement('div');
        keySpan.className = 'mapping-item-key';
        keySpan.textContent = key;

        const arrowSpan = document.createElement('div');
        arrowSpan.className = 'mapping-item-arrow';
        arrowSpan.textContent = '→';

        const valueDiv = document.createElement('div');
        valueDiv.className = 'mapping-item-value';
        valueDiv.textContent = value === null || value === '' ? '(effacé)' : value;

        const badgeSpan = document.createElement('span');
        badgeSpan.className = 'mapping-item-badge';
        if (isDefault && !isModified) {
            badgeSpan.textContent = 'Défaut';
        } else if (isModified && !isDefault) {
            badgeSpan.textContent = 'Perso';
        } else {
            badgeSpan.textContent = 'Modifié';
        }

        infoDiv.appendChild(keySpan);
        infoDiv.appendChild(arrowSpan);
        infoDiv.appendChild(valueDiv);
        infoDiv.appendChild(badgeSpan);

        // Conteneur actions
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'mapping-item-actions';

        // Bouton Modifier
        const editBtn = document.createElement('button');
        editBtn.className = 'mapping-item-btn mapping-item-btn-edit btn-icon';
        editBtn.title = 'Modifier ce mappage';
        editBtn.setAttribute('aria-label', 'Modifier');
        const editImg = document.createElement('img');
        editImg.src = '../assets/modifier-24.png';
        editImg.alt = 'Modifier';
        editBtn.appendChild(editImg);
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editMapping(key, value);
        });

        actionsDiv.appendChild(editBtn);

        // Bouton Supprimer ou Restaurer
        if (isModified) {
            const actionBtn = document.createElement('button');
            actionBtn.className = 'mapping-item-btn btn-icon ' + (isDefault ? 'mapping-item-btn-restore' : 'mapping-item-btn-delete');
            actionBtn.title = isDefault ? 'Restaurer à la valeur par défaut' : 'Supprimer ce mappage';
            actionBtn.setAttribute('aria-label', isDefault ? 'Restaurer' : 'Supprimer');
            const actionImg = document.createElement('img');
            actionImg.alt = isDefault ? 'Restaurer' : 'Supprimer';
            if (isDefault) {
                actionImg.src = '../assets/annuler-24.png';
            } else {
                actionImg.src = '../assets/supprimer-24.png';
            }
            actionBtn.appendChild(actionImg);
            actionBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (isDefault) {
                    await restoreDefaultMapping(key);
                } else {
                    await deleteMapping(key);
                }
            });
            actionsDiv.appendChild(actionBtn);
        }

        itemDiv.appendChild(infoDiv);
        itemDiv.appendChild(actionsDiv);
        mappingListElement.appendChild(itemDiv);
    });
}

async function addMapping() {
    const key = mappingInputKeyElement.value.trim();
    const value = mappingInputValueElement.value.trim();

    if (!key) {
        setStatus('Le nom de l\'activité ne peut pas être vide.');
        return;
    }

    if (value.length > 15) {
        setStatus('Le raccourci ne peut pas dépasser 15 caractères.');
        return;
    }

    // Si on est en train d'éditer
    if (editingKey !== null) {
        // Supprimer l'ancienne clé si elle a changé
        if (editingKey !== key && editingKey in customActivityMapping) {
            delete customActivityMapping[editingKey];
        }
    }

    customActivityMapping[key] = value === '' ? null : value;
    await saveCustomMappings();
    clearFormAndCancel();
    renderMappingList();
    setStatus(editingKey !== null ? 'Mappage modifié avec succès.' : 'Mappage ajouté avec succès.');
}

function editMapping(key, value) {
    editingKey = key;
    mappingInputKeyElement.value = key;
    mappingInputValueElement.value = value === null || value === '' ? '' : value;
    
    // Changer le bouton "Ajouter" en "Modifier"
    mappingBtnAddElement.textContent = 'Modifier';
    mappingBtnAddElement.style.display = '';
    mappingBtnCancelElement.style.display = '';
    
    // Focus sur le premier champ
    mappingInputKeyElement.focus();
}

function clearFormAndCancel() {
    editingKey = null;
    mappingInputKeyElement.value = '';
    mappingInputValueElement.value = '';
    
    // Revenir au bouton "Ajouter"
    mappingBtnAddElement.textContent = 'Ajouter';
    mappingBtnCancelElement.style.display = 'none';
}

async function deleteMapping(key) {
    if (!(key in customActivityMapping)) {
        setStatus('Ce mappage n\'existe pas.');
        return;
    }

    delete customActivityMapping[key];
    await saveCustomMappings();
    if (editingKey === key) {
        clearFormAndCancel();
    }
    renderMappingList();
    setStatus('Mappage supprimé avec succès.');
}

async function restoreDefaultMapping(key) {
    if (!(key in defaultActivityMapping)) {
        setStatus('Ce mappage n\'a pas de valeur par défaut.');
        return;
    }

    delete customActivityMapping[key];
    await saveCustomMappings();
    if (editingKey === key) {
        clearFormAndCancel();
    }
    renderMappingList();
    setStatus('Valeur par défaut restaurée.');
}

async function saveCustomMappings() {
    try {
        await extensionApi.storage.sync.set({ [customActivityMappingKey]: customActivityMapping });
    } catch (error) {
        setStatus('Impossible d\'enregistrer les mappages.');
        console.error('[RDL Tools] Erreur lors de l\'enregistrement des mappages :', error);
    }
}

async function saveSurveyorSettings() {
    try {
        const isSurveyorEnabled = surveyorEnabledElement.checked;
        await extensionApi.storage.sync.set({ [surveyorEnabledKey]: isSurveyorEnabled });
        setStatus(isSurveyorEnabled ? 'Surveillance des journées activée.' : 'Surveillance des journées désactivée.');
    } catch (error) {
        setStatus('Impossible d\'enregistrer surveyorActivities.');
        console.error('[RDL Tools] Erreur lors de l\'enregistrement de surveyorActivities :', error);
    }
}

function setStatus(message) {
    statusElement.textContent = message;
}

toggleElement.addEventListener('change', saveSettings);
surveyorEnabledElement.addEventListener('change', saveSurveyorSettings);
mappingBtnAddElement.addEventListener('click', addMapping);
mappingBtnCancelElement.addEventListener('click', clearFormAndCancel);
mappingInputKeyElement.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addMapping();
});
mappingInputValueElement.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addMapping();
});

// Écouteur pour les changements de stockage en temps réel
extensionApi.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync') {
        if (customActivityMappingKey in changes) {
            const change = changes[customActivityMappingKey];
            customActivityMapping = (change.newValue && typeof change.newValue === 'object') ? change.newValue : {};
            renderMappingList();
            if (Object.keys(customActivityMapping).length > 0) {
                setStatus('Mappages mis à jour.');
            }
        }
        
        if (extensionEnabledKey in changes) {
            const change = changes[extensionEnabledKey];
            toggleElement.checked = change.newValue;
            updateIcsVisibility();
        }
        
        if (surveyorEnabledKey in changes) {
            const change = changes[surveyorEnabledKey];
            surveyorEnabledElement.checked = change.newValue;
        }
    }
});

loadSettings();
