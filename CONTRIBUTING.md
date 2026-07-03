# Guide des contributeurs — RDL Tools

Ce document s'adresse aux développeurs souhaitant comprendre l'architecture de l'extension ou y contribuer.

---

## Table des matières

1. [Architecture générale](#architecture-générale)
2. [Conventions de nommage](#conventions-de-nommage)
3. [Module `content`](#module-content)
4. [Modules scripts](#modules-scripts)
   - [`utils`](#utils)
   - [`networkBridge`](#networkbridge)
   - [`pageNetworkInterceptor`](#pagenetworkinterceptor)
   - [`workingDay`](#workingday)
   - [`restingDay`](#restingday)
   - [`icsGenerator`](#icsgenerator)
   - [`surveyorActivities`](#surveyoractivities)
5. [Templates DOM](#templates-dom)
   - [`calendarButton`](#calendarbutton)
   - [`restButton`](#restbutton)
   - [`warningCalendarIcon`](#warningcalendaricon)
6. [Classes de données](#classes-de-données)
   - [`ActivityDay`](#activityday)
   - [`RestDay` / `RestDays`](#restday--restdays)
7. [Récupération des données JSON depuis le réseau](#récupération-des-données-json-depuis-le-réseau)
8. [Clés de stockage](#clés-de-stockage)

---

## Architecture générale

L'extension s'active sur la page `https://srv-voitures.ml.tcl.fr/roulement`. Les scripts sont injectés dans l'ordre déclaré dans `manifest.json` :

```
js/defaults.js
js/content/scripts/networkBridge.js        ← injecte le page script
js/content/scripts/utils.js               ← constantes et helpers partagés
js/content/templates/calendarButton.js
js/content/templates/restButton.js
js/content/templates/warningCalendarIcon.js
js/content/Classes/ActivityDay.js
js/content/Classes/RestDay.js
js/content/scripts/icsGenerator.js
js/content/scripts/workingDay.js
js/content/scripts/restingDay.js
js/content/scripts/surveyorActivities.js
js/content/content.js                     ← point d'entrée, appelle content.init()
```

**Flux de données simplifié :**

```
Page web → fetch/XHR → pageNetworkInterceptor
                              ↓ window.postMessage
                         networkBridge (content script)
                              ↓ event 'message'
                           content._updateJsonCache()
                              ↓ (sur clic bouton)
               workingDay / restingDay → icsGenerator → téléchargement .ics
```

---

## Conventions de nommage

| Convention | Signification | Exemple |
|---|---|---|
| `$` en préfixe | Variable contenant un élément du DOM | `$calendarButton`, `$headerActivite` |
| `_` en préfixe | Méthode ou propriété privée (usage interne au module) | `_generateICSData()`, `_getLine()` |
| Noms en camelCase | Méthodes et propriétés publiques | `getActivityData()`, `generateICSFile()` |
| Noms en SCREAMING_SNAKE_CASE | Constantes globales | `DEFAULT_ACTIVITY_MAPPING` |

---

## Module `content`

**Fichier :** `js/content/content.js`

Point d'entrée de l'extension. Orchestre l'initialisation de tous les modules et gère les interactions utilisateur (clics sur les boutons).

### Propriétés

| Propriété | Type | Description |
|---|---|---|
| `extensionApi` | `object` | Référence vers `browser` ou `chrome` selon le navigateur |
| `surveyorEnabled` | `boolean` | Indique si le surveyor d'activités est actif |
| `activityJson` | `object` | Cache du dernier JSON d'activité reçu depuis l'API |
| `restJson` | `array` | Cache du dernier JSON de roulement reçu depuis l'API |

### Méthodes publiques

#### `init()`
Point d'entrée asynchrone, appelé automatiquement au chargement du script. Réalise dans l'ordre :
1. Initialise `utils.extensionApi` et le mapping d'activités.
2. Charge les paramètres utilisateur (`_loadSettings`).
3. Si l'extension est activée, initialise le surveyor si nécessaire.
4. Met en place les écouteurs de messages réseau (`runtime.onMessage` et `window.addEventListener('message', ...)`).
5. Crée et insère le bouton calendrier (`calendarButton`) dans le header d'activité.
6. Crée et insère le bouton repos (`restButton`) à côté du sélecteur de mois.
7. Si le surveyor est actif, installe l'écouteur de clics sur les activités.

#### `mutationObserver($element)`
Observe les changements d'attribut `style` sur le sélecteur de mois (`$selectListeMoisElement`) pour afficher/masquer le bouton repos en synchronisation avec le panneau de roulement. Relance également `surveyTableauRoulement()` à chaque fois que le panneau devient visible ou que le mois change.

### Méthodes privées

#### `_loadSettings()` → `{ isEnabled, surveyorEnabled }`
Lit les clés `RDLToolsExtensionEnabled` et `RDLToolsSurveyorEnabled` dans `storage.sync`. Retourne `true` par défaut si les clés sont absentes ou si la lecture échoue.

#### `_updateJsonCache(message)`
Reçoit les messages du bridge réseau et met à jour `content.activityJson` (type `activity-json`) ou `content.restJson` (type `rest-json`).

#### `_observeActivityClicks()`
Installe un écouteur `click` en mode capture sur le `document` entier. Délègue chaque clic à `surveyorActivities.captureClickedActivity()`.

#### `_handleCalendarButtonClick(event)`
Gestionnaire du clic sur le bouton calendrier. Vérifie que `activityJson` contient des activités avant d'appeler `_workingDayToCalendar()`.

#### `_handleRestButtonClick(event)`
Gestionnaire du clic sur le bouton repos. Vérifie que `restJson` est non vide avant d'appeler `_restDaysToCalendar()`.

#### `_workingDayToCalendar()`
Orchestre la génération du fichier ICS pour une journée de travail :
1. Extrait les données via `workingDay.getActivityData()`.
2. Génère et télécharge le fichier via `icsGenerator.generateICSFile()`.
3. Si le surveyor est actif, persiste l'activité en attente et relance le survey.

#### `_restDaysToCalendar()`
Orchestre la génération du fichier ICS pour les jours de repos :
1. Extrait les données via `restingDay.getRestData()`.
2. Génère et télécharge le fichier via `icsGenerator.generateICSFile()`.

---

## Modules scripts

### `utils`

**Fichier :** `js/content/scripts/utils.js`

Module de constantes et utilitaires partagés entre tous les autres scripts.

#### Propriétés notables

| Propriété | Description |
|---|---|
| `extensionApi` | `browser` ou `chrome` selon le navigateur détecté |
| `$selectListeMoisElement` | Référence DOM du sélecteur de mois (`#liste_mois_tr_id`) |
| `$headerActivite` | Référence DOM du header d'activité (`#header_Activite`) |
| `$tableauRoulementElement` | Référence DOM du tableau de roulement (`#tableau_roulement_id`) |
| `storageKeys` | Objet centralisant toutes les clés de stockage utilisées |
| `restCode` | Tableau des codes de service considérés comme jours de repos : `['RN', 'RHE', 'HEC', 'CA', 'RX', 'FL', 'LN', 'RCR']` |
| `arrayMonthsConvert` | Mapping texte → numéro de mois (ex. `'janvier' → '01'`) |
| `assets` | Chemins relatifs des assets de l'extension |
| `messages` | Textes des messages affichés à l'utilisateur |

#### Méthodes publiques

##### `initActivityMapping()` *(async)*
Construit le mapping d'activités fusionné (`_mergedActivityMapping`) en combinant le mapping par défaut (`DEFAULT_ACTIVITY_MAPPING` défini dans `defaults.js`) avec les personnalisations stockées dans `storage.sync` sous la clé `RDLToolsCustomActivityMapping`. Doit être appelé avant tout usage de `textConverter()`.

##### `textConverter(textToConvert)` → `string`
Convertit un code ou libellé d'activité en son équivalent abrégé, en utilisant `_mergedActivityMapping`. La recherche est insensible à la casse. Retourne le texte d'entrée inchangé si aucune correspondance n'est trouvée, et une chaîne vide si la valeur mappée est `null` ou `''`.

##### `convertDigitMonthToText(monthDigit)` → `string`
Convertit un numéro de mois sur deux chiffres (ex. `'03'`) en son nom en français (`'mars'`).

##### `parseFindActivitesJournee(onclickValue)` → `{ date, schedule, ligne } | null`
Parse la valeur de l'attribut `onclick` des liens du tableau de roulement. Extrait la date ISO, le roulement et la ligne à partir de l'appel `findActivitesJournee(...)`. Retourne `null` si le format ne correspond pas.

##### `isIsoDate(value)` → `boolean`
Vérifie qu'une valeur est une chaîne au format `YYYY-MM-DD`.

##### `getTodayLocalDateString()` → `string`
Retourne la date du jour au format `YYYY-MM-DD` en heure locale.

##### `getRuntimeURL(path)` → `string`
Retourne l'URL complète d'une ressource de l'extension via `extensionApi.runtime.getURL()`.

---

### `networkBridge`

**Fichier :** `js/content/scripts/networkBridge.js`

Bridge de communication entre le content script et le script de page (`pageNetworkInterceptor.js`). Contourne la restriction d'accès direct au réseau depuis le contexte de page.

> **Exécution automatique :** `networkBridge.init()` est appelé immédiatement au chargement du fichier.

#### `init()`
Crée un élément `<script>` pointant vers `pageNetworkInterceptor.js` et l'injecte dans le `<head>` de la page. Ce script s'exécute dans le contexte de la page (accès complet à `window.fetch` et `XMLHttpRequest`). L'élément script est supprimé du DOM après son chargement.

#### `isFromBridge(event)` → `boolean`
Filtre de sécurité à appliquer sur chaque message `window` reçu. Retourne `true` uniquement si le message provient de la même fenêtre et porte la propriété `source: 'rdl-tools-page-bridge'`. Permet d'ignorer les messages d'origines tierces.

---

### `pageNetworkInterceptor`

**Fichier :** `js/content/scripts/pageNetworkInterceptor.js`

Script injecté dans le contexte de la **page** (non du content script) par `networkBridge`. Il intercepte les requêtes réseau sortantes pour en extraire les réponses JSON utiles à l'extension.

#### Fonctionnement

Le script s'exécute en IIFE auto-protégée (garde `window.__rdlToolsInterceptorInstalled` pour éviter une double installation).

Il surcharge deux APIs web :

- **`window.fetch`** : clone la réponse, parse le corps en JSON, puis appelle `capturePayload()`.
- **`XMLHttpRequest.prototype.open` / `.send`** : mémorise l'URL de la requête et, sur l'événement `load`, parse `responseText` pour appeler `capturePayload()`. Seules les requêtes `GET` sont traitées.

#### Endpoints surveillés

| URL (partielle) | Type de message émis |
|---|---|
| `/api/activitesJournee/` | `activity-json` |
| `/api/roulement-month/` | `rest-json` |

#### Communication vers le content script

Lorsqu'une réponse JSON correspondante est détectée, le script émet un `window.postMessage` avec la structure suivante :

```json
{
  "source": "rdl-tools-page-bridge",
  "type": "activity-json",
  "payload": { ... }
}
```

Ce message est reçu et filtré par `networkBridge.isFromBridge()` dans le content script, puis transmis à `content._updateJsonCache()`.

---

### `workingDay`

**Fichier :** `js/content/scripts/workingDay.js`

Extrait les données d'une journée de travail depuis le JSON retourné par l'API `/api/activitesJournee/`.

#### `getActivityData(activityJson)` → `object`
Méthode publique principale. Extrait et retourne un objet contenant :

| Champ | Source JSON | Description |
|---|---|---|
| `service` | `Activites[0].CODE_SERVICE` | Numéro de service (partie après le tiret) |
| `line` | `Activites[0].LIGNE_ACTIVITE` | Ligne de transport |
| `codeCDM` | `Activites[0].CODE_UNITE_HORAIRE` | Code CDM de l'unité horaire |
| `schedule` | `Titre` | Roulement (dernière partie du titre) |
| `date` | `Activites[0].DATE_JOUR_TRAVAIL` | Date au format ISO |
| `startTime` | `Activites[0].HEURE_DEB_ACT` | Heure de début de service |
| `endTime` | `Activites[-1].HEURE_FIN_ACT` | Heure de fin (dernière activité) |
| `activityDetails` | `Activites[]` | Tableau de chaînes détaillant chaque activité |

Les méthodes privées `_getLine()`, `_getService()`, `_getCodeCDM()`, `_getSchedule()`, `_getDate()`, `_getStartTime()`, `_getEndTime()` et `_getActivityDetails()` réalisent chacune l'extraction d'un champ spécifique.

`_getActivityDetails()` formate chaque activité en une chaîne `<ligne/description> <heure_début>-<lieu_début> <heure_fin>-<lieu_fin>`, en passant les libellés par `utils.textConverter()`.

---

### `restingDay`

**Fichier :** `js/content/scripts/restingDay.js`

Extrait les données de jours de repos depuis le JSON retourné par l'API `/api/roulement-month/`.

#### `getRestData(restJson)` → `{ month, year, restDays }`
Méthode publique principale. Lit le premier élément du tableau pour extraire le mois et l'année, puis délègue à `_getRestDays()`.

#### `_getRestDays(restJson)` → `RestDay[]`
Filtre les éléments dont `TID_CODE_SERVICE` figure dans `utils.restCode` et retourne un tableau d'instances `RestDay`.

---

### `icsGenerator`

**Fichier :** `js/content/scripts/icsGenerator.js`

Génère et déclenche le téléchargement d'un fichier `.ics` (format iCalendar RFC 5545).

#### `generateICSFile(activityToICS)` *(async)*
Méthode publique. Accepte une instance `ActivityDay` ou `RestDays` :
- Calcule le nom du fichier à télécharger.
- Génère le contenu ICS via `_generateICSData()`.
- Crée un `Blob` de type `text/calendar`, l'attache à un lien temporaire `<a>` et déclenche un clic programmatique pour le téléchargement.

#### `_generateICSData(datas)` → `string`
Construit le contenu textuel du fichier ICS :
- Pour `ActivityDay` : crée un `VEVENT` avec `DTSTART`/`DTEND` en heure Europe/Paris, `SUMMARY` = `<ligne> - <service> (<roulement>)`, `DESCRIPTION` = liste des détails d'activité.
- Pour `RestDays` : crée un `VEVENT` par jour de repos en mode `ALL-DAY` (`VALUE=DATE`).
- Inclut toujours le composant `VTIMEZONE` Europe/Paris (heure d'été/hiver).

#### `_getVTimezoneComponent()` → `string`
Retourne le bloc `VTIMEZONE` complet pour le fuseau `Europe/Paris` avec les règles RRULE d'heure d'été et d'hiver.

#### `_getNextDay(dateString)` → `string`
Calcule le lendemain d'une date au format `YYYYMMDD` (utilisé pour `DTEND` des événements all-day).

---

### `surveyorActivities`

**Fichier :** `js/content/scripts/surveyorActivities.js`

Gère la persistance et la surveillance des activités pour détecter les modifications de service depuis le dernier enregistrement.

#### Méthodes publiques

##### `init(extensionApi)`
Initialise le module avec l'API de l'extension (`browser` ou `chrome`). Doit être appelée avant toute autre méthode.

##### `captureClickedActivity(target)`
Appelée sur chaque clic dans le document. Si la cible est un lien `<a onclick>` contenu dans le tableau de roulement, parse l'attribut `onclick` via `utils.parseFindActivitesJournee()` et stocke le résultat dans `pendingActivity`.

##### `sanitizeStoredActivities()` *(async)*
Nettoie les activités stockées dans `storage.sync` et `localStorage` :
- Supprime les doublons par date (garde la plus récente via `capturedAt`).
- Supprime les activités dont la date est antérieure à aujourd'hui.

##### `persistPendingActivity(activityData)` *(async)*
Sauvegarde `pendingActivity` dans `storage.sync` (principal) et `localStorage` (fallback), si la date de l'activité en attente correspond à celle de `activityData`. Réinitialise `pendingActivity` à `null` après écriture.

##### `surveyTableauRoulement()` *(async)*
Compare les activités stockées avec celles actuellement affichées dans le tableau de roulement. Pour chaque lien du tableau :
- Si l'activité stockée a un `schedule` ou une `ligne` différent de celui affiché → appelle `_appendWarningIcon()`.
- Sinon → appelle `_removeWarningIcon()`.

#### Méthodes privées

| Méthode | Description |
|---|---|
| `_getStoredActivitiesByDate()` | Fusionne les activités de `storage.sync` et `localStorage` dans une `Map<date, activity>` en favorisant les entrées les plus récentes |
| `_sanitizeActivities(activities)` | Chaîne `_dedupeActivitiesKeepLatest()` puis `_filterActivitiesFromToday()` |
| `_readSyncActivities()` | Lit le tableau d'activités depuis `storage.sync` |
| `_writeSyncActivities(activities)` | Écrit le tableau d'activités dans `storage.sync` |
| `_readLocalActivities()` | Lit le tableau d'activités depuis `localStorage` |
| `_writeLocalActivities(activities)` | Écrit le tableau d'activités dans `localStorage` |
| `_mergeActivitiesByDate(targetMap, activities)` | Peuple une `Map` date → activité en gardant l'entrée la plus récente (basé sur `capturedAt`) |
| `_upsertActivityByDate(activities, activityToSave)` | Insère ou remplace une activité dans un tableau, en se basant sur la date |
| `_dedupeActivitiesKeepLatest(activities)` | Déduplique un tableau d'activités par date |
| `_filterActivitiesFromToday(activities)` | Filtre les activités dont la date est strictement antérieure à aujourd'hui |
| `_appendWarningIcon(link)` | Ajoute l'icône d'avertissement dans la cellule `<td>` parente du lien, si elle n'est pas déjà présente |
| `_removeWarningIcon(link)` | Supprime l'icône d'avertissement de la cellule `<td>` parente du lien |
| `_storageGet(storage, key)` | Wrapper Promise-compatible pour `storage.get()` (gère l'API callback de Chrome) |
| `_storageSet(storage, data)` | Wrapper Promise-compatible pour `storage.set()` (gère l'API callback de Chrome) |

---

## Templates DOM

### `calendarButton`

**Fichier :** `js/content/templates/calendarButton.js`

#### `createCalendarButton()` → `HTMLButtonElement`
Crée le bouton d'ajout au calendrier (icône 24×24 px) inséré dans le header de l'activité. Utilise la classe CSS Bootstrap `close`.

#### `_createCalendarImage()` → `HTMLImageElement`
Crée l'élément `<img>` avec l'icône calendrier depuis les assets de l'extension.

---

### `restButton`

**Fichier :** `js/content/templates/restButton.js`

#### `createRestButton()` → `HTMLButtonElement`
Crée le bouton « Ajouter les repos au calendrier » avec classes Bootstrap `btn btn-primary`. Contient une icône SVG maison représentant une maison avec un calendrier.

#### `_createRestImage()` → `SVGElement`
Crée l'élément SVG constituant l'icône du bouton repos.

---

### `warningCalendarIcon`

**Fichier :** `js/content/templates/warningCalendarIcon.js`

#### `createWarningIcon()` → `HTMLImageElement`
Crée une icône d'avertissement (`<img>` 24×24 px, classe `rdl-tools-warning-icon`) affichée dans le tableau de roulement lorsqu'une activité stockée diffère de celle affichée. Le `title` de l'image est défini par `utils.messages.modifiedDayTooltip`.

---

## Classes de données

### `ActivityDay`

**Fichier :** `js/content/Classes/ActivityDay.js`

Représente une journée de travail complète.

```js
new ActivityDay({
    line,           // string — ligne de transport
    service,        // string — numéro de service
    codeCDM,        // string — code CDM de l'unité horaire
    schedule,       // string — roulement
    date,           // string — date ISO (YYYY-MM-DD)
    startTime,      // string — heure de début (format "HHhMM")
    endTime,        // string — heure de fin (format "HHhMM")
    activityDetails // string[] — descriptions formatées de chaque activité
})
```

---

### `RestDay` / `RestDays`

**Fichier :** `js/content/Classes/RestDay.js`

`RestDay` représente un jour de repos individuel :

```js
new RestDay(date, restCode)
// date     : string — jour du mois sur 2 chiffres (ex. "05")
// restCode : string — code du type de repos (ex. "RN", "CA")
```

`RestDays` regroupe l'ensemble des jours de repos d'un mois :

```js
new RestDays(month, year, restDays)
// month    : string — mois sur 2 chiffres (ex. "07")
// year     : string — année sur 4 chiffres (ex. "2025")
// restDays : RestDay[] — tableau des jours de repos
```

---

## Récupération des données JSON depuis le réseau

L'extension ne peut pas intercepter directement les requêtes réseau depuis un content script (restriction de sécurité des extensions MV3). Le mécanisme fonctionne en deux étapes :

### Étape 1 — Injection du script de page

Au chargement, `networkBridge.init()` injecte `pageNetworkInterceptor.js` dans le contexte de la **page** (non isolé). Ce script remplace `window.fetch` et `XMLHttpRequest.prototype.send` par ses propres versions instrumentées.

### Étape 2 — Propagation via postMessage

Lorsque la page effectue un appel vers `/api/activitesJournee/` ou `/api/roulement-month/`, le script intercepteur :
1. Laisse la requête s'exécuter normalement et retourne la réponse originale **inchangée** à l'appelant — l'extension ne modifie jamais le contenu de la réponse.
2. Clone la réponse (`response.clone()` pour `fetch`, lecture de `responseText` pour XHR) pour en extraire le JSON sans consommer la réponse originale.
3. Parse le JSON et émet un `window.postMessage` avec `source: 'rdl-tools-page-bridge'` et le type approprié (`activity-json` ou `rest-json`).

> **Transparence et résilience :** la surcharge de `fetch`/XHR est entièrement non bloquante. Si le code de l'extension lève une exception lors de l'interception, celle-ci est attrapée par un bloc `try/catch` et consignée en console — la requête originale est déjà renvoyée à la page et n'est pas affectée.

### Étape 3 — Réception dans le content script

`content.js` écoute les `window message` events et les filtre via `networkBridge.isFromBridge()` avant de les transmettre à `content._updateJsonCache()`. Les données sont mises en cache dans `content.activityJson` ou `content.restJson` jusqu'au prochain clic sur un bouton.

### Structure des payloads

**`activity-json`** (objet retourné par `/api/activitesJournee/`) :
```json
{
  "Titre": "Journée du 01 juillet 2025 - R1234",
  "Activites": [
    {
      "CODE_SERVICE": "T4-50",
      "LIGNE_ACTIVITE": "T4",
      "CODE_UNITE_HORAIRE": "ME00",
      "DATE_JOUR_TRAVAIL": "2025-07-01",
      "HEURE_DEB_ACT": "06h30",
      "HEURE_FIN_ACT": "07h45",
      "DESC_ACTIVITE": "Opération du véhicule",
      "VOITURE": " -16",
      "LIEU_DEB_ACT": "T_PDVA",
      "LIEU_FIN_ACT": "T_PDVD"
    }
  ]
}
```

**`rest-json`** (tableau retourné par `/api/roulement-month/`) :
```json
[
  {
    "DATE_JT": "2025-07-05",
    "TID_CODE_SERVICE": "RHE"
  }
]
```

---

## Clés de stockage

Toutes les clés sont centralisées dans `utils.storageKeys` :

| Clé | Stockage | Description |
|---|---|---|
| `RDLToolsSynchedActivities` | `storage.sync` | Tableau des activités synchronisées entre appareils |
| `RDLToolsSavedActivities` | `localStorage` | Tableau des activités en fallback local |
| `RDLToolsExtensionEnabled` | `storage.sync` | Booléen — active/désactive l'extension (défaut : `true`) |
| `RDLToolsSurveyorEnabled` | `storage.sync` | Booléen — active/désactive le surveyor (défaut : `true`) |
| `RDLToolsCustomActivityMapping` | `storage.sync` | Objet de mapping personnalisé fusionné avec `DEFAULT_ACTIVITY_MAPPING` |

Le mapping par défaut est défini dans `js/defaults.js` (`DEFAULT_ACTIVITY_MAPPING`) et partagé entre le content script et la page d'options.
