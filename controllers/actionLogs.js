const { sendResponse } = require('../helpers/sendResponse');
const queryController = require('../query')
const { ActionLogs } = queryController;
const utilities = require('../helpers/security');


exports.addActionLog = async function (data) {
    try {
        console.log("Inside ActionLog and Payload to insert Is => ", data.actionLogData);
        let payload = data.actionLogData;

        let insertLogResponse = await ActionLogs.insertActionLog(payload);
        console.log("insertLogResponse => ", insertLogResponse)
        return { data: insertLogResponse, error: false }
    } catch (err) {
        return { data: err, error: true }
    }
}
