const { sendResponse } = require('../helpers/sendResponse');
const queryController = require('../query')
const { TaskLogs } = queryController;

const getTaskLogs = async (req, res, next) => {
    let data = req.data;
    
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
		let sortCriteria = {
			createdAt : -1
		}
		let populate = "actionBy commentId previous.section new.section previous.assignedTo new.assignedTo"
        let taskLogsRes = await TaskLogs.getTaskLogs(payload, {}, populate, sortCriteria)
        return { data: taskLogsRes, error: false }
    } catch (err) {
        console.log("createPayloadAndGetTaskLogs Error : ", err.message)
        return { data: err, error: true }
    }
}

