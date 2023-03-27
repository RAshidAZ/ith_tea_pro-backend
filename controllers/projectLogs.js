const { sendResponse } = require('../helpers/sendResponse');
const queryController = require('../query')
const { ProjectLogs } = queryController;

const getProjectLogs = async (req, res, next) => {
    let data = req.data;
    // if (!data.projectId) {
    //     return res.status(400).send(sendResponse(400, "", 'getTaskLogs', null, req.data.signature))
    // }
    let projectLogsRes = await createPayloadAndGetProjectLogs(data)
    if (projectLogsRes.error) {
        return res.status(500).send(sendResponse(500, '', 'getProjectLogs', null, req.data.signature))
    }
    return res.status(200).send(sendResponse(200, 'Tasklogs Fetched', 'getProjectLogs', projectLogsRes.data, req.data.signature))


}
exports.getProjectLogs = getProjectLogs;

const createPayloadAndGetProjectLogs = async function (data) {
    try {
        let payload = {}
		if(data.projectId){
			payload.projectId = data.projectId
		}
        let projectLogsRes = await ProjectLogs.getProjectLogs(payload)
        return { data: projectLogsRes, error: false }
    } catch (err) {
        console.log("createPayloadAndGetTaskLogs Error : ", err)
        return { data: err, error: true }
    }
}

