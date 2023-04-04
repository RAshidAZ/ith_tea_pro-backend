const queryController = require('../query')
const { ActionLogs } = queryController;


exports.addActionLog = async function (data) {
    try {
        let payload = data.actionLogData;

        let insertLogResponse = await ActionLogs.insertActionLog(payload);
        return { data: insertLogResponse, error: false }
    } catch (err) {
        return { data: err, error: true }
    }
}
exports.addProjectLog = async function (data) {
    try {
        let payload = data.actionLogData;

		console.log("===============payload for project logs=======", payload)
        let insertLogResponse = await ActionLogs.insertProjectLog(payload);
        return { data: insertLogResponse, error: false }
    } catch (err) {
		console.log("==============error====", err)
        return { data: err, error: true }
    }
}

exports.addTaskLog = async function (data) {
    try {
        let payload = data.actionLogData;

        let insertLogResponse = await ActionLogs.insertTaskLog(payload);
        return { data: insertLogResponse, error: false }
    } catch (err) {
        return { data: err, error: true }
    }
}

exports.addRatingLog = async function (data) {
    try {
        let payload = data.actionLogData;

        let insertLogResponse = await ActionLogs.insertRatingLog(payload);
        return { data: insertLogResponse, error: false }
    } catch (err) {
        return { data: err, error: true }
    }
}