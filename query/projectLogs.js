const ProjectLogs = require('../models/projectLogs');

exports.addProjectLog = function (payload) {
    return ProjectLogs.create(payload)
}