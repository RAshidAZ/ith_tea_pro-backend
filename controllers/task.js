const mongoose = require('mongoose');
const btoa = require('btoa')
const { sendResponse } = require('../helpers/sendResponse');
const { populate } = require('../models/ratings');
const queryController = require('../query');
const { CONSTANTS } = require('../config/constants');

const { Task, Rating, Project, Comments, TaskLogs, User } = queryController;

const actionLogController = require("../controllers/actionLogs");
const userController = require("../controllers/user");

//helper
const emailUtitlities = require("../helpers/email");

//roles from config
const role = JSON.parse(process.env.role)

//Insert Task
const insertUserTask = async (req, res, next) => {
	let data = req.data;

	//not used as lead may be self/admin
	// if (data.auth.role == role.lead) {
	// 	data.tasklead = [process.env.ADMIN_ID]
	// }
	if (!data.title || !data.section || !data.projectId || !data.tasklead || !data.tasklead.length) {
		return res.status(400).send(sendResponse(400, "Please send all required Data fields", 'insertUserTask', null, req.data.signature))
	}

	let projectData = await Project.findSpecificProject({ _id : data.projectId});

	if (!projectData || projectData.isArchived) {
		return res.status(400).send(sendResponse(400, "Project Archived, Can't assign lead/users ", 'assignUserToProject', null, req.data.signature))
	}

	let ifAllowedToAddTask = await checkIfAllowedToAddTask(data);
	if (ifAllowedToAddTask.error) {
		return res.status(500).send(sendResponse(500, '', 'insertUserTask', null, req.data.signature))
	}

	if (!ifAllowedToAddTask.data.allowed) {
		return res.status(400).send(sendResponse(401, 'Not Allowed to add task for this project', 'insertUserTask', null, req.data.signature))
	}

	let taskRes = await createPayloadAndInsertTask(data)

	if (taskRes.error || !taskRes.data) {
		return res.status(500).send(sendResponse(500, '', 'insertUserTask', null, req.data.signature))
	}

	let actionLogData = {
		actionTaken: 'TASK_ADDED',
		actionBy: data.auth.id,
		taskId : taskRes.data._id
	}
	data.actionLogData = actionLogData;
	let addActionLogRes = await actionLogController.addTaskLog(data);

	if (addActionLogRes.error) {
		return res.status(500).send(sendResponse(500, '', 'insertUserTask', null, req.data.signature))
	}

	return res.status(200).send(sendResponse(200, 'Task Inserted', 'insertUserTask', taskRes.data, req.data.signature))
}
exports.insertUserTask = insertUserTask

