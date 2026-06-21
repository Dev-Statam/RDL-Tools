/**
 * Un objet ActivityDay contenant le détail de la journée de travail
 */
class ActivityDay {
    constructor(parameters) {
        this.line = parameters.line;
        this.service = parameters.service;
        this.schedule = parameters.schedule;
        this.date = parameters.date;
        this.startTime = parameters.startTime;
        this.endTime = parameters.endTime;
        this.activityDetails = parameters.activityDetails;
    }
}