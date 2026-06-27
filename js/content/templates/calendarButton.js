const calendarButton = {
    createCalendarButton() {
        const $calendarButton = document.createElement('button');
        $calendarButton.classList.add('close');
        $calendarButton.type = 'button';
        $calendarButton.style.cssText = 'right: 7px!important; top: 45px!important';
        $calendarButton.appendChild(this._createCalendarImage());
        return $calendarButton;
    },

    _createCalendarImage() {
        const $calendarImage = document.createElement('img');
        $calendarImage.src = utils.getRuntimeURL('assets/calendrier-24.png');
        $calendarImage.alt = 'Ajouter la journée dans le calendrier';
        $calendarImage.style.width = '24px';
        $calendarImage.style.height = '24px';
        $calendarImage.style.cursor = 'pointer';
        return $calendarImage;
    }

}