const checkIfAllowedToAddTask = async function (data) {

	try {
		
		if ([role.superadmin, role.admin].includes(data.auth.role)) {
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
			if (data.tasklead) {

				if (!getProject.managedBy.length) {
					return { data: { allowed: false }, error: false }
				}
				let taskLead = data.tasklead
				// let checkIfLeadIsAssignedThisProject = getProject?.managedBy.includes(data.tasklead) || false;
				let managers = (getProject.managedBy).map(el => el.toString())

				let checkIfLeadIsAssignedThisProject = taskLead.every(el => managers.includes(el.toString())) || false

				if (!checkIfLeadIsAssignedThisProject) {
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
		if ([role.contributor, role.intern].includes(data.auth.role)) {
			data.assignedTo = data.auth.id
			data.dueDate = data.dueDate || new Date()
		};

		let payload = {
			title: data.title,
			description: data.description,
			status: data.status,
			section: data.section,
			projectId: data.projectId,
			createdBy: data?.auth?.id,    //TODO: Change after auth is updated
			assignedTo: data.assignedTo,
			// dueDate: data.dueDate || new Date(new Date().setUTCHours(23, 59, 59, 000)),
			completedDate: data.completedDate,
			priority: data.priority,
			lead: data.tasklead
		}
		
		if (data.dueDate) {
			payload.dueDate = new Date(new Date(data.dueDate).setUTCHours(23, 59, 59, 000))
		}

		if (data.attachments) {
			payload["attachments"] = data.attachments 
		}

		let taskRes = await Task.insertUserTask(payload)

		if(data.assignedTo && (data.auth.id != data.assignedTo)){
			let findUser = { _id : data.assignedTo}
			let findAssignedBy = { _id : data.auth.id }
			let userData = await User.userfindOneQuery(findUser)
			let assignedBy = await User.userfindOneQuery(findAssignedBy)
			let getProject = await Project.findSpecificProject({_id:data.projectId});
			data.projectName = (getProject && getProject.name) || null
			data.userName = (userData && userData.name) || null  ;
			data.assignedBy = assignedBy.name
			data.email = userData.email;
			data.taskLink = btoa(taskRes._id.toString())
			console.log("==========task link details",data.taskLink)
			let sendTaskMail = emailUtitlities.sendTaskMail(data)
		}
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

	if (!data.taskId) {
		return res.status(400).send(sendResponse(400, "", 'editUserTask', null, req.data.signature))
	}

	let task = await getTaskById(data);
	if (task.error || !task.data) {
		return res.status(400).send(sendResponse(400, 'Task Not found..', 'rateUserTask', null, req.data.signature))
	}

	if(task.data.dueDate && data.status == 'COMPLETED'){
		if(new Date(task.data.dueDate).getTime()< new Date().getTime()){
			data.isDelayTask = true
		}
	}

	data.taskDetails = task.data
	if ([role.contributor, role.intern].includes(data.auth.role) && task.data.isRated) {
		return res.status(400).send(sendResponse(400, 'You are not permitted to edit task once it is rated', 'rateUserTask', null, req.data.signature))
	}

	if (data.tasklead && data.tasklead.length) {
		let ifLeadAssigned = await checkIfLeadAssignedProject(data);
		if (ifLeadAssigned.error) {
			return res.status(500).send(sendResponse(500, '', 'createPayloadAndEditTask', null, req.data.signature))
		}

		if (!ifLeadAssigned.data.allowed) {
			return res.status(400).send(sendResponse(400, 'Not Allowed to add given lead for this task', 'createPayloadAndEditTask', null, req.data.signature))
		}
		// updatePayload.lead = data.tasklead
	}

	let taskRes = await createPayloadAndEditTask(data)
	if (taskRes.error) {
		return res.status(500).send(sendResponse(500, '', 'editUserTask', null, req.data.signature))
	}

	let actionTaken = 'TASK_UPDATED'
	let ifDueDateChanged = false

	if(taskRes && taskRes.data && data.status && data.status != taskRes.data.status){
		actionTaken = 'TASK_STATUS_UPDATED'
	}else if(taskRes && taskRes.data && (data.dueDate && new Date(data.dueDate).getTime() != new Date(taskRes.data.dueDate).getTime()) || (!data.dueDate && JSON.stringify(data.dueDate) && taskRes.data.dueDate)){

		actionTaken = 'TASK_DUEDATE_UPDATED'
		ifDueDateChanged = true

	}
	let actionLogData = {
		actionBy: data.auth.id,
		taskId : data.taskId,
	}
	let previousTaskData = {}
	let newTaskData = {}
	let taskUpdatePayload = data.taskUpdatePayload
	if(taskRes && taskRes.data && taskUpdatePayload){
		if(taskUpdatePayload.title && taskUpdatePayload.title != task.data.title){
			actionTaken = 'TASK_UPDATED'
			previousTaskData.title = task.data.title
			newTaskData.title = taskUpdatePayload.title
		}
		if(taskUpdatePayload.description && taskUpdatePayload.description != task.data.description){
			actionTaken = 'TASK_UPDATED'
			previousTaskData.description = task.data.description
			newTaskData.description = taskUpdatePayload.description
		}
		if(taskUpdatePayload.section && taskUpdatePayload.section != task.data.section){
			actionTaken = 'TASK_UPDATED'
			previousTaskData.section = task.data.section
			newTaskData.section = taskUpdatePayload.section
		}
		if(taskUpdatePayload.status && taskUpdatePayload.status != task.data.status){
			previousTaskData.status = task.data.status
			newTaskData.status = taskUpdatePayload.status
		}
		if(ifDueDateChanged){
			previousTaskData.dueDate = task.data.dueDate
			newTaskData.dueDate = taskUpdatePayload.dueDate
		}
		let currentDate = new Date()
		if(new Date(data.completedDate || currentDate).getTime() != new Date(taskRes.data.completedDate || currentDate).getTime()){
			previousTaskData.completedDate = task.data.completedDate
			newTaskData.completedDate = taskUpdatePayload.completedDate
		}
		if(taskUpdatePayload.priority && taskUpdatePayload.priority != task.data.priority){
			actionTaken = 'TASK_UPDATED'
			previousTaskData.priority = task.data.priority
			newTaskData.priority = taskUpdatePayload.priority
		}
		if(JSON.stringify(taskUpdatePayload.assignedTo) && (taskUpdatePayload.assignedTo || '') != task.data.assignedTo){
			actionTaken = 'TASK_UPDATED'
			previousTaskData.assignedTo = task.data.assignedTo
			newTaskData.assignedTo = taskUpdatePayload.assignedTo
		}
	}


	if(taskRes && taskRes.data){
		actionLogData.new = newTaskData
		actionLogData.previous = previousTaskData
		actionLogData.actionTaken = actionTaken
	
		data.actionLogData = actionLogData;
		let addActionLogRes = await actionLogController.addTaskLog(data);
	
		if (addActionLogRes.error) {
			return res.status(500).send(sendResponse(500, '', 'insertUserTask', null, req.data.signature))
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
		if ([role.contributor, role.intern].includes(data.auth.role)) {
			findPayload["$or"] = [
				{ createdBy: data.auth.id },
				{ assignedTo: data.auth.id },
				{ lead: data.auth.id },
			]
		}

		let updatePayload = {}
		if (JSON.stringify(data.title)) {
			updatePayload.title = data.title
		}
		if (data.attachments) {
			updatePayload["attachments"] = data.attachments 
		}
		if (JSON.stringify(data.description)) {
			updatePayload.description = data.description
		}
		if (JSON.stringify(data.status)) {
			updatePayload.status = data.status
			if (data.status == process.env.TASK_STATUS.split(",")[2] && (!data.taskDetails || !data.taskDetails.status || data.taskDetails.status != process.env.TASK_STATUS.split(",")[2]) ) {
				updatePayload.completedDate = new Date()
			} else {
				updatePayload.completedDate = null
			}
		}
		if (JSON.stringify(data.section)) {
			updatePayload.section = data.section
		}

		if (data.isDelayTask) {
			updatePayload.isDelayTask = data.isDelayTask
		}

		if (JSON.stringify(data.projectId)) {
			updatePayload.projectId = data.projectId
		}
		if (JSON.stringify(data.assignedTo)) {
			updatePayload.assignedTo = data.assignedTo
		}
		if (JSON.stringify(data.dueDate)) {
			let dueDate = data.dueDate
			if(dueDate){
				dueDate = new Date(new Date(data.dueDate).setUTCHours(23, 59, 59, 000))
			}else{
				dueDate = null
			}
			data.dueDate = dueDate
			updatePayload.dueDate = dueDate
		}
		if (JSON.stringify(data.completedDate)) {
			let completedDate = data.completedDate
			if(completedDate){
				completedDate = new Date(data.completedDate)
			}else{
				completedDate = null
			}
			updatePayload.completedDate = completedDate
		}
		if (JSON.stringify(data.priority)) {
			updatePayload.priority = data.priority
		}
		if (data.tasklead) {
			// let ifLeadAssigned = await checkIfLeadAssignedProject(data);
			// if (ifLeadAssigned.error) {
			// 	// return { data: ifLeadAssigned.data, error: true }
			// 	return res.status(500).send(sendResponse(500, '', 'createPayloadAndEditTask', null, req.data.signature))
			// }

			// if (!ifLeadAssigned.data.allowed) {
			// 	return { data: "Not Allowed to add given lead for this task", error: true }
			// 	// return res.status(400).send(sendResponse(401, 'Not Allowed to add given lead for this task', 'createPayloadAndEditTask', null, req.data.signature))
			// }
			updatePayload.lead = data.tasklead
		}
		data.taskUpdatePayload = updatePayload;
		let taskRes = await Task.findOneAndUpdate(findPayload, updatePayload, {new : false})
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

	let allowedTaskGroup = process.env.ALLOWED_GROUP_BY.split(',')

	if (!allowedTaskGroup.includes(data.groupBy)) {
		return res.status(400).send(sendResponse(400, `${data.groupBy} Group By Not Supported`, 'getGroupByTasks', null, req.data.signature))
	} else {
		data.aggregateGroupBy = `$${data.groupBy}`
	}

	data.aggregateGroupBy = CONSTANTS.GROUP_BY[data.groupBy]

	let taskRes = await createPayloadAndGetGroupByTask(data)
	if (taskRes.error) {
		return res.status(500).send(sendResponse(500, '', 'getGroupByTasks', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, 'Task Fetched Successfully', 'getGroupByTasks', taskRes.data, req.data.signature))
}
exports.getGroupByTasks = getGroupByTasks;

const createPayloadAndGetGroupByTask = async function (data) {
	try {
		let findData = { "isDeleted": false }
		let filter = {}
		let sortTaskOrder = { "_id.projectId": 1, "_id.section": 1 }
		let allowedSortType = process.env.ALLOWED_SORT_BY.split(',')
		let filterAnd = []


		if (JSON.stringify(data.isArchived)) {
			findData["isArchived"] = JSON.parse(data.isArchived)
		}else {
			findData["isArchived"] = false
		}
		
		console.log("==============filtered projects=======",data.filteredProjects)
		if(data.filteredProjects){
			findData._id = { $in : data.filteredProjects.map((el)=>mongoose.Types.ObjectId(el))}
		}
		
		let preserveArrays = false
		if (data.projectIds || data.projectId) {
			let projectIds = data.projectIds ? JSON.parse(data.projectIds) : [data.projectId]
			findData["_id"] = { $in: projectIds.map(el => mongoose.Types.ObjectId(el)) }
		}
		if (data.assignedTo) {
			let assignTo = JSON.parse(data.assignedTo)
			filter["tasks.assignedTo"] = { $in: assignTo.map(el => mongoose.Types.ObjectId(el)) }
		}
		if (data.userTasks) {
			let assignTo = data.auth.id
			filter["tasks.assignedTo"] = mongoose.Types.ObjectId(assignTo)
		}
		if (data.createdBy) {
			let createdBy = JSON.parse(data.createdBy)
			filter["tasks.createdBy"] = { $in: createdBy.map(el => mongoose.Types.ObjectId(el)) }
		}
		if (data.sections) {
			let sections = JSON.parse(data.sections)
			filter["tasks.section"] = { $in: sections.map(el => mongoose.Types.ObjectId(el)) }
		}
		if (data.priority) {
			let priorities = JSON.parse(data.priority)
			filter["tasks.priority"] = { $in: priorities }
		}
		if (data.status) {
			let status = JSON.parse(data.status)
			filter["tasks.status"] = { $in: status }
		}
		if (["default", "section"].includes(data.groupBy)) {
			preserveArrays = true
		}
		if (JSON.stringify(data.isArchived)) {
			filterAnd.push({
				$or: [
					{ section: { $exists: false } },
					{ "section.isArchived": JSON.parse(data.isArchived) }
				]
			})
		}else {
			filterAnd.push({
				$or: [
					{ section: { $exists: false } },
					{ "section.isArchived": false }
				]
			})
		}
		
		if(filterAnd.length){
			filter["$and"] = filterAnd
		}
		
		let filterDate = {};
		if (data.fromDate) {
			let fromDate = new Date(data.fromDate)
			filterDate["$gte"] = new Date(fromDate.setUTCHours(0, 0, 0, 0))	
		}

		if (data.toDate) {
			let toDate = new Date(data.toDate)
			filterDate["$lte"] = new Date(toDate.setUTCHours(23, 59, 59, 999))
		}

		if (data.fromDate || data.toDate) {
			filter["tasks.dueDate"] = filterDate;
		}

		if(data.sortType && allowedSortType.includes(data.sortType)){
			let sortOrder = parseInt(data.sortOrder || 0)
			console.log("=================sort order and type ====", data.sortType, sortOrder)
			sortTaskOrder = sortOrder > 0 ? CONSTANTS.SORTBY_IN_INCREASING_ORDER[data.sortType] : CONSTANTS.SORTBY_IN_DECREASING_ORDER[data.sortType]
		}

		if(!['SUPER_ADMIN', 'ADMIN'].includes(data.auth.role)){
			let deletedUserIds = await userController.createPayloadAndgetDeletedUsers(data)
			deletedUserIds = deletedUserIds.data || []
	
			if(data.assignedTo){
				let assignedTo = JSON.parse(data.assignedTo)

				filter["tasks.assignedTo"] = { $nin : deletedUserIds, $in : assignedTo.map(el => mongoose.Types.ObjectId(el))}
			}else{
				filter["tasks.assignedTo"] = { $nin : deletedUserIds }
			}

			if(data.createdBy){
				let createdBy = JSON.parse(data.createdBy)

				filter["tasks.createdBy"] = { $nin : deletedUserIds, $in : createdBy.map(el => mongoose.Types.ObjectId(el))}
			}else{
				filter["tasks.createdBy"] = { $nin : deletedUserIds }
			}
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
										{ "$eq": ["$isDeleted", false] },
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
			{ "$unwind": { "path": "$tasks", preserveNullAndEmptyArrays: preserveArrays } },
			{ $match: filter },
			{
				"$group": {
					"_id": data.aggregateGroupBy,
					"tasks": { "$push": "$tasks" },
					projectId: { $first: "$_id" },
					isArchived: { $first: "$isArchived" },
					sectionId: { $first: "$section._id" },
					completedTasks: { $sum: { $cond: [{ $eq: ["$tasks.status", "COMPLETED"] }, 1, 0] } },
					ongoingTasks: { $sum: { $cond: [{ $eq: ["$tasks.status", "ONGOING"] }, 1, 0] } },
					onHoldTasks: { $sum: { $cond: [{ $eq: ["$tasks.status", "ONHOLD"] }, 1, 0] } },
					noProgressTasks: { $sum: { $cond: [{ $eq: ["$tasks.status", "NOT_STARTED"] }, 1, 0] } }
				}
			},
			{
				$project: {
					_id: 1,
					tasks: 1,
					totalTasks: { $size: "$tasks" },
					projectId : 1,
					isArchived : 1,
					sectionId : 1,
					completedTasks: 1,
					ongoingTasks: 1,
					onHoldTasks: 1,
					noProgressTasks: 1
				}
			},
			{ $sort: sortTaskOrder }
		]

		console.log("================================find and filter data for group by=====", findData, filter)

		
		let taskRes = await Project.projectAggregate(aggregate)

		let populate = []
		if (data.groupBy == 'default') {
			// populate.push({ path: '_id.projectId', model: 'projects', select: 'name' })
			populate.push({ path: 'tasks.createdBy', model: 'users', select: 'name' })
			populate.push({ path: 'tasks.assignedTo', model: 'users', select: 'name profilePicture' })
		}
		if (data.groupBy == 'projectId') {
			// populate.push({ path: '_id', model: 'projects', select: 'name' })
			populate.push({ path: 'tasks.createdBy', model: 'users', select: 'name' })
			populate.push({ path: 'tasks.assignedTo', model: 'users', select: 'name profilePicture' })
		}
		if (data.groupBy == 'createdBy') {
			populate.push({ path: '_id.createdBy', model: 'users', select: 'name' })
			populate.push({ path: 'tasks.projectId', model: 'projects', select: 'name' })
			populate.push({ path: 'tasks.assignedTo', model: 'users', select: 'name profilePicture' })
		}
		if (data.groupBy == 'assignedTo') {
			populate.push({ path: '_id.assignedTo', model: 'users', select: 'name' })
			populate.push({ path: 'tasks.assignedTo', model: 'users', select: 'name profilePicture' })
			populate.push({ path: 'tasks.createdBy', model: 'users', select: 'name' })
			populate.push({ path: 'tasks.projectId', model: 'projects', select: 'name' })

		}
		if (data.groupBy == 'status' || data.groupBy == 'sections') {
			populate.push({ path: 'tasks.projectId', model: 'projects', select: 'name' })
			populate.push({ path: 'tasks.createdBy', model: 'users', select: 'name' })
			populate.push({ path: 'tasks.assignedTo', model: 'users', select: 'name profilePicture' })
		}

		let populatedRes = await Project.projectPopulate(taskRes, populate)
		return { data: populatedRes, error: false }
	} catch (err) {
		console.log("createPayloadAndGetGroupByTask Error : ", err)
		return { data: err, error: true }
	}
}
exports.createPayloadAndGetGroupByTask = createPayloadAndGetGroupByTask;

const getTaskDetailsByTaskId = async (req, res, next) => {
	let data = req.data;

	if (!data.taskId) {
		return res.status(400).send(sendResponse(400, ``, 'getTaskDetailsByTaskId', null, req.data.signature))
	}

	let taskRes = await createPayloadAndGetTask(data)
	if (taskRes.error) {
		return res.status(500).send(sendResponse(500, '', 'getTaskDetailsByTaskId', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, 'Task Fetched Successfully', 'getTaskDetailsByTaskId', taskRes.data, req.data.signature))
}
exports.getTaskDetailsByTaskId = getTaskDetailsByTaskId;

const createPayloadAndGetTask = async function (data) {
	try {
		let findData = {
			_id: data.taskId,
			"isDeleted": false
		}
		let projection = {
			// "comments.comment" : 1
		}
		let populate = [
			{ path: 'comments', model: 'comments', select: 'comment _id createdAt commentedBy'},
			{ path: 'ratingComments', model: 'comments', select: 'comment _id createdAt commentedBy'},
			{ path: 'createdBy', model: 'users', select: 'name _id' },
			{ path: 'assignedTo', model: 'users', select: 'name' },
			{ path: 'projectId', model: 'projects', select: 'name _id' },
			{ path: 'lead', model: 'users', select: 'name _id' },
			{ path: 'section', model: 'projectSections', select: 'name _id' }
		]
		let taskRes = await Task.taskFindOneQuery(findData, projection, populate)
		let commentPopulate = [{
			path: 'comments.commentedBy', model: 'users', select: 'name _id',
		},
		{
			path: 'ratingComments.commentedBy', model: 'users', select: 'name _id'
		}]
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
		return { data: insertRes, error: false }
	} catch (error) {
		console.log("addCommentIdInTaskById Error : ", error)
		return { data: error, error: true }
	}
}
exports.addCommentIdInTaskById = addCommentIdInTaskById;


const getTaskStatusAnalytics = async (req, res, next) => {
	let data = req.data;

	let taskRes = await payloadGetTaskStatusAnalytics(data)
	if (taskRes.error) {
		return res.status(500).send(sendResponse(500, '', 'getTaskStatusAnalytics', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, 'Task analytics Fetched Successfully', 'getTaskStatusAnalytics', taskRes.data, req.data.signature))
}
exports.getTaskStatusAnalytics = getTaskStatusAnalytics;

const payloadGetTaskStatusAnalytics = async function (data) {
	try {
		let taskRes = await Task.taskFindQuery({"isDeleted": false}, { status: 1, projectId: 1, _id: 0, dueDate:1, completedDate:1 })
		let sendData = {}
		for (let i = 0; i < taskRes.length; i++) {
			if (!sendData[taskRes[i].projectId]) {

				sendData[taskRes[i].projectId] = {
					COMPLETED: 0,
					ONGOING: 0,
					ONHOLD: 0,
					NOT_STARTED: 0,
					totalTask: 0,
					overDueTasks : 0
				}

		
			} 
			sendData[taskRes[i].projectId][taskRes[i].status] += 1
			sendData[taskRes[i].projectId].totalTask += 1
			if(taskRes[i].completedDate && taskRes[i].dueDate && new Date(taskRes[i].dueDate) < new Date(taskRes[i].completedDate)){
				sendData[taskRes[i].projectId].overDueTasks += 1
			}
		}
		let projectIds = Object.keys(sendData)
		for (let i = 0; i < projectIds.length; i++) {
			sendData[projectIds[i]]["totalTask"] && (sendData[projectIds[i]] = {
				COMPLETED: parseFloat(sendData[projectIds[i]]['COMPLETED'] * 100 / sendData[projectIds[i]]["totalTask"]).toFixed(2),
				ONGOING: parseFloat(sendData[projectIds[i]]['ONGOING'] * 100 / sendData[projectIds[i]]["totalTask"]).toFixed(2),
				ONHOLD: parseFloat(sendData[projectIds[i]]['ONHOLD'] * 100 / sendData[projectIds[i]]["totalTask"]).toFixed(2),
				NOT_STARTED: parseFloat(sendData[projectIds[i]]['NOT_STARTED'] * 100 / sendData[projectIds[i]]["totalTask"]).toFixed(2),
				totalTask: sendData[projectIds[i]]["totalTask"],
				overDueTasks: parseFloat(sendData[projectIds[i]]['overDueTasks'] * 100 / sendData[projectIds[i]]["totalTask"]).toFixed(2),

				// overDueTasks: sendData[projectIds[i]]["totalTask"]
			})
		}
		return { data: sendData, error: false }
	} catch (err) {
		console.log("createPayloadAndGetGroupByTask Error : ", err)
		return { data: err, error: true }
	}
}
exports.createPayloadAndGetGroupByTask = createPayloadAndGetGroupByTask;


// Controller of adding rating to user task
const rateUserTask = async (req, res, next) => {

	let data = req.data;

	if (!data.taskId || !data.rating) {
		return res.status(400).send(sendResponse(400, "Please send all required Data fields", 'rateUserTask', null, req.data.signature))
	}

	let task = await getTaskById(data);
	if (task.error || !task.data) {
		return res.status(400).send(sendResponse(400, 'Task Not found..', 'rateUserTask', null, req.data.signature))
	}

	let rating = parseInt(data.rating)
	if (rating > 6) {
		return res.status(400).send(sendResponse(400, 'Rating should be less than 6', 'rateUserTask', null, req.data.signature))
	}

	let currentDate = new Date();
	let taskDueDate = task.data.dueDate;
	if (!task.data.completedDate) {
		return res.status(400).send(sendResponse(400, 'Task is not completed', 'rateUserTask', null, req.data.signature))
	}
	taskDueDate = new Date(taskDueDate);
	
	let timeDifference = ((currentDate.getTime()-taskDueDate.getTime()) || 1)/(1000 * 60 * 60)
	if (timeDifference > 24) {
		data.isDelayRated = true
		// return res.status(400).send(sendResponse(400, 'Oops, You are late in rating..', 'rateUserTask', null, req.data.signature))
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

	data.taskDetails = taskDetails;

	if (![role.superadmin, role.admin].includes(data.auth.role)) {


		let checkIfAllowedToRateTask = ((taskDetails.assignedTo.toString()) != data.auth.id.toString()) && taskDetails.lead.includes(data.auth.id) && data.filteredProjects.includes(taskDetails.projectId.toString());

		if (!checkIfAllowedToRateTask) {
			return res.status(400).send(sendResponse(400, 'Not allowed to rate task', 'rateUserTask', null, req.data.signature))
		}
	}

	if (data.comment) {
		data.type = 'RATING'     //RATING
		let insertTaskCommentRes = await createPayloadAndInsertTaskRatingComment(data);
		if (insertTaskCommentRes.error || !insertTaskCommentRes.data) {
			return res.status(500).send(sendResponse(500, 'Task comment could not be added..', 'rateUserTask', null, req.data.signature))
		}
		data.commentId = insertTaskCommentRes.data._id;
	}
	let updateTaskRating = await updateUserTaskRating(data);

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
		actionTaken: 'RATE_TASK',
		actionBy: data.auth.id,
		userId : taskDetails.assignedTo,
		taskId: data.taskId,
		ratingId : updatedOverallRating.data._id
	}
	data.actionLogData = actionLogData;
	let addActionLogRes = await actionLogController.addRatingLog(data);

	if (addActionLogRes.error) {
		return res.status(500).send(sendResponse(500, '', 'insertUserTask', null, req.data.signature))
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
			comment: data.comment,
			type : data.type
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
			$addToSet: { ratingComments: data.commentId }
		}
		if(data.isDelayRated){
			updateData.isDelayRated = data.isDelayRated
		}
		let options = {
			new: true
		}
		let taskRating = await Task.findOneAndUpdate(findData, updateData, options);
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


		let allTasks = await Task.taskFindQuery(findData, {}, "");
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

		let findData = {
			userId: data.taskDetails.assignedTo,
			date: date,
			month: month,
			year: year,
			dueDate : dueDate
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
		let averageUpdatedRating = await Rating.ratingFindOneAndUpdate(findData, updateData, options);
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

//Get task lists for homepage - Set according to role
const getTaskListWithPendingRating = async function (req, res, next) {

	let data = req.data;

	data.pendingRatingTasks = true;
	let tasksLists = await createPayloadAndGetPendingRatingTasks(data);
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
	data.status = 'COMPLETED'
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
			isDeleted: false,
			isArchived :  false,
		};

		let sortCriteria = {

		}
		if(data.status){
			findData.status = data.status
		}

		//filter tasks of only those project which are assigned to LEAD, CONTRIBUTOR, INTERN
		if (![role.superadmin, role.admin].includes(data.auth.role)) {
			findData.projectId = { $in: data.filteredProjects }
		}

		if (data.projectId) {
			findData.projectId = data.projectId
		}
		if ([role.contributor, role.intern].includes(data.auth.role)) {

			findData["$or"] = [
				{ createdBy: data.auth.id },
				{ assignedTo: data.auth.id }
			]
		} else if ([role.lead, role.superadmin, role.admin].includes(data.auth.role) && data.userId) {
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
			sortCriteria.dueDate = 1
			findData.status = { $ne: "COMPLETED" };
			findData.assignedTo = data.auth.id
			if(findData.dueDate){
				let filterDueDate = { $eq : findData.dueDate, $lte : new Date(new Date().setUTCHours(23, 59, 59, 000)) }
				findData.dueDate = filterDueDate

			}else{

				findData.dueDate = { $lte : new Date(new Date().setUTCHours(23, 59, 59, 000)) }
			}
		}
		let populate = 'lead assignedTo'

		if(JSON.stringify(data.pendingRatingTasks) || !['SUPER_ADMIN', 'ADMIN'].includes(data.auth.role)){
			let deletedUserData = await userController.createPayloadAndgetDeletedUsers(data)
			if(deletedUserData.data){
				let deletedUserIds = deletedUserData.data || []
				if(findData.assignedTo){
					let assignedTo = {$nin : deletedUserIds, $eq : findData.assignedTo }
					findData.assignedTo = assignedTo
				}else{
					findData.assignedTo = { $nin : deletedUserIds}
				}
				findData.createdBy = { $nin : deletedUserIds}
			}
		}


		console.log("==============find data for tasks======",findData)
		let taskList = await Task.taskFindQuery(findData, {}, populate,sortCriteria);
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
	if (fetchTaskById.data?.isRated) {
		return res.status(400).send(sendResponse(400, 'Task Already Rated', 'deleteTask', null, req.data.signature))
	}

	if (![role.superadmin, role.admin].includes(data.auth.role)) {
		if (fetchTaskById.data.projectId && !data.filteredProjects.includes(fetchTaskById.data.projectId.toString())) {
			return res.status(400).send(sendResponse(400, 'The Project of this task is no longer assigned to you', 'deleteTask', null, req.data.signature))
		}
		if ([role.contributor, role.intern].includes(data.auth.role) && (data.auth.id.toString() != fetchTaskById.data.createdBy.toString())) {
			return res.status(400).send(sendResponse(400, 'You are not allowed to delete tasks created by others', 'deleteTask', null, req.data.signature))
		}
	}

	let taskRes = await createPayloadAndDeleteTask(data)
	if (taskRes.error) {
		return res.status(500).send(sendResponse(500, '', 'deleteTask', null, req.data.signature))
	}

	let actionLogData = {
		actionTaken: 'TASK_DELETED',
		actionBy: data.auth.id,
		taskId : data.taskId
	}
	data.actionLogData = actionLogData;
	let addActionLogRes = await actionLogController.addTaskLog(data);

	if (addActionLogRes.error) {
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

	if(fetchTaskById.data.dueDate && data.status == 'COMPLETED'){
		if(new Date(fetchTaskById.data.dueDate).getTime()< new Date().getTime()){
			data.isDelayTask = true
		}
	}
	if (fetchTaskById.data?.isRated) {
		return res.status(400).send(sendResponse(400, 'Task Already Rated', 'updateTaskStatus', null, req.data.signature))
	}

	if (![role.superadmin, role.admin].includes(data.auth.role)) {
		if (fetchTaskById.data.projectId && !data.filteredProjects.includes(fetchTaskById.data.projectId.toString())) {
			return res.status(400).send(sendResponse(400, 'The Project of this task is no longer assigned to you', 'updateTaskStatus', null, req.data.signature))
		}
		if ([role.contributor, role.intern].includes(data.auth.role) && (data.auth.id.toString() != fetchTaskById.data.assignedTo.toString())) {
			return res.status(400).send(sendResponse(400, 'You are not allowed to update tasks status', 'updateTaskStatus', null, req.data.signature))
		}
	}

	let taskRes = await createPayloadAndUpdateTaskStatus(data)
	if (taskRes.error || !taskRes.data) {
		return res.status(500).send(sendResponse(500, '', 'updateTaskStatus', null, req.data.signature))
	}

	if(data.status && data.status != taskRes.data.status){
		let actionLogData = {
			actionTaken: 'TASK_STATUS_UPDATED',
			actionBy: data.auth.id,
			taskId : data.taskId,
			previous : { status : taskRes && taskRes.data.status},
			new : { status : data.status }
		} 
		data.actionLogData = actionLogData;
		let addActionLogRes = await actionLogController.addTaskLog(data);
	
		if (addActionLogRes.error) {
			return res.status(500).send(sendResponse(500, '', 'updateTaskStatus', null, req.data.signature))
		}
	}

	return res.status(200).send(sendResponse(200, "Task status updated Successfully", 'updateTaskStatus', null, req.data.signature))
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

		if(data.status == 'COMPLETED'){
			updatePayload['$set'] = {
					status: data.status,
					completedDate : new Date(),
					isDelayTask : data.isDelayTask || false
				}
		}
		let options = {
			new: false
		}
		let taskRes = await Task.findOneAndUpdate(payload, updatePayload, options)
		return { data: taskRes, error: false }
	} catch (err) {
		console.log("createPayloadAndDeleteTask Error : ", err)
		return { data: err, error: true }
	}
}

// Controller of adding comment to user task
const commentUserTask = async (req, res, next) => {

	let data = req.data;

	if (!data.taskId || !data.comment) {
		return res.status(400).send(sendResponse(400, "Please send all required Data fields", 'commentUserTask', null, req.data.signature))
	}

	let task = await getTaskById(data);
	if (task.error || !task.data) {
		return res.status(400).send(sendResponse(400, 'Task Not found..', 'commentUserTask', null, req.data.signature))
	}

	let taskDetails = task.data;

	data.taskDetails = taskDetails;

	if (data.comment) {
		// data.type = process.env.ALLOWED_GROUP_BY.split(',')[0]
		data.type = "TASK"
		let insertTaskCommentRes = await createPayloadAndInsertTaskRatingComment(data);
		if (insertTaskCommentRes.error || !insertTaskCommentRes.data) {
			return res.status(500).send(sendResponse(500, 'Task comment could not be added..', 'commentUserTask', null, req.data.signature))
		}
		data.commentId = insertTaskCommentRes.data._id;
	}
	let updateTaskComment = await updateUserTaskComment(data);

	if (updateTaskComment.error || !updateTaskComment.data) {
		return res.status(500).send(sendResponse(500, '', 'commentUserTask', null, req.data.signature))
	}

	let actionLogData = {
		actionTaken: "TASK_COMMENT",
		actionBy: data.auth.id,
		taskId : data.taskId,
		commentId : data.commentId
	}
	data.actionLogData = actionLogData;
	let addActionLogRes = await actionLogController.addTaskLog(data);

	if (addActionLogRes.error) {
		return res.status(500).send(sendResponse(500, '', 'commentUserTask', null, req.data.signature))
	}

	return res.status(200).send(sendResponse(200, 'Task Commented', 'commentUserTask', updateTaskComment.data, req.data.signature));
}
exports.commentUserTask = commentUserTask;

const updateUserTaskComment = async function (data) {
	try {

		let findData = {
			_id: data.taskId
		}
		let updateData = {
			$addToSet: { comments: data.commentId }
		}
		let options = {
			new: true
		}
		let taskRating = await Task.findOneAndUpdate(findData, updateData, options);
		return { data: taskRating, error: false }

	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

const checkIfLeadAssignedProject = async function (data) {

	try {

		let findAdmins = {
			_id : { $in : data.tasklead || []},
			role : { $nin : ['ADMIN']}
		}
		let userRes = await User.getDistinct("_id",findAdmins)
		let findData = {
			_id: data.projectId
		}

		if(userRes && userRes.length){
			data.findDeletedUsers = { _id : { $in : userRes }, isDeleted : true}
			let deletedUserData = await userController.createPayloadAndgetDeletedUsers(data)
			let deletedUserIds = deletedUserData.data || []
			findData.managedBy = { $in: userRes, $nin : deletedUserIds}
		}
		let getProject = await Project.findSpecificProject(findData);
		if (getProject) {
			return { data: { allowed: true }, error: false }
		} else {
			return { data: { allowed: false }, error: false }
		}
	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

// Get comments of taks and rating of user for given date
const getUserTaskComments = async function (req, res, next) {

	let data = req.data;

	if (!data.userId) {
		return res.status(400).send(sendResponse(400, 'Missing Params', 'getTaskListToRate', null, req.data.signature))
	}
	let userComments = await createPayloadAndGetTaskComments(data);
	if (userComments.error) {
		return res.status(500).send(sendResponse(500, '', 'getTaskListToRate', null, req.data.signature))
	}

	return res.status(200).send(sendResponse(200, 'Task List', 'getTaskListToRate', userComments.data, req.data.signature));
}
exports.getUserTaskComments = getUserTaskComments;

const createPayloadAndGetTaskComments = async function (data) {
	try {

		let findData = {
			userId : data.userId,
			isDeleted: false
		};

		//filter tasks of only those project which are assigned to LEAD, CONTRIBUTOR, INTERN
		if (![role.superadmin, role.admin].includes(data.auth.role)) {
			findData.projectId = { $in: data.filteredProjects }
		}

		if (data.projectId) {
			findData.projectId = data.projectId
		} 

		if (data.dueDate) {
			findData.dueDate = new Date(new Date().setUTCHours(23, 59, 59, 000))
		}

		let populate = 'comments ratingComments'
		let taskList = await Task.taskFindQuery(findData, {}, populate);
		return { data: taskList, error: false }

	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

//Get task lists for homepage - Set according to role
const getTodayTasksList = async function (req, res, next) {

	let data = req.data;

	let tasksLists = await createPayloadAndGetTodayTaskLists(data);
	if (tasksLists.error) {
		return res.status(500).send(sendResponse(500, '', 'getTaskListForHomePage', null, req.data.signature))
	}

	return res.status(200).send(sendResponse(200, 'Task List', 'getTaskListForHomePage', tasksLists.data, req.data.signature));
}
exports.getTodayTasksList = getTodayTasksList;

const createPayloadAndGetTodayTaskLists = async function (data) {
	try {
		
		let startDayTime =  new Date(new Date().setUTCHours(00, 00, 00, 000));
		let endDayTime =  new Date(new Date().setUTCHours(23, 59, 59, 000));
		
		let findData = {
			isDeleted: false,
			isArchived :  false,
			dueDate : { $gte : startDayTime, $lte : endDayTime },
		};
		if(!['SUPER_ADMIN','ADMIN'].includes(data.auth.role)){
			findData.projectId = { $in : data.filteredProjects || []}
			findData["$or"] = [
				{ createdBy: data.auth.id },
				{ assignedTo: data.auth.id },
				{ lead: data.auth.id }
			]
		}

		
		let populate = 'assignedTo'
		
		if(!['SUPER_ADMIN', 'ADMIN'].includes(data.auth.role)){
			let deletedUserData = await userController.createPayloadAndgetDeletedUsers(data)
			if(deletedUserData.data){
				let deletedUserIds = deletedUserData.data || []
				findData.assignedTo = { $nin : deletedUserIds}
				findData.createdBy = { $nin : deletedUserIds}
			}
		}
		
		let taskList = await Task.taskFindQuery(findData, {}, populate);
		return { data: taskList, error: false }

	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

//Get overdue tasks list
const getOverDueTasks = async function (req, res, next) {

	let data = req.data;

	let tasksLists = await createPayloadAndGetOverDueTasks(data);
	if (tasksLists.error) {
		return res.status(500).send(sendResponse(500, '', 'getOverDueTasks', null, req.data.signature))
	}

	return res.status(200).send(sendResponse(200, 'Task List', 'getOverDueTasks', tasksLists.data, req.data.signature));
}
exports.getOverDueTasks = getOverDueTasks;

const createPayloadAndGetOverDueTasks = async function (data) {
	try {

		let findData = {
			isDeleted: false,
			isArchived :  false,
			status : {$nin : ['ONHOLD','COMPLETED']}, dueDate : { $lte : new Date()}
		};
		
		// let deletedUserData = await userController.createPayloadAndgetDeletedUsers(data)
		// if(deletedUserData.data){
		// 	let deletedUserIds = deletedUserData.data || []
		// 	findData.assignedTo = { $nin : deletedUserIds}
		// 	findData.createdBy = { $nin : deletedUserIds}
		// }

		
		let populate = 'lead assignedTo'
		let taskList = await Task.taskFindQuery(findData, {}, populate);
		return { data: taskList, error: false }

	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

const createPayloadAndGetPendingRatingTasks = async function (data) {
	try {

		let findData = {
			isDeleted: false,
			isArchived :  false,
			status : "COMPLETED",
			isRated : false
		};

		//filter tasks of only those project which are assigned to LEAD, CONTRIBUTOR, INTERN
		if (![role.superadmin, role.admin].includes(data.auth.role)) {
			findData.projectId = { $in: data.filteredProjects }
		}

		if ([role.contributor, role.intern].includes(data.auth.role)) {

			findData["$or"] = [
				{ createdBy: data.auth.id },
				{ assignedTo: data.auth.id }
			]
		}
		if (data.auth.role == role.lead) {
			findData.lead = data.auth.id
		}

		
		let populate = 'lead assignedTo'

		if(!['SUPER_ADMIN', 'ADMIN'].includes(data.auth.role)){
			let deletedUserData = await userController.createPayloadAndgetDeletedUsers(data)
			if(deletedUserData.data){
				let deletedUserIds = deletedUserData.data || []
				findData.assignedTo = { $nin : deletedUserIds}
				findData.createdBy = { $nin : deletedUserIds}
			}
		}

		let taskList = await Task.taskFindQuery(findData, {}, populate);
		return { data: taskList, error: false }

	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}