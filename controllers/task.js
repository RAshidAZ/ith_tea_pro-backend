const mongoose = require('mongoose');
const { sendResponse } = require('../helpers/sendResponse');
const { populate } = require('../models/ratings');
const queryController = require('../query');
const { Task, Rating, Project, Comments, TaskLogs } = queryController;

const actionLogController = require("../controllers/actionLogs");


//Insert Task
const insertUserTask = async (req, res, next) => {
    let data = req.data;

	if(data.auth.role == "Lead"){
		data.tasklead = [data.auth.id]
	}
    if (!data.title || !data.section || !data.projectId || !data.tasklead || !data.tasklead.length) {
        return res.status(400).send(sendResponse(400, "Please send all required Data fields", 'insertUserTask', null, req.data.signature))
    }


    let ifAllowedToAddTask = await checkIfAllowedToAddTask(data);
    if (ifAllowedToAddTask.error) {
        return res.status(500).send(sendResponse(500, '', 'insertUserTask', null, req.data.signature))
    }

    if (!ifAllowedToAddTask.data.allowed) {
        return res.status(400).send(sendResponse(401, 'Not Allowed to add task for this project', 'insertUserTask', null, req.data.signature))
    }

    let taskRes = await createPayloadAndInsertTask(data)
    console.log('taskRes : ', taskRes)

    if (taskRes.error || !taskRes.data) {
        return res.status(500).send(sendResponse(500, '', 'insertUserTask', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Task Inserted', 'insertUserTask', taskRes.data, req.data.signature))
}
exports.insertUserTask = insertUserTask

const checkIfAllowedToAddTask = async function (data) {

    try {
        if (["SUPER_ADMIN", "ADMIN"].includes(data.auth.role)) {
            return { data: { allowed: true }, error: false }
        }

        let findData = {
            _id: data.projectId,
            "$or": [
                { accessibleBy: data.auth.id },
                { managedBy: data.auth.id },
            ]
        }
        let getProject = await Project.findSpecificProject(findData);
        if (getProject) {
			if (data.tasklead && getProject.managedBy.length) {
				
				let taskLead = data.tasklead
                // let checkIfLeadIsAssignedThisProject = getProject?.managedBy.includes(data.tasklead) || false;
				let managers = (getProject.managedBy).map(el=>el.toString())
				console.log("Project lead data => ", managers, taskLead);
				
				checkIfLeadIsAssignedThisProject = taskLead.every(el=>managers.includes(el.toString())) || false

                if (!checkIfLeadIsAssignedThisProject) {
                    console.log("Lead is not assigned to this project...", getProject.managedBy)
                    return { data: { allowed: false }, error: false }
                }
            }
            return { data: { allowed: true }, error: false }
        } else {
            return { data: { allowed: false }, error: false }
        }
    } catch (err) {
        console.log("Error => ", err);
        return { data: err, error: true }
    }
}

const createPayloadAndInsertTask = async function (data) {
    try {
        if (["CONTRIBUTOR", "INTERN"].includes(data.auth.role)) {
            data.assignedTo = data.auth.id
        };

        if (data.dueDate) {
            data.dueDate = new Date(new Date(data.dueDate).setUTCHours(23, 59, 59, 0))
        }
        let payload = {
            title: data.title,
            description: data.description,
            status: data.status,
            section: data.section,
            projectId: data.projectId,
            createdBy: data?.auth?.id,    //TODO: Change after auth is updated
            // createdBy: '601e3c6ef5eb242d4408dcc8',
            assignedTo: data.assignedTo,
            dueDate: data.dueDate || new Date(new Date().setUTCHours(23, 59, 59, 0)),
            completedDate: data.completedDate,
            priority: data.priority,
            lead: data.tasklead
        }
        let taskRes = await Task.insertUserTask(payload)
        return { data: taskRes, error: false }
    } catch (err) {
        console.log("createPayloadAndInsertTask Error : ", err)
        return { data: err, error: true }
    }
}
exports.createPayloadAndInsertTask = createPayloadAndInsertTask

//Edit user task
const editUserTask = async (req, res, next) => {
    let data = req.data;
    console.log('editUserTask data : ', req.data);

    if (!data.taskId) {
        return res.status(400).send(sendResponse(400, "", 'editUserTask', null, req.data.signature))
    }

    let task = await getTaskById(data);
    console.log("task Details => ", task)
    if (task.error || !task.data) {
        return res.status(400).send(sendResponse(400, 'Task Not found..', 'rateUserTask', null, req.data.signature))
    }

    if (["CONTRIBUTOR", "INTERN"].includes(data.auth.role) && task.data.isRated) {
        return res.status(400).send(sendResponse(400, 'You are not permitted to edit task once it is rated', 'rateUserTask', null, req.data.signature))
    }

    let taskRes = await createPayloadAndEditTask(data)
    console.log('taskRes : ', taskRes)
    if (taskRes.error || !taskRes.data) {
        return res.status(500).send(sendResponse(500, '', 'editUserTask', null, req.data.signature))
    }

    if (data.status || data.dueDate) {
        let actionLogData = {
            actionType: "TASK",
            actionTaken: data.status ? "TASK_STATUS_CHANGE" : "TASK_DUE_DATE_CHANGE",
            actionBy: data.auth.id,
            taskId: data.taskId
        }
        data.actionLogData = actionLogData;
        let addActionLogRes = await actionLogController.addActionLog(data);

        if (addActionLogRes.error) {
            return res.status(500).send(sendResponse(500, '', 'addNewUser', null, req.data.signature))
        }
    }
    return res.status(200).send(sendResponse(200, 'Task Edited Successfully', 'editUserTask', null, req.data.signature))
}
exports.editUserTask = editUserTask;

const createPayloadAndEditTask = async function (data) {
    try {
        let findPayload = {
            _id: data.taskId
        }
        if (["CONTRIBUTOR", "INTERN"].includes(data.auth.role)) {
            console.log("user is trying to modify task....", data.auth.role)
            findPayload["$or"] = [
                { createdBy: data.auth.id },
                { assignedTo: data.auth.id },
            ]
        }

        // let updatePayload = {
        //     $set: {
        //         title: data.title,
        //         description: data.description,
        //         status: data.status,
        //         category: data.category,
        //         projectId: data.projectId,
        //         createdBy: data.createdBy,
        //         assignedTo: data.assignedTo,
        //         dueDate: data.dueDate,
        //         completedDate: data.completedDate,
        //         priority: data.priority
        //     }
        // }
        let updatePayload = {}
        if (data.title) {
            updatePayload.title = data.title
        }
        if (data.description) {
            updatePayload.description = data.description
        }
        if (data.status) {
            updatePayload.status = data.status
            console.log(data.status == process.env.TASK_STATUS.split(",")[2])
            if (data.status == process.env.TASK_STATUS.split(",")[2]) {
                updatePayload.completedDate = new Date()
            } else {
                updatePayload.completedDate = null
            }
        }
        if (data.category) {
            updatePayload.category = data.category
        }
        if (data.projectId) {
            updatePayload.projectId = data.projectId
        }
        if (data.assignedTo) {
            updatePayload.assignedTo = data.assignedTo
        }
        if (data.dueDate) {
            updatePayload.dueDate = new Date(new Date(data.dueDate).setUTCHours(23, 59, 59, 0))
        }
        if (data.completedDate) {
            updatePayload.completedDate = data.completedDate
        }
        if (data.priority) {
            updatePayload.priority = data.priority
        }
        console.log("Upload payload foe edit task => ", updatePayload)
        let taskRes = await Task.findOneAndUpdate(findPayload, updatePayload, {})
        return { data: taskRes, error: false }
    } catch (err) {
        console.log("createPayloadAndEditTask Error : ", err)
        return { data: err, error: true }
    }
}
exports.createPayloadAndEditTask = createPayloadAndEditTask

//Task Lisiting Main API
const getGroupByTasks = async (req, res, next) => {
    let data = req.data;
    // console.log('getGroupByTasks data : ', req.data);

    let allowedTaskGroup = process.env.ALLOWED_GROUP_BY.split(',')

    if (!allowedTaskGroup.includes(data.groupBy)) {
        return res.status(400).send(sendResponse(400, `${data.groupBy} Group By Not Supported`, 'getGroupByTasks', null, req.data.signature))
    }else{
        data.aggregateGroupBy = `$${data.groupBy}`
    }

    if(data.groupBy === 'default'){
        data.aggregateGroupBy = { projectId: "$projectId", section: "$section" }
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
        let findData = {}
		let filter = {}

        if(data.projectIds || data.projectId) {
            let projectIds = data.projectIds ? JSON.parse(data.projectIds) : [data.projectId]
            findData["_id"] = { $in : projectIds.map(el => mongoose.Types.ObjectId(el)) }
        }
        if(data.assignedTo) {
            let assignTo = JSON.parse(data.assignedTo)
            filter["tasks.assignedTo"] = { $in : assignTo.map(el => mongoose.Types.ObjectId(el)) }
        }
		if(data.userTasks) {
            let assignTo = data.auth.id
            filter["tasks.assignedTo"] = mongoose.Types.ObjectId(assignTo)
        }
        if(data.createdBy) {
            let createdBy = JSON.parse(data.createdBy)
            filter["tasks.createdBy"] = { $in : createdBy.map(el => mongoose.Types.ObjectId(el)) }
        }
        if(data.sections) {
            let sections = JSON.parse(data.sections)
            findData["sections"] = { $in : sections.map(el => mongoose.Types.ObjectId(el)) }
        }
        if(data.priority) {
            let priorities = JSON.parse(data.priority)
            filter["tasks.priority"] = { $in : priorities }
        }
        if(data.status) {
            let status = JSON.parse(data.status)
            filter["tasks.status"] = { $in : status }
        }

		
        let aggregate = [
			{
				$match: findData
			},
	
				{
				  "$lookup": {
					"from": "projectsections",
					"localField": "sections",
					"foreignField": "_id",
					"as": "section"
				  }
				},
				{ "$unwind": { "path": "$section" } },
				{
				  "$lookup": {
					"from": "tasks",
					"let": { "section": "$section._id", "projectId": "$_id" },
					"pipeline": [
					  {
						"$match": {
						  "$expr": {
							"$and": [
							  { "$eq": ["$section", "$$section"] },
							  { "$eq": ["$projectId", "$$projectId"] }
							]
						  }
						}
					  }
					],
					"as": "tasks"
				  }
				},
				{ "$unwind": { "path": "$tasks",preserveNullAndEmptyArrays : true } },
				{
				  "$group": {
					"_id": { "projectId": "$name", "section": "$section.name" },
					"tasks": { "$push": "$tasks" }
				  }
				},
			  
			{ $match : filter },
            { $sort: { "_id.projectId": 1, "_id.section":1 } }
        ]

		console.log("==============group by filter=*************======",aggregate, filter, findData)

        // console.log("qwertyuiop1234567890-", aggregate)

        let taskRes = await Project.projectAggregate(aggregate)

        // console.log(taskRes)
        let populate = []
        if (data.groupBy == 'default') {
            populate.push({ path: '_id.projectId', model: 'projects', select: 'name' })
            populate.push({ path: 'tasks.createdBy', model: 'users', select: 'name' })
            populate.push({ path: 'tasks.assignedTo', model: 'users', select: 'name' })
        }
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
            populate.push({ path: 'tasks.createdBy', model: 'users', select: 'name' })
            populate.push({ path: 'tasks.projectId', model: 'projects', select: 'name' })

        }
        if (data.groupBy == 'status' || data.groupBy == 'category') {
            populate.push({ path: 'tasks.projectId', model: 'projects', select: 'name' })
            populate.push({ path: 'tasks.createdBy', model: 'users', select: 'name' })
            populate.push({ path: 'tasks.assignedTo', model: 'users', select: 'name' })
        }

        // let populatedRes = await Task.taskPopulate(taskRes, populate)
        // console.log("0000000", populatedRes)
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
    // console.log('taskRes : ', taskRes)
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
            { path: 'createdBy', model: 'users', select: 'name _id' },
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
        let insertRes = await Task.findOneAndUpdate(payload, updatePayload, {})
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
    // console.log('getTaskStatusAnalytics data : ', req.data);

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
                    NOT_STARTED: 0,
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
                NOT_STARTED: sendData[projectIds[i]]['NOT_STARTED'] * 100 / sendData[projectIds[i]]["totalTask"],
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

// const userGetTaskListForHomePage = async function (data) {

//     var curr = new Date;
//     var firstDateOfWeek = curr.getDate() - curr.getDay();
//     var lastDateOfWeek = firstDateOfWeek + 6;

//     let firstday = new Date(curr.setDate(firstDateOfWeek));
//     let lastday = new Date(curr.setDate(lastDateOfWeek));
//     console.log("--", firstday, lastday);

//     data.firstday = firstday;
//     data.lastday = lastday;
//     let tasksLists = await createPayloadAndGetTaskListForUser(data);
// }
// exports.userGetTaskListForHomePage = userGetTaskListForHomePage;

// const createPayloadAndGetTaskListForUser = async function (data) {
//     try {

//         let findData = {
//             dueDate: {
//                 $lte: data.lastday,
//                 $gte: data.firstday
//             }
//         }
//         let taskList = await Task.taskFindQuery(findData, {}, "");
//         console.log("TaskList of Past Seven Days => ", taskList)
//     } catch (error) {
//         console.log("Error => ", error)
//     }
// }

// Controller of adding rating to user task
const rateUserTask = async (req, res, next) => {

    let data = req.data;

    if (!data.taskId || !data.rating) {
        return res.status(400).send(sendResponse(400, "Please send all required Data fields", 'rateUserTask', null, req.data.signature))
    }

    let task = await getTaskById(data);
    console.log("task Details => ", task)
    if (task.error || !task.data) {
        return res.status(400).send(sendResponse(400, 'Task Not found..', 'rateUserTask', null, req.data.signature))
    }

    let taskDetails = task.data;
    if (taskDetails.status != process.env.TASK_STATUS.split(",")[2]) {
        return res.status(400).send(sendResponse(400, 'Task is not yet marked as completed', 'rateUserTask', null, req.data.signature))
    }

    if (!taskDetails.dueDate) {
        return res.status(400).send(sendResponse(400, 'Task duedate is not present', 'rateUserTask', null, req.data.signature))
    }

    if (!taskDetails.assignedTo) {
        return res.status(400).send(sendResponse(400, 'Task is not assigned to anyone', 'rateUserTask', null, req.data.signature))
    }

    // if (taskDetails.isRated) {
    //     return res.status(400).send(sendResponse(400, 'Task is already rated', 'rateUserTask', null, req.data.signature))
    // }

    data.taskDetails = taskDetails;

    if (!["SUPERADMIN", "ADMIN"].includes(data.auth.role)) {

        console.log("Lead giving taks....", data.auth.role);

        let checkIfAllowedToRateTask = taskDetails.lead.includes(data.auth.id) && data.filteredProjects.includes(taskDetails.projectId.toString());

        if (!checkIfAllowedToRateTask) {
            return res.status(400).send(sendResponse(400, 'Not allowed to rate task', 'rateUserTask', null, req.data.signature))
        }
        console.log("If lead is allowed to rate this task....", checkIfAllowedToRateTask)
    }

    if(data.comment){
        let insertTaskCommentRes = await createPayloadAndInsertTaskRatingComment(data);
        if (insertTaskCommentRes.error || !insertTaskCommentRes.data ) {
            return res.status(500).send(sendResponse(500, 'Task comment could not be added..', 'rateUserTask', null, req.data.signature))
        }
        data.commentId = insertTaskCommentRes.data._id;
    }
    let updateTaskRating = await updateUserTaskRating(data);
    console.log('updateTaskRating => ', updateTaskRating)

    if (updateTaskRating.error || !updateTaskRating.data) {
        return res.status(500).send(sendResponse(500, '', 'rateUserTask', null, req.data.signature))
    }

    //get all tasks of that user for given specififc due date
    let allTasksWithSameDueDate = await getAllTasksWithSameDueDate(data);
    data.allTasksWithSameDueDate = allTasksWithSameDueDate.data;

    // get average rating doc of user
    let updatedOverallRating = await updateOverallRatingDoc(data);
    if (updatedOverallRating.error || !updateTaskRating.data) {
        return res.status(500).send(sendResponse(500, 'Rating couldnot be updated', 'rateUserTask', null, req.data.signature))
    }

    let actionLogData = {
        actionType: "TASK_RATING",
        actionTaken: "TASK_RATING",
        actionBy: data.auth.id,
        taskId: data.taskId
    }
    data.actionLogData = actionLogData;
    let addActionLogRes = await actionLogController.addActionLog(data);

    if (addActionLogRes.error) {
        return res.status(500).send(sendResponse(500, '', 'rateUserTask', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Task Rated', 'rateUserTask', updatedOverallRating.data, req.data.signature));
}
exports.rateUserTask = rateUserTask;

const getTaskById = async function (data) {
    try {

        let findData = {
            _id: data.taskId,
            isDeleted: false
        }

        let taskDetails = await Task.taskFindOneQuery(findData, {}, "");
        return { data: taskDetails, error: false }
    } catch (err) {
        console.log("Error => ", err);
        return { data: err, error: true }
    }
}

const createPayloadAndInsertTaskRatingComment = async function (data) {
    try {
        let payload = {
            commentedBy: data.auth.id,
            taggedUsers: data.taggedUsers,
            comment: data.comment
        }
        let commentRes = await Comments.insertRatingComment(payload)
        return { data: commentRes, error: false }
    } catch (err) {
        console.log("createPayloadAndInsertComment Error : ", err)
        return { data: err, error: true }
    }
}

const updateUserTaskRating = async function (data) {
    try {

        let findData = {
            _id: data.taskId
        }
        let updateData = {
            rating: data.rating,
            isRated: true,
            ratedBy: data.auth.id,
            $addToSet:{ ratingComments: data.commentId }
        }
        let options = {
            new: true
        }
        let taskRating = await Task.findOneAndUpdate(findData, updateData, options);
        console.log("Task rated Successfully => ", taskRating);
        return { data: taskRating, error: false }

    } catch (err) {
        console.log("Error => ", err);
        return { data: err, error: true }
    }
}

const getAllTasksWithSameDueDate = async function (data) {
    try {

        let findData = {
            assignedTo: data.taskDetails.assignedTo,
            dueDate: data.taskDetails.dueDate
        }

        console.log("Get all tasks of same due date => ", findData);

        let allTasks = await Task.taskFindQuery(findData, {}, "");
        console.log("Task for same due date fetched Successfully => ", allTasks.length);
        return { data: allTasks, error: false }

    } catch (err) {
        console.log("Error => ", err);
        return { data: err, error: true }
    }
}

const updateOverallRatingDoc = async function (data) {
    try {

        let dueDate = data.taskDetails.dueDate;

        const dateObj = new Date(dueDate);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1; // getMonth() returns 0-11, add 1 to get 1-12
        const date = dateObj.getUTCDate();

        console.log("Dates for which rating DOC =>", dateObj, date,month, year)
        let findData = {
            userId: data.taskDetails.assignedTo,
            date: date,
            month: month,
            year: year
        }

        let allRatedTasks = data.allTasksWithSameDueDate.filter(task => task.isRated);
        let sumOfRating = allRatedTasks.reduce((sum, task) => {
            return sum + task.rating
        }, 0);
        let averageRating = sumOfRating / allRatedTasks.length;
        let updateData = {
            rating: averageRating,
            $addToSet: { taskIds: data.taskId }
        };
        let options = {
            new: true,
            upsert: true
        }
        console.log("Get corrosponding rating doc => ", findData, " UpdateData => ", updateData)
        let averageUpdatedRating = await Rating.ratingFindOneAndUpdate(findData, updateData, options);
        console.log("Average Rating document updated Successfully => ", averageUpdatedRating);
        return { data: averageUpdatedRating, error: false }

    } catch (err) {
        console.log("Error => ", err);
        return { data: err, error: true }
    }
}

/**Controller for getting all tasks of a project id */
const getTasksByProjectId = async (req, res, next) => {

    let data = req.data;

    if (!data.projectId) {
        return res.status(400).send(sendResponse(400, "Please send all required Data fields", 'rateUserTask', null, req.data.signature))
    }

    let projectTasks = await getProjectSpecificTasks(data);
    if (projectTasks.error) {
        return res.status(500).send(sendResponse(500, 'Project Not found..', 'rateUserTask', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Task fetched', 'rateUserTask', projectTasks.data, req.data.signature));
}
exports.getTasksByProjectId = getTasksByProjectId;

const getProjectSpecificTasks = async function (data) {

    try {
        let findData = {
            projectId: data.projectId,
            isDeleted: false
        }
        let populate = "lead createdBy assignedTo ratingComments comments"
        let tasks = await Task.taskFindQuery(findData, {}, populate);
        console.log("Task fetched Successfully, length => ", tasks.length);
        return { data: tasks, error: false }
    } catch (err) {
        console.log("Error => ", err);
        return { data: err, error: true }
    }
}

//Get task lists for homepage - Set according to role
const getTaskList = async function (req, res, next) {

    let data = req.data;

	data.homePageTaskList = true
    let tasksLists = await createPayloadAndGetTaskLists(data);
    if (tasksLists.error) {
        return res.status(500).send(sendResponse(500, '', 'getTaskListForHomePage', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Task List', 'getTaskListForHomePage', tasksLists.data, req.data.signature));
}
exports.getTaskList = getTaskList;

const createPayloadAndGetAssignedProjects = async function (data) {
    try {
        let payload = {
            isActive: true
        }
        if (!['SUPER_ADMIN', "ADMIN"].includes(data.auth.role)) {
            payload["$or"] = [
                { accessibleBy: data.auth.id },
                { managedBy: data.auth.id },
            ]
        }
        let projection = {}
        let projectRes = await Project.getAllProjects(payload, projection);
        return { data: projectRes, error: false }
    } catch (err) {
        console.log("createPayloadAndgetAllProjects Error : ", err)
        return { data: err, error: true }
    }
}

//Get task lists for homepage - Set according to role
const getTaskListWithPendingRating = async function (req, res, next) {

    let data = req.data;

    data.pendingRatingTasks = true;
    let tasksLists = await createPayloadAndGetTaskLists(data);
    if (tasksLists.error) {
        return res.status(500).send(sendResponse(500, '', 'getTaskListForHomePage', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Task List', 'getTaskListForHomePage', tasksLists.data, req.data.signature));
}
exports.getTaskListWithPendingRating = getTaskListWithPendingRating;

//Get task lists for homepage - Set according to role
const getTaskListToRate = async function (req, res, next) {

    let data = req.data;

    if (!data.projectId || !data.userId || !data.dueDate) {
        return res.status(400).send(sendResponse(400, 'Missing Params', 'getTaskListToRate', null, req.data.signature))
    }
    data.isRated = false;
    let tasksLists = await createPayloadAndGetTaskLists(data);
    if (tasksLists.error) {
        return res.status(500).send(sendResponse(500, '', 'getTaskListToRate', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Task List', 'getTaskListToRate', tasksLists.data, req.data.signature));
}
exports.getTaskListToRate = getTaskListToRate;

const createPayloadAndGetTaskLists = async function (data) {
    try {

        let findData = {
            isDeleted:false
        };

        //filter tasks of only those project which are assigned to LEAD, CONTRIBUTOR, INTERN
        if (!['SUPER_ADMIN', "ADMIN"].includes(data.auth.role)) {
            findData.projectId = { $in: data.filteredProjects }
        }

        if (data.projectId) {
            findData.projectId = data.projectId
        }
        if (["CONTRIBUTOR", "INTERN"].includes(data.auth.role)) {

            findData["$or"] = [
                { createdBy: data.auth.id },
                { assignedTo: data.auth.id }
            ]
        } else if (["LEAD", "SUPER_ADMIN", "ADMIN"].includes(data.auth.role) && data.userId) {
            findData.assignedTo = data.userId
        }

        if (JSON.stringify(data.isRated)) {
            findData.isRated = data.isRated
        }

        if (data.dueDate) {
            findData.dueDate = new Date(new Date(data.dueDate).setUTCHours(23, 59, 59, 000))
        }

        if (JSON.stringify(data.pendingRatingTasks)) {
            findData.status = "COMPLETED";
            findData.isRated = false
        }
		if (JSON.stringify(data.homePageTaskList)) {
            findData.status = { $ne : "COMPLETED"};
        }
        console.log("Find Data for tasks => ", findData);
        let taskList = await Task.taskFindQuery(findData, {}, "");
        console.log("TaskList fetch according to role => ", taskList.length);
        return { data: taskList, error: false }

    } catch (err) {
        console.log("Error => ", err);
        return { data: err, error: true }
    }
}


//Delete task API Controller
const deleteTask = async (req, res, next) => {
    let data = req.data;
    if (!data.taskId) {
        return res.status(400).send(sendResponse(400, "", 'deleteTask', null, req.data.signature))
    }

    let fetchTaskById = await getTaskById(data);
    if (fetchTaskById.error) {
        return res.status(500).send(sendResponse(500, '', 'deleteTask', null, req.data.signature))
    }

    if (!fetchTaskById.data) {
        return res.status(400).send(sendResponse(400, 'No Task Found', 'deleteTask', null, req.data.signature))
    }
    console.log("task Fetched for deletion.... ", fetchTaskById.data, data.filteredProjects)
    if (fetchTaskById.data?.isRated) {
        return res.status(400).send(sendResponse(400, 'Task Already Rated', 'deleteTask', null, req.data.signature))
    }

    if (!['SUPER_ADMIN', "ADMIN"].includes(data.auth.role)) {
        if (fetchTaskById.data.projectId && !data.filteredProjects.includes(fetchTaskById.data.projectId.toString())) {
            return res.status(400).send(sendResponse(400, 'The Project of this task is no longer assigned to you', 'deleteTask', null, req.data.signature))
        }
        if (["CONTRIBUTOR", "INTERN"].includes(data.auth.role) && (data.auth.id.toString() != fetchTaskById.data.createdBy.toString())) {
            return res.status(400).send(sendResponse(400, 'You are not allowed to delete tasks created by others', 'deleteTask', null, req.data.signature))
        }
    }

    let taskRes = await createPayloadAndDeleteTask(data)
    console.log('taskRes : ', taskRes)
    if (taskRes.error) {
        return res.status(500).send(sendResponse(500, '', 'deleteTask', null, req.data.signature))
    }
    return res.status(200).send(sendResponse(200, "Task Deleted Successfully", 'deleteTask', null, req.data.signature))
}
exports.deleteTask = deleteTask;

const createPayloadAndDeleteTask = async function (data) {
    try {
        let payload = {
            _id: data.taskId
        }
        let updatePayload = {
            $set: {
                isDeleted: true
            }
        }
        let options = {
            new: true
        }
        let taskRes = await Task.findOneAndUpdate(payload, updatePayload, options)
        return { data: taskRes, error: false }
    } catch (err) {
        console.log("createPayloadAndDeleteTask Error : ", err)
        return { data: err, error: true }
    }
}

const createTaskLogPayloadAndAddLog = async function (data) {
    try {
        let payload = {
            _id: data.projectId,
        }
        
        let taskLogRes = await TaskLogs.addTaskLog(payload)
        return { data: taskLogRes, error: false }
    } catch (err) {
        console.log("createTaskLogPayloadAndAddLog Error : ", err)
        return { data: err, error: true }
    }
}
exports.createTaskLogPayloadAndAddLog = createTaskLogPayloadAndAddLog;

//Delete task API Controller
const updateTaskStatus = async (req, res, next) => {
    let data = req.data;
    if (!data.taskId) {
        return res.status(400).send(sendResponse(400, "", 'updateTaskStatus', null, req.data.signature))
    }

    let fetchTaskById = await getTaskById(data);
    if (fetchTaskById.error) {
        return res.status(500).send(sendResponse(500, '', 'updateTaskStatus', null, req.data.signature))
    }

    if (!fetchTaskById.data) {
        return res.status(400).send(sendResponse(400, 'No Task Found', 'updateTaskStatus', null, req.data.signature))
    }
    console.log("task Fetched for deletion.... ", fetchTaskById.data, data.filteredProjects)
    if (fetchTaskById.data?.isRated) {
        return res.status(400).send(sendResponse(400, 'Task Already Rated', 'updateTaskStatus', null, req.data.signature))
    }

    if (!['SUPER_ADMIN', "ADMIN"].includes(data.auth.role)) {
        if (fetchTaskById.data.projectId && !data.filteredProjects.includes(fetchTaskById.data.projectId.toString())) {
            return res.status(400).send(sendResponse(400, 'The Project of this task is no longer assigned to you', 'updateTaskStatus', null, req.data.signature))
        }
        if (["CONTRIBUTOR", "INTERN"].includes(data.auth.role) && (data.auth.id.toString() != fetchTaskById.data.createdBy.toString())) {
            return res.status(400).send(sendResponse(400, 'You are not allowed to update tasks status', 'updateTaskStatus', null, req.data.signature))
        }
    }

    let taskRes = await createPayloadAndUpdateTaskStatus(data)
    console.log('taskRes : ', taskRes)
    if (taskRes.error) {
        return res.status(500).send(sendResponse(500, '', 'deleteTask', null, req.data.signature))
    }
    return res.status(200).send(sendResponse(200, "Task Deleted Successfully", 'deleteTask', null, req.data.signature))
}
exports.updateTaskStatus = updateTaskStatus;

const createPayloadAndUpdateTaskStatus = async function (data) {
    try {
        let payload = {
            _id: data.taskId
        }
        let updatePayload = {
            $set: {
                status: data.status
            }
        }
        let options = {
            new: true
        }
        let taskRes = await Task.findOneAndUpdate(payload, updatePayload, options)
        return { data: taskRes, error: false }
    } catch (err) {
        console.log("createPayloadAndDeleteTask Error : ", err)
        return { data: err, error: true }
    }
}