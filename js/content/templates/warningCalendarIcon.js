/**
 * Module de création d'icône warning pour indiquer une modification de journée.
 */
const warningCalendarIcon = {
    createWarningIcon() {
        const $warningIcon = document.createElement('img');
        $warningIcon.className = 'rdl-tools-warning-icon';
        $warningIcon.src = utils.getRuntimeURL(utils.assets.warningCalendarIcon);
        $warningIcon.alt = 'Journee modifiee';
        $warningIcon.title = utils.messages.modifiedDayTooltip;
        $warningIcon.width = 24;
        $warningIcon.height = 24;
        $warningIcon.style.verticalAlign = 'middle';
        $warningIcon.style.transform = 'translateY(-2px)';
        $warningIcon.style.marginLeft = '15px';
        return $warningIcon;
    }
};
