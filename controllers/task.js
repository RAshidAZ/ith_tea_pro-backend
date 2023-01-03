const mongoose = require('mongoose');
const { sendResponse } = require('../helpers/sendResponse');
const { populate } = require('../models/ratings');
const queryController = require('../query')
const { Task } = queryController;
const Project = require('../models/projects');


const insertUserTask = async (req, res, next) => {
    let data = req.data;
    console.log('insertUserTask data : ', req.data);

    if (!data.title || !data.category || !data.projectId) {
        return res.status(400).send(sendResponse(400, "", 'insertUserTask', null, req.data.signature))
    }


    let taskRes = await createPayloadAndInsertTask(data)
    console.log('taskRes : ', taskRes)
    if (taskRes.error || !taskRes.data) {
        return res.status(500).send(sendResponse(500, '', 'insertUserTask', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Task Inserted', 'insertUserTask', taskRes.data, req.data.signature))
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
            // createdBy: data?.auth?.req?.id , //TODO: Change after auth is updated
            createdBy: '601e3c6ef5eb242d4408dcc8',
            assignedTo: data.assignedTo,
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

    if (!data.taskId) {
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
            $set: {
                title: data.title,
                description: data.description,
                status: data.status,
                category: data.category,
                projectId: data.projectId,
                createdBy: data.createdBy,
                assignedTo: data.assignedTo,
                dueDate: data.dueDate,
                completedDate: data.completedDate,
                priority: data.priority
            }
        }
        let taskRes = await Task.findOneAndUpdate(findPayload, updatePayload)
        return { data: taskRes, error: false }
    } catch (err) {
        console.log("createPayloadAndEditTask Error : ", err)
        return { data: err, error: true }
    }
}
exports.createPayloadAndEditTask = createPayloadAndEditTask

const getGroupByTasks = async (req, res, next) => {
    let data = req.data;
    console.log('getGroupByTasks data : ', req.data);
    let allowedTaskGroup = process.env.ALLOWED_GROUP_BY.split(',')

    if (!allowedTaskGroup.includes(data.groupBy)) {
        return res.status(400).send(sendResponse(400, `${data.groupBy} Group By Not Supported`, 'getGroupByTasks', null, req.data.signature))
    }

    let taskRes = await createPayloadAndGetGroupByTask(data)
    console.log('taskRes : ', taskRes)
    if (taskRes.error) {
        return res.status(500).send(sendResponse(500, '', 'getGroupByTasks', null, req.data.signature))
    }
    return res.status(200).send(sendResponse(200, 'Task Fetched Successfully', 'getGroupByTasks', taskRes.data, req.data.signature))
}
exports.getGroupByTasks = getGroupByTasks;

const createPayloadAndGetGroupByTask = async function (data) {
    try {
        let findData = {
        }
        data.projectId ? findData["projectId"] = mongoose.Types.ObjectId(data.projectId) : ''
        data.assignedTo ? findData["assignedTo"] = mongoose.Types.ObjectId(data.assignedTo) : ''
        data.createdBy ? findData["createdBy"] = mongoose.Types.ObjectId(data.createdBy) : ''
        data.category ? findData["category"] = data.category : ''
        data.priority ? findData["priority"] = data.priority : ''
        data.status ? findData["status"] = data.status : ''
        let aggregate = [
            {
                $match: findData
            },
            {
                $group: {
                    _id: `$${data.groupBy}`,
                    tasks: { $push: "$$ROOT" }
                }
            },
            { $sort: { _id: 1 } }
        ]
        let taskRes = await Task.taskAggregate(aggregate)
        console.log(taskRes)
        let populate = []
        if (data.groupBy == 'projectId') {
            populate.push({ path: '_id', model: 'projects', select: 'name' })
            populate.push({ path: 'tasks.createdBy', model: 'users', select: 'name' })
            populate.push({ path: 'tasks.assignedTo', model: 'users', select: 'name' })
        }
        if (data.groupBy == 'createdBy') {
            populate.push({ path: '_id', model: 'users', select: 'name' })
            populate.push({ path: 'tasks.projectId', model: 'projects', select: 'name' })
            populate.push({ path: 'tasks.assignedTo', model: 'users', select: 'name' })
        }
        if (data.groupBy == 'assignedTo') {
            populate.push({ path: '_id', model: 'users', select: 'name' })
            populate.push({ path: 'tasks.projectId', model: 'projects', select: 'name' })
            populate.push({ path: 'tasks.createdBy', model: 'users', select: 'name' })

        }
        if (data.groupBy == 'status' || data.groupBy == 'category') {
            populate.push({ path: 'tasks.projectId', model: 'projects', select: 'name' })
            populate.push({ path: 'tasks.createdBy', model: 'users', select: 'name' })
            populate.push({ path: 'tasks.assignedTo', model: 'users', select: 'name' })
        }

        let populatedRes = await Task.taskPopulate(taskRes, populate)
        console.log("0000000", populatedRes)
        return { data: taskRes, error: false }
    } catch (err) {
        console.log("createPayloadAndGetGroupByTask Error : ", err)
        return { data: err, error: true }
    }
}
exports.createPayloadAndGetGroupByTask = createPayloadAndGetGroupByTask;

const getTaskDetailsByTaskId = async (req, res, next) => {
    let data = req.data;
    console.log('getTaskDetailsByTaskId data : ', req.data);

    if (!data.taskId) {
        return res.status(400).send(sendResponse(400, ``, 'getTaskDetailsByTaskId', null, req.data.signature))
    }

    let taskRes = await createPayloadAndGetTask(data)
    console.log('taskRes : ', taskRes)
    if (taskRes.error) {
        return res.status(500).send(sendResponse(500, '', 'getTaskDetailsByTaskId', null, req.data.signature))
    }
    return res.status(200).send(sendResponse(200, 'Task Fetched Successfully', 'getTaskDetailsByTaskId', taskRes.data, req.data.signature))
}
exports.getTaskDetailsByTaskId = getTaskDetailsByTaskId;

const createPayloadAndGetTask = async function (data) {
    try {
        let findData = {
            _id: data.taskId
        }
        let projection = {
            // "comments.comment" : 1
        }
        let populate = [
            { path: 'comments', model: 'comments', select: 'comment _id createdAt commentedBy' },
            { path: 'createdBy', model: 'users', select: 'name' },
            { path: 'assignedTo', model: 'users', select: 'name' },
            { path: 'projectId', model: 'projects', select: 'name _id' }
        ]
        let taskRes = await Task.taskFindOneQuery(findData, projection, populate)
        let commentPopulate = {
            path: 'comments.commentedBy', model: 'users', select: 'name _id'
        }
        let populatedRes = await Task.taskPopulate(taskRes, commentPopulate)
        return { data: populatedRes, error: false }
    } catch (err) {
        console.log("createPayloadAndGetTask Error : ", err)
        return { data: err, error: true }
    }
}
exports.createPayloadAndGetTask = createPayloadAndGetTask


const addCommentIdInTaskById = async function (data) {
    try {
        let payload = {
            _id: data.taskId,
        }
        let updatePayload = {
            $addToSet: { comments: data.commentId }
        }
        let insertRes = await Task.findOneAndUpdate(payload, updatePayload)
        console.log("insertRes---------------------------", insertRes)
        return { data: insertRes, error: false }
    } catch (error) {
        console.log("addCommentIdInTaskById Error : ", error)
        return { data: error, error: true }
    }
}
exports.addCommentIdInTaskById = addCommentIdInTaskById;


const getTaskStatusAnalytics = async (req, res, next) => {
    let data = req.data;
    console.log('getTaskStatusAnalytics data : ', req.data);

    let taskRes = await payloadGetTaskStatusAnalytics(data)
    console.log('taskRes : ', taskRes)
    if (taskRes.error) {
        return res.status(500).send(sendResponse(500, '', 'getTaskStatusAnalytics', null, req.data.signature))
    }
    return res.status(200).send(sendResponse(200, 'Task analytics Fetched Successfully', 'getTaskStatusAnalytics', taskRes.data, req.data.signature))
}
exports.getTaskStatusAnalytics = getTaskStatusAnalytics;

const payloadGetTaskStatusAnalytics = async function (data) {
    try {
        // let aggregate = [
        //     {

        //         $group: {
        //             _id: { status: '$status', project: "$projectId" },
        //             count: { $sum: 1 },
        //         }
        //     },
        //     {
        //         $group: {
        //             _id: { project: '$_id.project' },
        //             docs: { $push: "$$ROOT" },
        //             //            totalCount : {$sum : "$$ROOT.count"}
        //         }
        //     },
        // ]
        // let taskRes = await Task.taskAggregate(aggregate)
        let taskRes = await Task.taskFindQuery({}, { status: 1, projectId: 1, _id: 0 })
        let sendData = {}
        for (let i = 0; i < taskRes.length; i++) {
            if (sendData[taskRes[i].projectId]) {
                sendData[taskRes[i].projectId][taskRes[i].status] += 1
                sendData[taskRes[i].projectId].totalTask += 1
            } else {
                sendData[taskRes[i].projectId] = {
                    COMPLETED: 0,
                    ONGOING: 0,
                    ONHOLD: 0,
                    NO_PROGRESS: 0,
                    totalTask: 0
                }
            }
        }
        let projectIds = Object.keys(sendData)
        for (let i = 0; i < projectIds.length; i++) {
            sendData[projectIds[i]]["totalTask"] && (sendData[projectIds[i]] = {
                COMPLETED: sendData[projectIds[i]]['COMPLETED'] * 100 / sendData[projectIds[i]]["totalTask"],
                ONGOING: sendData[projectIds[i]]['ONGOING'] * 100 / sendData[projectIds[i]]["totalTask"],
                ONHOLD: sendData[projectIds[i]]['ONHOLD'] * 100 / sendData[projectIds[i]]["totalTask"],
                NO_PROGRESS: sendData[projectIds[i]]['NO_PROGRESS'] * 100 / sendData[projectIds[i]]["totalTask"],
                totalTask: sendData[projectIds[i]]["totalTask"]
            })
        }
        return { data: sendData, error: false }
    } catch (err) {
        console.log("createPayloadAndGetGroupByTask Error : ", err)
        return { data: err, error: true }
    }
}
exports.createPayloadAndGetGroupByTask = createPayloadAndGetGroupByTask;
