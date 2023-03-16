
const Rating = require('./rating')
const Comments = require('./comment')
const Task = require('./task')
const User = require('./user')
const Project = require('./project')
const ProjectSections = require('./projectSections')
const Auth = require("./auth");
const Credentials = require("./credentials");
const ActionLogs = require("./actionLog");
const ProjectLogs = require("./projectLogs");
const TaskLogs = require("./taskLogs");


module.exports = {
    Rating,
    Comments,
    Task,
    User,
    Project,
	ProjectSections,
    Auth,
    Credentials,
    ActionLogs,
	ProjectLogs,
	TaskLogs
}