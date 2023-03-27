const ProjectLogs = require('../models/projectLogs');

exports.addProjectLog = function (payload) {
    return ProjectLogs.create(payload)
}

exports.getProjectLogs = function (payload) {
    return ProjectLogs.find(payload)
}