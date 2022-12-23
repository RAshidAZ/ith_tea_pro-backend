const { sendResponse } = require('../helpers/sendResponse');
const queryController = require('../query')
const { Task } = queryController;


const insertUserTask = async (req, res, next) => {
    let data = req.data;
    console.log('insertUserTask data : ', req.data);

    if (!data.title || !data.category || !data.projectId || !data.createdById || !data.assignedToId) {
        return res.status(400).send(sendResponse(400, "", 'insertUserTask', null, req.data.signature))
    }
    //TODO: Change after auth is updated
    // data.givenBy = data.auth.id 
    data.givenBy = "601e3c6ef5eb242d4408dcc8"

    let taskRes = await createPayloadAndInsertTask(data)
    console.log('taskRes : ', taskRes)
    if (taskRes.error || !taskRes.data) {
        return res.status(500).send(sendResponse(500, '', 'insertUserTask', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Task Inserted', 'insertUserTask', null, req.data.signature))
}
exports.insertUserTask = insertUserTask


const createPayloadAndInsertTask = async function (data) {
    try {
        let payload = {
            title: data.title,
            description: data.description,
            status: data.status,
            category: data.category,
            projectId: data.projectId,
            createdBy: data.createdById,
            assignedTo: data.assignedToId,
            dueDate: data.dueDate,
            completedDate: data.completedDate,
            priority: data.priority
        }
        let taskRes = await Task.insertUserTask(payload)
        return { data: taskRes, error: false }
    } catch (err) {
        console.log("createPayloadAndInsertTask Error : ", err)
        return { data: err, error: true }
    }
}
exports.createPayloadAndInsertTask = createPayloadAndInsertTask

const editUserTask = async (req, res, next) => {
    let data = req.data;
    console.log('editUserTask data : ', req.data);

    if (!data.title || !data.category || !data.projectId || !data.createdById || !data.assignedToId || !data.taskId) {
        return res.status(400).send(sendResponse(400, "", 'editUserTask', null, req.data.signature))
    }
    //TODO: Change after auth is updated
    // data.givenBy = data.auth.id 
    data.givenBy = "601e3c6ef5eb242d4408dcc8"

    let taskRes = await createPayloadAndEditTask(data)
    console.log('taskRes : ', taskRes)
    if (taskRes.error || !taskRes.data) {
        return res.status(500).send(sendResponse(500, '', 'editUserTask', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Task Edited Successfully', 'editUserTask', null, req.data.signature))
}
exports.editUserTask = editUserTask;

const createPayloadAndEditTask = async function (data) {
    try {
        let findPayload = {
            _id: data.taskId
        }
        let updatePayload = {
            title: data.title,
            description: data.description,
            status: data.status,
            category: data.category,
            projectId: data.projectId,
            createdBy: data.createdById,
            assignedTo: data.assignedToId,
            dueDate: data.dueDate,
            completedDate: data.completedDate,
            priority: data.priority
        }
        let taskRes = await Task.updateUserTask(findPayload, updatePayload)
        return { data: taskRes, error: false }
    } catch (err) {
        console.log("createPayloadAndEditTask Error : ", err)
        return { data: err, error: true }
    }
}
exports.createPayloadAndEditTask = createPayloadAndEditTask

