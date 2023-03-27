const { sendResponse } = require('../helpers/sendResponse');
const queryController = require('../query')
const { TaskLogs } = queryController;

const getTaskLogs = async (req, res, next) => {
    let data = req.data;
    // if (!data.taskId) {
    //     return res.status(400).send(sendResponse(400, "", 'getTaskLogs', null, req.data.signature))
    // }
    let tasklogsRes = await createPayloadAndGetTaskLogs(data)
    if (tasklogsRes.error) {
        return res.status(500).send(sendResponse(500, '', 'getTaskLogs', null, req.data.signature))
    }
    return res.status(200).send(sendResponse(200, 'Tasklogs Fetched', 'getTaskLogs', tasklogsRes.data, req.data.signature))


}
exports.getTaskLogs = getTaskLogs;

const createPayloadAndGetTaskLogs = async function (data) {
    try {
        let payload = {}
		if(data.taskId){
			payload.taskId = data.taskId
		}
        let taskLogsRes = await TaskLogs.getTaskLogs(payload)
        return { data: taskLogsRes, error: false }
    } catch (err) {
        console.log("createPayloadAndGetTaskLogs Error : ", err)
        return { data: err, error: true }
    }
}

