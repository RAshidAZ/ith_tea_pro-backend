const TaskLogs = require('../models/taskLogs');

exports.addTaskLog = function (payload) {
    return TaskLogs.create(payload)
}

exports.getTaskLogs = function (payload) {
    return TaskLogs.find(payload)
}