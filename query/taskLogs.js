const TaskLogs = require('../models/taskLogs');

exports.addTaskLog = function (payload) {
    return TaskLogs.create(payload)
}