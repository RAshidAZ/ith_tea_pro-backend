const ActionLog = require('../models/actions');
const ProjectLog = require('../models/projectLogs');
const TaskLog = require('../models/taskLogs');
const RatingLog = require('../models/ratingLogs');

exports.insertActionLog = function (payload) {
    return ActionLog.create(payload);
}

exports.insertProjectLog = function (payload) {
    return ProjectLog.create(payload);
}

exports.insertTaskLog = function (payload) {
    return TaskLog.create(payload);
}

exports.insertRatingLog = function (payload) {
    return RatingLog.create(payload);
}