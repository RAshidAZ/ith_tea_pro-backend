const TaskLogs = require('../models/taskLogs');

exports.addTaskLog = function (payload) {
    return TaskLogs.create(payload)
}

exports.getTaskLogs = function (payload, projection = {}, populate = '', sortCriteria = {}) {
	console.log("============populate data====", populate)
    return TaskLogs.find(payload, projection).populate(populate).sort(sortCriteria)
}