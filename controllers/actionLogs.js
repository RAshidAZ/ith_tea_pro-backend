const { sendResponse } = require('../helpers/sendResponse');
const queryController = require('../query')
const { ActionLogs } = queryController;
const utilities = require('../helpers/security');


exports.addActionLog = async function (data) {
    try {
        let payload = data.actionLogData;

        let insertLogResponse = await ActionLogs.insertActionLog(payload);
        console.log("insertLogResponse => ", insertLogResponse)
        return { data: insertLogResponse, error: false }
    } catch (err) {
        return { data: err, error: true }
    }
}
exports.addProjectLog = async function (data) {
    try {
        let payload = data.actionLogData;

        let insertLogResponse = await ActionLogs.insertProjectLog(payload);
        console.log("insertProjectResponse => ", insertLogResponse)
        return { data: insertLogResponse, error: false }
    } catch (err) {
        return { data: err, error: true }
    }
}

exports.addTaskLog = async function (data) {
    try {
        let payload = data.actionLogData;

        let insertLogResponse = await ActionLogs.insertTaskLog(payload);
        console.log("insertTaskResponse => ", insertLogResponse)
        return { data: insertLogResponse, error: false }
    } catch (err) {
        return { data: err, error: true }
    }
}

exports.addRatingLog = async function (data) {
    try {
        let payload = data.actionLogData;

        let insertLogResponse = await ActionLogs.insertRatingLog(payload);
        console.log("addRatingLog => ", insertLogResponse)
        return { data: insertLogResponse, error: false }
    } catch (err) {
        return { data: err, error: true }
    }
}