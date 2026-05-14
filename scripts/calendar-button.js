import { atcb_action } from '../node_modules/add-to-calendar-button/dist/atcb.js';
// import '../src/add-to-calendar-button/index.d.ts';

console.log('module importé !');

const headerActivite = document.getElementById('header_Activite');

// --------
// Création et intégration du bouton "Add-to-calendar-button"
// --------
const config = {
    name: "[Reminder] Test the Add to Calendar Button",
    description: "Check out the maybe easiest way to include Add to Calendar Buttons to your web projects:[br]→ [url]https://add-to-calendar-button.com/|Click here![/url]",
    startDate: "2026-05-15",
    startTime: "10:15",
    endTime: "23:30",
    options: ["Google", "iCal"],
    timeZone: "EST"
  };

const addToCalendarButtonElement = document.createElement('add-to-calendar-button');
addToCalendarButtonElement.setAttribute('name', 'Ajouter à mon agenda');
addToCalendarButtonElement.setAttribute('options', "'Apple','Google','Outlook.com','Office365'");
addToCalendarButtonElement.setAttribute('startDate', '2026-05-15');
addToCalendarButtonElement.innerHTML = 'Ajouter à mon agenda';
addToCalendarButtonElement.addEventListener('click', () => {
    atcb_action(config, addToCalendarButtonElement);
    // atcb_action(config, addToCalendarButtonElement);
});
console.log('addToCalendarButtonElement : ', addToCalendarButtonElement);
// addToCalendarButtonElement.style.cssText = 'right: 7px!important; top: 7px!important';

// Ajout d'un observateur de changement d'état de la modale afin d'ajouter et de configurer le bouton "Add-to-calendar-button"
const modalVacationElement = document.getElementById('modalVacations');
const observer = new MutationObserver(mutations);
observer.observe(headerActivite, {attributes: true, childList: true, subtree: true});

function mutations(mutationsList, observer) {
    for (const mutation of mutationsList) {
        if (mutation.target.id === 'titleActiviteJournee' && mutation.target.innerText != null && mutation.target.innerText != '') {
            observer.disconnect();
            const brElement = document.createElement('br');
            mutation.target.appendChild(brElement);
            mutation.target.appendChild(addToCalendarButtonElement);
        }
    }
}