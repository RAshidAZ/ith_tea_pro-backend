const mongoose = require('mongoose');
const btoa = require('btoa')
const validator = require('validator');
const { sendResponse } = require('../helpers/sendResponse');
const queryController = require('../query');
const { CONSTANTS } = require('../config/constants');
const commentController = require('./comment');
const cheerio = require('cheerio');
const excelJS = require("exceljs");

const { Task, Rating, Project, Comments, TaskLogs, User, ProjectSections } = queryController;

const actionLogController = require("../controllers/actionLogs");
const userController = require("../controllers/user");

//helper
const utilities = require("../helpers/security");
const emailUtitlities = require("../helpers/email");
const { getTaskLogs } = require('../query/taskLogs');


//Insert Task
const insertUserTask = async (req, res, next) => {
	let data = req.data;

	if (!data.title || !data.section || !data.projectId || !data.tasklead || !data.tasklead.length) {
		return res.status(400).send(sendResponse(400, "Please send all required Data fields", 'insertUserTask', null, req.data.signature))
	}

	if (data.dueDate && !validator.isISO8601(data.dueDate) && validator.isDate(data.dueDate)) {
		delete data.dueDate
	}

	let currentDate = new Date()
	let timeZoneOffsetMinutes = currentDate.getTimezoneOffset();
	currentDate = new Date(currentDate.getTime() - timeZoneOffsetMinutes * 1000 * 60)

	if (data.dueDate && ((new Date(data.dueDate)).getDate() < currentDate.getDate())) {

		console.log("+++++++++++++++",new Date(data.dueDate).getDate())
		console.log("===",new Date().getDate())
		console.log("===",new Date(data.dueDate).getDate() < currentDate.getDate())

		return res.status(400).send(sendResponse(400, "Bete, ye sab mat karo... Rating 0 ho gayi aaj ki.", 'insertUserTask', null, req.data.signature))
	}

	let projectData = await Project.findSpecificProject({ _id: data.projectId });

	if (!projectData || projectData.isArchived) {
		return res.status(400).send(sendResponse(400, "Project Archived, can't add task", 'insertUserTask', null, req.data.signature))
	}

	if (projectData.isDeleted) {
		return res.status(400).send(sendResponse(400, "Project deleted, can't add task ", 'insertUserTask', null, req.data.signature))
	}

	if (!projectData.isActive) {
		return res.status(400).send(sendResponse(400, "Project inactive, can't add task ", 'insertUserTask', null, req.data.signature))
	}


	let ifAllowedToAddTask = await checkIfAllowedToAddTask(data);
	if (ifAllowedToAddTask.error) {
		return res.status(500).send(sendResponse(500, '', 'insertUserTask', null, req.data.signature))
	}

	if (!ifAllowedToAddTask.data.allowed) {
		return res.status(400).send(sendResponse(400, 'Not Allowed to add task for this project', 'insertUserTask', null, req.data.signature))
	}

	if (data.tasklead && data.tasklead.length && data.assignedTo) {
		let ifAllowedToAddAssisgnee = await checkLeadAndAssigneeForTask(data);
		if (ifAllowedToAddAssisgnee.error) {
			return res.status(500).send(sendResponse(500, '', 'insertUserTask', null, req.data.signature))
		}

		if (!ifAllowedToAddAssisgnee.data.allowed) {
			return res.status(400).send(sendResponse(400, 'Not Allowed to add task for selected lead/assignee', 'insertUserTask', null, req.data.signature))
		}
	}

	if (!data.defaultTaskTime) {
		return res.status(400).send(sendResponse(400, 'Please Provide Estimated time for this task', 'insertUserTask', null, req.data.signature))
	}

	let payload = {
		name: process.env.DEFAULT_SECTION,
		projectId: data.projectId
	}
	let sectionfind = await ProjectSections.findSection(payload)

	if (sectionfind._id == data.section) {
		data.ratingAllowed = false
		if (!data.miscType) {
			return res.status(400).send(sendResponse(400, 'MISC Type is required', 'insertUserTask', null, req.data.signature))
		}

	} else {
		if (data.miscType) {
			return res.status(400).send(sendResponse(400, 'No need to send MISC Type', 'insertUserTask', null, req.data.signature))
		}
	}

	let taskRes = await createPayloadAndInsertTask(data)

	if (taskRes.error || !taskRes.data) {
		return res.status(500).send(sendResponse(500, '', 'insertUserTask', null, req.data.signature))
	}

	let actionLogData = {
		actionTaken: 'TASK_ADDED',
		actionBy: data.auth.id,
		taskId: taskRes.data._id,
		new: { status: data.status }
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

		let findData = {
			_id: data.projectId
		}
		if (!["SUPER_ADMIN"].includes(data.auth.role)) {
			findData['$or'] = [
				{ accessibleBy: data.auth.id },
				{ managedBy: data.auth.id },
			]
			// return { data: { allowed: true }, error: false }
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

		if (JSON.stringify(data.dueDate)) {
			data.dueDate = (data.dueDate && new Date(data.dueDate)) || null
		}

		if (["CONTRIBUTOR"].includes(data.auth.role)) {
			data.assignedTo = data.auth.id
			data.dueDate = data.dueDate || new Date(new Date().setUTCHours(18, 29, 59, 999))
		};

		// let payload = {
		// 	title: data.title,
		// 	description: data.description,
		// 	status: data.status || process.env.TASK_STATUS.split(",")[0],
		// 	section: data.section,
		// 	projectId: data.projectId,
		// 	ratingAllowed: data.ratingAllowed,
		// 	createdBy: data?.auth?.id,    //TODO: Change after auth is updated
		// 	assignedTo: data.assignedTo,
		// 	// dueDate: data.dueDate || new Date(new Date().setUTCHours(23, 59, 59, 000)),
		// 	completedDate: data.completedDate,
		// 	defaultTaskTime: data.defaultTaskTime,
		// 	miscType: data.miscType,
		// 	priority: data.priority,
		// 	lead: data.tasklead
		// }

		let payload = data;
		payload["status"] = data.status || process.env.TASK_STATUS.split(",")[0]
		payload["createdBy"] = data?.auth?.id
		payload["lead"] = data.tasklead

		if (data.dueDate) {
			payload.dueDate = new Date(data.dueDate)
		}

		if (data.attachments) {
			payload["attachments"] = data.attachments
		}

		let taskRes = await Task.insertUserTask(payload)

		if (data.assignedTo && (data.auth.id != data.assignedTo)) {
			let findUser = { _id: data.assignedTo }
			let findAssignedBy = { _id: data.auth.id }
			let userData = await User.userfindOneQuery(findUser)
			let assignedBy = await User.userfindOneQuery(findAssignedBy)
			let getProject = await Project.findSpecificProject({ _id: data.projectId });
			data.projectName = (getProject && getProject.name) || null
			data.userName = (userData && userData.name) || null;
			data.assignedBy = assignedBy.name
			data.email = userData.email;
			data.taskLink = btoa(taskRes._id.toString())
			console.log("==========task link details", data.taskLink)
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

	if (data.dueDate && !validator.isISO8601(data.dueDate) && validator.isDate(data.dueDate)) {
		delete data.dueDate
	}
	let task = await getTaskDetails(data);
	if (task.error || !task.data) {
		return res.status(400).send(sendResponse(400, 'Task Not found..', 'editUserTask', null, req.data.signature))
	}

	if (!['SUPER_ADMIN'].includes(data.auth.role) && data.filteredProjects && !data.filteredProjects.includes(task.data.projectId.toString())) {
		return res.status(400).send(sendResponse(400, "You're not assigned this project", 'editUserTask', null, req.data.signature))
	}

	if (!['SUPER_ADMIN'].includes(data.auth.role) && task.data.status && task.data.status == process.env.TASK_STATUS.split(",")[2]) {
		return res.status(400).send(sendResponse(400, "Can't edit completed task", 'editUserTask', null, req.data.signature))
	}
	if (task.data.dueDate && data.status == 'COMPLETED') {
		if (new Date(task.data.dueDate).getTime() < new Date().getTime()) {
			data.isDelayTask = true
		}
	}

	data.taskDetails = task.data


	let ifAllowedToEditTask = await checkifAllowedToEditTask(data);

	if (ifAllowedToEditTask.error) {
		return res.status(500).send(sendResponse(500, '', 'createPayloadAndEditTask', null, req.data.signature))
	}

	if (!ifAllowedToEditTask.data.allowed) {
		return res.status(400).send(sendResponse(401, 'Not Allowed edit task', 'createPayloadAndEditTask', null, req.data.signature))
	}

	if (["CONTRIBUTOR", "INTERN"].includes(data.auth.role) && task.data.isVerified) {
		return res.status(400).send(sendResponse(400, 'You are not permitted to edit task once it is verified', 'verifyUserTask', null, req.data.signature))
	}

	if (data.tasklead && data.tasklead.length && data.assignedTo) {
		let ifAllowedToAddAssisgnee = await checkLeadAndAssigneeForTask(data);
		if (ifAllowedToAddAssisgnee.error) {
			return res.status(500).send(sendResponse(500, '', 'createPayloadAndEditTask', null, req.data.signature))
		}

		if (!ifAllowedToAddAssisgnee.data.allowed) {
			return res.status(400).send(sendResponse(401, 'Not Allowed to add task for selected lead/assignee', 'createPayloadAndEditTask', null, req.data.signature))
		}
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

	let payload = {
		name: process.env.DEFAULT_SECTION,
		projectId: data.projectId
	}

	let sectionfind = await ProjectSections.findSection(payload)

	console.log('section =====================================', sectionfind.id)

	if (data.section == sectionfind.id) {
		data.ratingAllowed = false
	} else {
		data.ratingAllowed = true
	}

	let taskRes = await createPayloadAndEditTask(data)
	if (taskRes.error) {
		return res.status(500).send(sendResponse(500, '', 'editUserTask', null, req.data.signature))
	}

	let actionTaken = 'TASK_UPDATED'
	let ifDueDateChanged = false

	if (taskRes && taskRes.data && data.status && data.status != taskRes.data.status) {
		actionTaken = 'TASK_STATUS_UPDATED'
	} else if (taskRes && taskRes.data && (data.dueDate && new Date(data.dueDate).getTime() != new Date(taskRes.data.dueDate).getTime()) || (!data.dueDate && JSON.stringify(data.dueDate) && taskRes.data.dueDate)) {

		actionTaken = 'TASK_DUEDATE_UPDATED'
		ifDueDateChanged = true

	}
	let actionLogData = {
		actionBy: data.auth.id,
		taskId: data.taskId,
	}
	let previousTaskData = {}
	let newTaskData = {}
	let taskUpdatePayload = data.taskUpdatePayload
	if (taskRes && taskRes.data && taskUpdatePayload) {
		if (taskUpdatePayload.title && taskUpdatePayload.title != task.data.title) {
			actionTaken = 'TASK_UPDATED'
			previousTaskData.title = task.data.title
			newTaskData.title = taskUpdatePayload.title
		}
		if (taskUpdatePayload.description && taskUpdatePayload.description != task.data.description) {
			actionTaken = 'TASK_UPDATED'
			previousTaskData.description = task.data.description
			newTaskData.description = taskUpdatePayload.description
		}
		if (taskUpdatePayload.section && taskUpdatePayload.section != task.data.section) {
			actionTaken = 'TASK_UPDATED'
			previousTaskData.section = task.data.section
			newTaskData.section = taskUpdatePayload.section
		}
		if (taskUpdatePayload.status && taskUpdatePayload.status != task.data.status) {
			previousTaskData.status = task.data.status
			newTaskData.status = taskUpdatePayload.status
		}
		if (ifDueDateChanged) {
			previousTaskData.dueDate = task.data.dueDate
			newTaskData.dueDate = taskUpdatePayload.dueDate
		}
		let currentDate = new Date()
		if (new Date(data.completedDate || currentDate).getTime() != new Date(taskRes.data.completedDate || currentDate).getTime()) {
			previousTaskData.completedDate = task.data.completedDate
			newTaskData.completedDate = taskUpdatePayload.completedDate
		}
		if (taskUpdatePayload.priority && taskUpdatePayload.priority != task.data.priority) {
			actionTaken = 'TASK_UPDATED'
			previousTaskData.priority = task.data.priority
			newTaskData.priority = taskUpdatePayload.priority
		}
		if (JSON.stringify(taskUpdatePayload.assignedTo) && ((taskUpdatePayload.assignedTo && taskUpdatePayload.assignedTo.toString()) || 'r') != ((task.data.assignedTo && task.data.assignedTo._id.toString()) || 'random')) {
			actionTaken = 'TASK_UPDATED'
			previousTaskData.assignedTo = task.data.assignedTo
			newTaskData.assignedTo = taskUpdatePayload.assignedTo
		}
	}


	if (taskRes && taskRes.data) {
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


const reopenUserTask = async (req, res, next) => {
	let data = req.data;

	if (!data.taskId) {
		return res.status(400).send(sendResponse(400, "", 'editUserTask', null, req.data.signature))
	}

	if (data.dueDate && !validator.isISO8601(data.dueDate) && validator.isDate(data.dueDate)) {
		console.log("Invalid date----------------------------------------------------------------", data.dueDate)
		delete data.dueDate
	}
	let task = await getTaskDetails(data);
	console.log(task)

	if (task.error || !task.data) {
		return res.status(400).send(sendResponse(400, 'Task Not found..', 'reopenUserTask', null, req.data.signature))
	}
	if (task.data.status != 'COMPLETED') {
		return res.status(400).send(sendResponse(400, 'Task is not Completed', 'reopenUserTask', null, req.data.signature))
	}

	if (!['SUPER_ADMIN'].includes(data.auth.role) && data.filteredProjects && !data.filteredProjects.includes(task.data.projectId.toString())) {
		return res.status(400).send(sendResponse(400, "You're not assigned this project", 'reopenUserTask', null, req.data.signature))
	}

	if (!['SUPER_ADMIN', 'ADMIN', 'LEAD'].includes(data.auth.role) && task.data.status && task.data.status == process.env.TASK_STATUS.split(",")[2]) {
		return res.status(400).send(sendResponse(400, "You're not allowed to perform this action.", 'reopenUserTask', null, req.data.signature))
	}

	let findPayload = {
		_id: data.taskId
	}
	let updatePayload = {
		isReOpen: true
	}
	let options = {
		new: true
	}

	let taskRes = await Task.findOneAndUpdate(findPayload, updatePayload, options)

	if (taskRes.error) {
		return res.status(500).send(sendResponse(500, '', 'editUserTask', null, req.data.signature))
	}

	taskRes.isReOpen = true
	let insertNewTask = await createPayloadAndInsertReOpenTask(taskRes)
	if (insertNewTask.error || !insertNewTask.data) {
		return res.status(500).send(sendResponse(500, '', 'insertUserTask', null, req.data.signature))
	}
	// console.log("insertNewTask================",insertNewTask)
	let actionLogData = {
		actionTaken: 'REOPEN_TASK',
		actionBy: data.auth.id,
		taskId: data.taskId,
		correspondingTaskId: insertNewTask.data._id,
	}

	if (data.reason) {
		reason = `REOPEN_TASK: ${data.reason}`
		actionLogData.reason = reason
	}
	data.actionLogData = actionLogData;
	let addActionLogRes = await actionLogController.addTaskLog(data);
	if (addActionLogRes.error) {
		return res.status(500).send(sendResponse(500, '', 'insertUserTask', null, req.data.signature))
	}


	return res.status(200).send(sendResponse(200, 'Task Reopened Successfully', 'editUserTask', insertNewTask, req.data.signature))
}
exports.reopenUserTask = reopenUserTask;


const createPayloadAndInsertReOpenTask = async function (taskRes) {
	try {
		let payload = {
			title: taskRes.title,
			description: taskRes.description,
			status: process.env.TASK_STATUS.split(",")[0],
			section: taskRes.section,
			projectId: taskRes.projectId,
			createdBy: taskRes.createdBy,    //TODO: Change after auth is updated
			assignedTo: taskRes.assignedTo,
			dueDate: taskRes.dueDate,
			defaultTaskTime: taskRes.defaultTaskTime,
			isReOpen: taskRes.isReOpen,
			priority: taskRes.priority,
			lead: taskRes.lead
		}

		if (taskRes.attachments) {
			payload["attachments"] = taskRes.attachments
		}

		let taskResend = await Task.insertUserTask(payload)

		return { data: taskResend, error: false }
	} catch (err) {
		console.log("createPayloadAndInsertTask Error : ", err)
		return { data: err, error: true }
	}
}
exports.createPayloadAndInsertTask = createPayloadAndInsertTask

const createPayloadAndEditTask = async function (data) {
	try {
		let findPayload = {
			_id: data.taskId
		}

		let updatePayload = {}
		if (JSON.stringify(data.title)) {
			updatePayload.title = data.title
		}

		if (JSON.stringify(data.description)) {
			updatePayload.description = data.description
		}

		if (JSON.stringify(data.section)) {
			updatePayload.section = data.section
			updatePayload.ratingAllowed = data.ratingAllowed
		}

		if (JSON.stringify(data.miscType)) {
			updatePayload.miscType = data.miscType
		}

		if (JSON.stringify(data.projectId)) {
			updatePayload.projectId = data.projectId
		}
		if (JSON.stringify(data.assignedTo)) {
			updatePayload.assignedTo = data.assignedTo
		}
		if (JSON.stringify(data.dueDate)) {
			data.dueDate = (data.dueDate && new Date(data.dueDate)) || null
			updatePayload.dueDate = data.dueDate
		}
		if (JSON.stringify(data.defaultTaskTime)) {
			updatePayload.defaultTaskTime = data.defaultTaskTime
		}
		if (JSON.stringify(data.priority)) {
			updatePayload.priority = data.priority
		}
		if (data.isDelayTask) {
			updatePayload["isDelayTask"] = data.isDelayTask
		}
		if (data.attachments) {
			updatePayload["attachments"] = data.attachments
		}
		if (data.tasklead) {
			updatePayload["lead"] = data.tasklead
		}
		if (data.defaultTaskTime) {
			updatePayload["defaultTaskTime"] = data.defaultTaskTime
		}
		data.taskUpdatePayload = updatePayload;
		let taskRes = await Task.findOneAndUpdate(findPayload, updatePayload, { new: false })
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

const exportDataToExcel = async (req, res, next) => {
	let data = req.data;

	let allowedTaskGroup = process.env.ALLOWED_GROUP_BY.split(',')

	if (!allowedTaskGroup.includes(data.groupBy)) {
		return res.status(400).send(sendResponse(400, `${data.groupBy} Group By Not Supported`, 'exportDataToExcel', null, req.data.signature))
	} else {
		data.aggregateGroupBy = `$${data.groupBy}`
	}

	data.aggregateGroupBy = CONSTANTS.GROUP_BY[data.groupBy]

	let taskRes = await createPayloadAndGetGroupByTask(data)
	let taskData = taskRes.data
	if (taskRes.error) {
		return res.status(500).send(sendResponse(500, '', 'exportDataToExcel', null, req.data.signature))
	}

	const workbook = new excelJS.Workbook();  // Create a new workbook
	const worksheet = workbook.addWorksheet("My Users"); // New Worksheet


	// Column for data in excel. key must match data key
	worksheet.columns = [
		{ header: "S no.", key: "s_no", width: 7 },
		{ header: "Project Name", key: "projectName", width: 20 },
		{ header: "Section Name", key: "section", width: 20 },
		{ header: 'Task Title', key: 'taskTitle', width: 20 },
		{ header: 'Task status', key: 'status', width: 20 },
		{ header: 'Task description', key: 'description', width: 25 },
		{ header: 'Task lead', key: 'lead', width: 20 },
		{ header: 'Task CreatedBy', key: 'createdBy', width: 20 },
		{ header: 'Task AssignedTo', key: 'assignedTo', width: 20 },
		{ header: 'Task DueDate', key: 'dueDate', width: 20 },
		{ header: 'Task Verified', key: 'isVerified', width: 12 },
		{ header: 'Task Estimated Time', key: 'defaultTaskTime', width: 20 },
		{ header: 'Task Completion Time', key: 'timeTaken', width: 20 },
		{ header: 'Task Completed Date', key: 'completedDate', width: 20 },
		{ header: 'Task Created On', key: 'createdAt', width: 20 },


	];

	// Looping through User data
	let counter = 1;
	taskData.forEach((task) => {

		let projectIdName = task._id.projectId;
		let section = task._id.section;

		task.projectName = projectIdName
		task.section = section

		task.tasks.forEach((tasks) => {

			task.s_no = counter;
			let taskTitle = tasks?.title;
			let description = tasks?.description;
			let status = tasks?.status;
			let lead = tasks.lead[0]?.name;
			let assignedTo = tasks?.assignedTo?.name
			let createdBy = tasks?.createdBy?.name
			let hoursAvailableThen = tasks?.defaultTaskTime?.hours || 0
			let minutesAvailableThen = tasks?.defaultTaskTime?.minutes || 0
			let defaultTaskTime = hoursAvailableThen + 'H' +" "+ minutesAvailableThen  + "Mins" 
			// time calculation for excel 
			const hours = Math.floor(tasks?.timeTaken / 60) || 0 ;
			const remainingMinutes = tasks?.timeTaken % 60  || 0 ;
			let timeTaken = hours + "H" + " " + remainingMinutes + "Mins"   

			let createdAt = tasks.createdAt;
			let dueDate = tasks?.dueDate;
			let completedDateOrNot = tasks?.completedDate || "Task Not Completed";
			let completedDate = completedDateOrNot;
			let isVerified = tasks?.isVerified;
			let isReOpen = tasks?.isReOpen;
			let rating = tasks?.rating;

			// console.log("desc-------",description)
			if (!description) {
				description = "Description Not Available"
				task.description = description
			} else {
				const $ = cheerio.load(tasks.description);
				const description = $('body').text();
				task.description = description
			}

			task.taskTitle = taskTitle
			task.lead = lead
			task.status = status
			task.createdBy = createdBy
			task.assignedTo = assignedTo
			task.dueDate = dueDate
			task.completedDate = completedDate
			task.defaultTaskTime = defaultTaskTime
			task.timeTaken = timeTaken
			task.isVerified = isVerified
			task.isReOpen = isReOpen
			task.rating = rating
			task.createdAt = createdAt

			worksheet.addRow(task, task.taskTitle, task.projectName, task.section, task.lead, task.status, task.assignedTo, task.dueDate, task.isVerified, task.rating, task.createdBy, task.createdAt,task.defaultTaskTime,task.completedDate,task.timeTaken);

			counter++;
		});
	});
	// Making first line in excel bold
	worksheet.getRow(1).eachCell((cell) => {
		cell.font = { bold: true };
	});
	try {

		workbook.xlsx.writeBuffer().then(buffer => {
			// Set the response headers for file download
			res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
			res.setHeader('Content-Disposition', 'attachment; filename="users.xlsx"');
			res.send(buffer);
		})
	} catch (err) {
		console.log(err)
		return res.status(500).send(sendResponse(500, 'error in file downloading', 'exportDataToExcel', err, req.data.signature))
	}
}

exports.exportDataToExcel = exportDataToExcel;


const createPayloadAndGetGroupByTask = async function (data) {
	try {
		let findData = { "isDeleted": false }
		let filter = {}
		let sortTaskOrder = { "_id.projectId": 1, "_id.section": 1, "tasks.dueDate": 1 }
		let taskOrder = { "tasks.dueDate": 1 }
		let allowedSortType = process.env.ALLOWED_SORT_BY.split(',')
		let filterAnd = []


		if (JSON.stringify(data.isArchived)) {
			findData["isArchived"] = JSON.parse(data.isArchived)
		} else {
			findData["isArchived"] = false
		}

		if (data.filteredProjects) {
			findData._id = { $in: data.filteredProjects.map((el) => mongoose.Types.ObjectId(el)) }
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
		if (data.leads) {
			let leads = JSON.parse(data.leads)
			filter["tasks.lead"] = { $in: leads.map(el => mongoose.Types.ObjectId(el)) }
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
		} else {
			filterAnd.push({
				$or: [
					{ section: { $exists: false } },
					{ "section.isArchived": false }
				]
			})
		}

		if (filterAnd.length) {
			filter["$and"] = filterAnd
		}

		let filterDate = {};
		if (data.fromDate) {
			filterDate["$gte"] = new Date(data.fromDate)
		}

		if (data.toDate) {
			filterDate["$lte"] = new Date(data.toDate)
		}

		if (data.fromDate || data.toDate) {
			filter["tasks.dueDate"] = filterDate;
		}

		data.sortType = (data.sortType && allowedSortType.includes(data.sortType)) ? data.sortType : 'default'
		if (data.sortType) {
			let sortOrder = data.sortOrder || 1
			sortOrder = parseInt(sortOrder)
			if (sortOrder && [1, -1].includes(sortOrder)) {
				sortOrder = parseInt(sortOrder)
			} else {
				sortOrder = 1
			}
			sortTaskOrder = sortOrder > 0 ? CONSTANTS.SORTBY_IN_INCREASING_ORDER[data.sortType] : CONSTANTS.SORTBY_IN_DECREASING_ORDER[data.sortType]
			taskOrder = sortOrder > 0 ? CONSTANTS.SORTBY_IN_INCREASING_ORDER['due-date'] : CONSTANTS.SORTBY_IN_DECREASING_ORDER['due-date']
		}

		if (!['SUPER_ADMIN', 'ADMIN'].includes(data.auth.role)) {
			let deletedUserIds = await userController.createPayloadAndgetDeletedUsers(data)
			deletedUserIds = deletedUserIds.data || []

			if (data.assignedTo) {
				let assignedTo = JSON.parse(data.assignedTo)

				filter["tasks.assignedTo"] = { $nin: deletedUserIds, $in: assignedTo.map(el => mongoose.Types.ObjectId(el)) }
			} else {
				filter["tasks.assignedTo"] = { $nin: deletedUserIds }
			}

			if (data.createdBy) {
				let createdBy = JSON.parse(data.createdBy)

				filter["tasks.createdBy"] = { $nin: deletedUserIds, $in: createdBy.map(el => mongoose.Types.ObjectId(el)) }
			} else {
				filter["tasks.createdBy"] = { $nin: deletedUserIds }
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
			{ $sort: taskOrder },
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
					projectId: 1,
					isArchived: 1,
					sectionId: 1,
					completedTasks: 1,
					ongoingTasks: 1,
					onHoldTasks: 1,
					noProgressTasks: 1
				}
			},
			{ $sort: sortTaskOrder }
		]



		let taskRes = await Project.projectAggregate(aggregate)

		let populate = []
		if (data.groupBy == 'default') {
			// populate.push({ path: '_id.projectId', model: 'projects', select: 'name' })
			populate.push({ path: 'tasks.createdBy', model: 'users', select: 'name' })
			populate.push({ path: 'tasks.assignedTo', model: 'users', select: 'name profilePicture' })
			populate.push({ path: 'tasks.lead', model: 'users', select: 'name profilePicture' })
			populate.push({ path: 'tasks.verificationComments', model: 'comments' })
		}
		if (data.groupBy == 'projectId') {
			// populate.push({ path: '_id', model: 'projects', select: 'name' })
			populate.push({ path: 'tasks.createdBy', model: 'users', select: 'name' })
			populate.push({ path: 'tasks.assignedTo', model: 'users', select: 'name profilePicture' })
			populate.push({ path: 'tasks.lead', model: 'users', select: 'name profilePicture' })
		}
		if (data.groupBy == 'createdBy') {
			populate.push({ path: '_id.createdBy', model: 'users', select: 'name' })
			populate.push({ path: 'tasks.projectId', model: 'projects', select: 'name' })
			populate.push({ path: 'tasks.assignedTo', model: 'users', select: 'name profilePicture' })
			populate.push({ path: 'tasks.lead', model: 'users', select: 'name profilePicture' })
		}
		if (data.groupBy == 'assignedTo') {
			populate.push({ path: '_id.assignedTo', model: 'users', select: 'name' })
			populate.push({ path: 'tasks.assignedTo', model: 'users', select: 'name profilePicture' })
			populate.push({ path: 'tasks.createdBy', model: 'users', select: 'name' })
			populate.push({ path: 'tasks.projectId', model: 'projects', select: 'name' })
			populate.push({ path: 'tasks.lead', model: 'users', select: 'name profilePicture' })
			populate.push({ path: 'tasks.verificationComments', model: 'comments' })

		}
		if (data.groupBy == 'status' || data.groupBy == 'sections') {
			populate.push({ path: 'tasks.projectId', model: 'projects', select: 'name' })
			populate.push({ path: 'tasks.createdBy', model: 'users', select: 'name' })
			populate.push({ path: 'tasks.assignedTo', model: 'users', select: 'name profilePicture' })
			populate.push({ path: 'tasks.lead', model: 'users', select: 'name profilePicture' })
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
			{ path: 'comments', model: 'comments', select: 'comment _id createdAt commentedBy' },
			{ path: 'verificationComments', model: 'comments', select: 'comment _id createdAt commentedBy' },
			{ path: 'createdBy', model: 'users', select: 'name _id' },
			{ path: 'assignedTo', model: 'users', select: 'name' },
			{ path: 'projectId', model: 'projects', select: 'name _id' },
			{ path: 'lead', model: 'users', select: 'name _id' },
			{ path: 'section', model: 'projectSections', select: 'name _id' }
		]
		let taskRes = await Task.taskFindOneQuery(findData, projection, populate)
		let commentPopulate = [
			{
				path: 'comments.commentedBy', model: 'users', select: 'name _id',
			},
			{
				path: 'verificationComments.commentedBy', model: 'users', select: 'name _id'
			}
		]
		let populatedRes = await Task.taskPopulate(taskRes, commentPopulate)
		if(populatedRes.status == 'ONGOING'){

			let timeTaken = populatedRes.timeTaken
	
			let payload = {
				taskId: data.taskId,
				new: { status: "ONGOING" }
			}
	
			let taskLogs = await getTaskLogs(payload, {}, '', { createdAt: -1 })	
			
			if (taskLogs.length) {
				let timetakenDate = new Date().getTime() - new Date(taskLogs[0].createdAt).getTime();
				const totalSeconds = Math.floor(timetakenDate / 1000);
				const totalMinutes = Math.floor(totalSeconds / 60);
				console.log("=====================================", totalMinutes);
				
				timeTaken += totalMinutes;
			}
			populatedRes.timeTaken = timeTaken 
		}

		
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
		let taskRes = await Task.taskFindQuery({ "isDeleted": false }, { status: 1, projectId: 1, _id: 0, dueDate: 1, completedDate: 1 })
		let sendData = {}
		for (let i = 0; i < taskRes.length; i++) {
			if (!sendData[taskRes[i].projectId]) {

				sendData[taskRes[i].projectId] = {
					COMPLETED: 0,
					ONGOING: 0,
					ONHOLD: 0,
					NOT_STARTED: 0,
					totalTask: 0,
					overDueTasks: 0
				}


			}
			sendData[taskRes[i].projectId][taskRes[i].status] += 1
			sendData[taskRes[i].projectId].totalTask += 1
			if (taskRes[i].completedDate && taskRes[i].dueDate && new Date(taskRes[i].dueDate) < new Date(taskRes[i].completedDate)) {
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
const verifyUserTask = async (req, res, next) => {

	let data = req.data;

	if (!data.taskId) {
		return res.status(400).send(sendResponse(400, "Please send all required Data fields", 'verifyUserTask', null, req.data.signature))
	}

	let task = await getTaskById(data);
	if (task.error || !task.data) {
		return res.status(500).send(sendResponse(500, 'Task Not found..', 'verifyUserTask', null, req.data.signature))
	}
	// if(task.data.ratingAllowed===false){
	// 	return res.status(400).send(sendResponse(400, 'Rating Not Allowed', 'verifyUserTask', null, req.data.signature))
	// }
	let currentDate = new Date();
	let taskDueDate = task.data.dueDate;
	if (!task.data.completedDate) {
		return res.status(400).send(sendResponse(400, 'Task is not completed', 'verifyUserTask', null, req.data.signature))
	}
	taskDueDate = new Date(taskDueDate);

	let timeDifference = ((currentDate.getTime() - taskDueDate.getTime()) || 1) / (1000 * 60 * 60)
	if (!task.isVerified && timeDifference > parseInt(process.env.ratingTimeAllowed)) {
		data.isDelayedVerified = true
		// return res.status(400).send(sendResponse(400, 'Oops, You are late in rating..', 'verifyUserTask', null, req.data.signature))
	}

	let taskDetails = task.data;
	if (taskDetails.status != process.env.TASK_STATUS.split(",")[2]) {
		return res.status(400).send(sendResponse(400, 'Task is not yet marked as completed', 'verifyUserTask', null, req.data.signature))
	}

	if (!taskDetails.dueDate) {
		return res.status(400).send(sendResponse(400, 'Task duedate is not present', 'verifyUserTask', null, req.data.signature))
	}

	if (!taskDetails.assignedTo) {
		return res.status(400).send(sendResponse(400, 'Task is not assigned to anyone', 'verifyUserTask', null, req.data.signature))
	}

	data.taskDetails = taskDetails;

	if (!["SUPER_ADMIN", "ADMIN"].includes(data.auth.role)) {

		console.log("Lead giving taks....", data.auth.role);

		let checkIfAllowedToRateTask = ((taskDetails.assignedTo.toString()) != data.auth.id.toString()) && taskDetails.lead.includes(data.auth.id) && data.filteredProjects.includes(taskDetails.projectId.toString());

		if (!checkIfAllowedToRateTask) {
			return res.status(400).send(sendResponse(400, 'Not allowed to rate task', 'verifyUserTask', null, req.data.signature))
		}
	}

	if (data.verificationsComments) {
		data.type = 'TASK_VERIFICATION'     //TASK_VERIFICATION
		let insertTaskCommentRes = await createPayloadAndInsertCommentForTasks(data);
		if (insertTaskCommentRes.error || !insertTaskCommentRes.data) {
			return res.status(500).send(sendResponse(500, 'Task comment could not be added..', 'verifyUserTask', null, req.data.signature))
		}
		data.commentId = insertTaskCommentRes.data._id;
	}

	if (!["SUPER_ADMIN", "ADMIN"].includes(data.auth.role)) {
		const updatedAt = new Date(task.data.updatedAt);
		const currentTime = new Date();
		const timeDifference = currentTime - updatedAt;
		const hoursDifference = timeDifference / (1000 * 60 * 60);

		if (hoursDifference > 48) {
			data.isDelayedVerified = true
		}
	}
	let updateTaskRating = await updateTaskDetailsForVerification(data);

	if (updateTaskRating.error || !updateTaskRating.data) {
		return res.status(500).send(sendResponse(500, '', 'verifyUserTask', null, req.data.signature))
	}


	let actionLogData = {
		actionTaken: 'VERIFY_TASK',
		actionBy: data.auth.id,
		userId: taskDetails.assignedTo,
		taskId: data.taskId
	}
	data.actionLogData = actionLogData;
	let addActionLogRes = await actionLogController.addRatingLog(data);
	if (addActionLogRes.error) {
		return res.status(500).send(sendResponse(500, '', 'insertUserTask', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, 'Task Rated', 'verifyUserTask', null, req.data.signature));
}
exports.verifyUserTask = verifyUserTask;

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

const createPayloadAndInsertCommentForTasks = async function (data) {
	try {
		let payload = {
			commentedBy: data.auth.id,
			taggedUsers: data.taggedUsers,
			comment: data.comment || data.verificationsComments,
			type: data.type
		}
		console.log("=======payload for comment=====", payload)
		let commentRes = await Comments.insertComment(payload)
		return { data: commentRes, error: false }
	} catch (err) {
		console.log("createPayloadAndInsertComment Error : ", err)
		return { data: err, error: true }
	}
}

const updateTaskDetailsForVerification = async function (data) {
	try {

		let findData = {
			_id: data.taskId,
			// ratingAllowed:true
		}
		let updateData = {
			isVerified: true,
			verifiedBy: data.auth.id,
			$addToSet: { verificationComments: data.commentId }
		}
		if (data.isDelayedVerified) {
			updateData.isDelayedVerified = data.isDelayedVerified
		}
		let options = {
			new: true
		}
		let verifiedTask = await Task.findOneAndUpdate(findData, updateData, options);
		return { data: verifiedTask, error: false }

	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

const getAllTasksWithSameDueDate = async function (data) {
	try {

		let findData = {
			assignedTo: data.taskDetails.assignedTo,
			dueDate: data.taskDetails.dueDate,
			ratingAllowed: true
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
			dueDate: dueDate
		}

		let allRatedTasks = data.allTasksWithSameDueDate.filter(task => task.isVerified);
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
		return res.status(400).send(sendResponse(400, "Please send all required Data fields", 'getTasksByProjectId', null, req.data.signature))
	}

	let projectTasks = await getProjectSpecificTasks(data);
	if (projectTasks.error) {
		return res.status(500).send(sendResponse(500, 'Project Not found..', 'getTasksByProjectId', null, req.data.signature))
	}

	return res.status(200).send(sendResponse(200, 'Task fetched', 'getTasksByProjectId', projectTasks.data, req.data.signature));
}
exports.getTasksByProjectId = getTasksByProjectId;

const getProjectSpecificTasks = async function (data) {

	try {
		let findData = {
			projectId: data.projectId,
			isDeleted: false
		}
		let populate = "lead createdBy assignedTo verificationComments comments"
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
	let tasksLists = await createPayloadAndGetPendingRatingTasks(data);
	if (tasksLists.error) {
		return res.status(500).send(sendResponse(500, '', 'getTaskListForHomePage', null, req.data.signature))
	}

	return res.status(200).send(sendResponse(200, 'Task List', 'getTaskListForHomePage', tasksLists.data, req.data.signature));
}
exports.getTaskListWithPendingRating = getTaskListWithPendingRating;

//Get task lists for homepage - Set according to role
const getTaskListToVerify = async function (req, res, next) {

	let data = req.data;

	if (!data.projectId || !data.userId || (!data.dueDate && (!data.fromDate || !data.toDate))) {
		return res.status(400).send(sendResponse(400, 'Missing Params', 'getTaskListToVerify', null, req.data.signature))
	}
	data.isVerified = false;
	data.ratingAllowed = true;

	data.status = 'COMPLETED'
	let tasksLists = await createPayloadAndGetTaskLists(data);
	if (tasksLists.error) {
		return res.status(500).send(sendResponse(500, '', 'getTaskListToVerify', null, req.data.signature))
	}

	return res.status(200).send(sendResponse(200, 'Task List', 'getTaskListToVerify', tasksLists.data, req.data.signature));
}
exports.getTaskListToVerify = getTaskListToVerify;

const createPayloadAndGetTaskLists = async function (data) {
	try {

		let findData = {
			isDeleted: false,
			isArchived: false,
		};

		let sortCriteria = {

		}
		let dateFilters = []
		if (data.status) {
			findData.status = data.status
		}

		//filter tasks of only those project which are assigned to LEAD, CONTRIBUTOR, INTERN
		if (!['SUPER_ADMIN'].includes(data.auth.role)) {
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

		if (JSON.stringify(data.isVerified)) {
			findData.isVerified = data.isVerified
		}

		if (data.dueDate) {
			dateFilters.push({ dueDate: new Date(data.dueDate) })
		}

		if (data.fromDate) {
			dateFilters.push({ dueDate: { $gte: new Date(data.fromDate) } })
		}
		if (data.toDate) {
			dateFilters.push({ dueDate: { $lte: new Date(data.toDate) } })
		}

		if (JSON.stringify(data.pendingVerificationTasks)) {
			findData.status = "COMPLETED";
			findData.isVerified = false
		}
		if (JSON.stringify(data.homePageTaskList)) {
			sortCriteria.dueDate = 1
			findData.status = { $ne: "COMPLETED" };
			findData.assignedTo = data.auth.id
			let currentDate = (data.currentDate && new Date(data.currentDate)) || new Date(new Date().setUTCHours(18, 29, 59, 999))
			dateFilters.push({ dueDate: { $lte: currentDate } })
		}
		let populate = 'lead assignedTo'

		if (JSON.stringify(data.pendingVerificationTasks) || !['SUPER_ADMIN', 'ADMIN'].includes(data.auth.role)) {
			let deletedUserData = await userController.createPayloadAndgetDeletedUsers(data)
			if (deletedUserData.data) {
				let deletedUserIds = deletedUserData.data || []
				if (findData.assignedTo) {
					let assignedTo = { $nin: deletedUserIds, $eq: findData.assignedTo }
					findData.assignedTo = assignedTo
				} else {
					findData.assignedTo = { $nin: deletedUserIds }
				}
				findData.createdBy = { $nin: deletedUserIds }
			}
		}

		if (dateFilters.length) {
			findData['$and'] = dateFilters
		}
		let taskList = await Task.taskFindQuery(findData, {}, populate, sortCriteria);
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

	let fetchTaskById = await getTaskDetails(data);
	if (fetchTaskById.error) {
		return res.status(500).send(sendResponse(500, '', 'deleteTask', null, req.data.signature))
	}

	if (!fetchTaskById.data) {
		return res.status(400).send(sendResponse(400, 'No Task Found', 'deleteTask', null, req.data.signature))
	}

	if (!['SUPER_ADMIN'].includes(data.auth.role) && (fetchTaskById.data.status == process.env.TASK_STATUS.split(",")[2] || fetchTaskById.data.isVerified)) {
		return res.status(400).send(sendResponse(400, "Can't deleted completed/rated task", 'deleteTask', null, req.data.signature))
	}

	data.taskDetails = fetchTaskById.data
	// if (fetchTaskById.data?.isVerified) {
	// 	return res.status(400).send(sendResponse(400, 'Task Already Rated', 'deleteTask', null, req.data.signature))
	// }

	console.log("==========task delete check")
	if (!['SUPER_ADMIN'].includes(data.auth.role)) {
		console.log("==========task delete check for non superadmin, project assinged", data.filteredProjects)
		if (fetchTaskById.data.projectId && !data.filteredProjects.includes(fetchTaskById.data.projectId.toString())) {
			return res.status(400).send(sendResponse(400, 'The Project of this task is no longer assigned to you', 'deleteTask', null, req.data.signature))

			// if (["CONTRIBUTOR", "INTERN"].includes(data.auth.role) && (data.auth.id.toString() != fetchTaskById.data.createdBy.toString())) {
			// 	return res.status(400).send(sendResponse(400, 'You are not allowed to delete tasks created by others', 'deleteTask', null, req.data.signature))
			// }
		} else {
			console.log("=============project assigned==========")

			let ifAllowedToDeleteTask = await checkifAllowedToDeleteTask(data);

			if (ifAllowedToDeleteTask.error) {
				return res.status(500).send(sendResponse(500, '', 'deleteTask', null, req.data.signature))
			}

			if (!ifAllowedToDeleteTask.data.allowed) {
				return res.status(400).send(sendResponse(401, 'Not Allowed to delete task', 'deleteTask', null, req.data.signature))
			}
		}

	} else {
		console.log("==========task delete by superadmin")
	}


	let taskRes = await createPayloadAndDeleteTask(data)
	if (taskRes.error) {
		return res.status(500).send(sendResponse(500, '', 'deleteTask', null, req.data.signature))
	}

	let actionLogData = {
		actionTaken: 'TASK_DELETED',
		actionBy: data.auth.id,
		taskId: data.taskId
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

	let fetchTaskById = await getTaskDetails(data);
	if (fetchTaskById.error) {
		return res.status(500).send(sendResponse(500, '', 'updateTaskStatus', null, req.data.signature))
	}

	if (!fetchTaskById.data) {
		return res.status(400).send(sendResponse(400, 'No Task Found', 'updateTaskStatus', null, req.data.signature))
	}
	if (!fetchTaskById.data.assignedTo) {
		return res.status(400).send(sendResponse(400, "Can't change status, task not assigned", 'updateTaskStatus', null, req.data.signature))
	}

	data.taskDetails = fetchTaskById.data;

	let ifAllowedToUpdateTaskStatus = await checkifAllowedToUpdateTaskStatus(data);

	if (ifAllowedToUpdateTaskStatus.error) {
		return res.status(500).send(sendResponse(500, '', 'updateTaskStatus', null, req.data.signature))
	}

	if (!ifAllowedToUpdateTaskStatus.data.allowed) {
		return res.status(400).send(sendResponse(400, 'Not Allowed update task status', 'updateTaskStatus', null, req.data.signature))
	}

	if (fetchTaskById.data.status != 'ONGOING' && data.status == 'COMPLETED') {
		return res.status(400).send(sendResponse(400, "Change the status to ONGOING Before Completing Task", 'updateTaskStatus', null, req.data.signature))
	}

	if (!fetchTaskById.data.dueDate && data.status == 'COMPLETED') {
		return res.status(400).send(sendResponse(400, "Can't complete task without dueDate", 'updateTaskStatus', null, req.data.signature))
	}

	if (fetchTaskById.data.dueDate && data.status == 'COMPLETED') {
		if (new Date(fetchTaskById.data.dueDate).getTime() < new Date().getTime()) {
			data.isDelayTask = true
		}
	}

	// Task Completion time calculator
	if (['ONHOLD', 'COMPLETED'].includes(data.status)) {
		let payload = {
			taskId: data.taskId,
			// $or: [{ actionTaken: "TASK_ADDED" }, { actionTaken: "TASK_STATUS_UPDATED" }],
			new: { status: "ONGOING" }
		}

		let previousTask = await getTaskLogs(payload, {}, '', { createdAt: -1 })
		console.log("Previous Tasks.......", previousTask)
		data.timeTaken = 0
		if (previousTask.length) {
			let timetakenDate = new Date().getTime() - new Date(previousTask[0].createdAt).getTime();
			const totalSeconds = Math.floor(timetakenDate / 1000);
			const totalMinutes = Math.floor(totalSeconds / 60);
			console.log("=====================================", totalMinutes);
			
			data.timeTaken += totalMinutes;
			if (fetchTaskById.data.timeTaken) {
				data.timeTaken += fetchTaskById.data.timeTaken;
			}

		}

	}



	if (fetchTaskById.data?.isVerified) {
		return res.status(400).send(sendResponse(400, 'Task Already Verified', 'updateTaskStatus', null, req.data.signature))
	}

	// if (!['SUPER_ADMIN', "ADMIN"].includes(data.auth.role)) {
	// 	if (fetchTaskById.data.projectId && !data.filteredProjects.includes(fetchTaskById.data.projectId.toString())) {
	// 		return res.status(400).send(sendResponse(400, 'The Project of this task is no longer assigned to you', 'updateTaskStatus', null, req.data.signature))
	// 	}
	// 	if (["CONTRIBUTOR", "INTERN"].includes(data.auth.role) && (fetchTaskById.data.assignedTo && data.auth.id.toString() != fetchTaskById.data.assignedTo.toString())) {
	// 		return res.status(400).send(sendResponse(400, 'You are not allowed to update tasks status', 'updateTaskStatus', null, req.data.signature))
	// 	}
	// }
	if (fetchTaskById.data.ratingAllowed == false && data.status == 'COMPLETED') {
		data.isVerified = true
	}

	let taskRes = await createPayloadAndUpdateTaskStatus(data)
	// console.log(taskRes)
	if (taskRes.error || !taskRes.data) {
		return res.status(500).send(sendResponse(500, '', 'updateTaskStatus', null, req.data.signature))
	}

	if (data.status && data.status != taskRes.data.status) {
		let actionLogData = {
			actionTaken: 'TASK_STATUS_UPDATED',
			actionBy: data.auth.id,
			taskId: data.taskId,
			previous: { status: taskRes && taskRes.data.status },
			new: { status: data.status }
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
			_id: data.taskId,
		}
		let updatePayload = {
			$set: {
				status: data.status
			}
		}

		if (['ONHOLD', 'COMPLETED'].includes(data.status)) {
			updatePayload['$set'] = {
				status: data.status,
				completedDate: new Date(),
				isDelayTask: data.isDelayTask || false,
				timeTaken: data.timeTaken
			}
		}
		
		if (data.isVerified) {
			updatePayload.isVerified = data.isVerified
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
		let insertTaskCommentRes = await createPayloadAndInsertCommentForTasks(data);
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
		taskId: data.taskId,
		commentId: data.commentId
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
const updateTaskVerificationAndAddComment = async function (data) {
	try {

		let findData = {
			_id: data.taskId
		}
		let updateData = {
			status: data.status,
			$addToSet: { verificationComments: data.verificationsComments }
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
			_id: { $in: data.tasklead || [] },
			role: { $nin: ['ADMIN'] }
		}
		let userRes = await User.getDistinct("_id", findAdmins)
		let findData = {
			_id: data.projectId
		}

		if (userRes && userRes.length) {
			data.findDeletedUsers = { _id: { $in: userRes }, isDeleted: true }
			let deletedUserData = await userController.createPayloadAndgetDeletedUsers(data)
			let deletedUserIds = deletedUserData.data || []
			findData.managedBy = { $in: userRes, $nin: deletedUserIds }
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
			userId: data.userId,
			isDeleted: false
		};

		//filter tasks of only those project which are assigned to LEAD, CONTRIBUTOR, INTERN
		if (!['SUPER_ADMIN', "ADMIN"].includes(data.auth.role)) {
			findData.projectId = { $in: data.filteredProjects }
		}

		if (data.projectId) {
			findData.projectId = data.projectId
		}

		if (data.dueDate) {
			findData.dueDate = new Date(new Date().setUTCHours(18, 29, 59, 000))
		}

		let populate = 'comments verificationComments'
		let taskList = await Task.taskFindQuery(findData, {}, populate);
		return { data: taskList, error: false }

	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

//Get task lists for homepage - Set according to role
const getTodayUsersListByProject = async function (req, res, next) {

	let data = req.data;
	if (!['SUPER_ADMIN', 'ADMIN'].includes(data.auth.role)) {
		return res.status(400).send(sendResponse(401, 'You are Not Allowed', 'getTodayUsersListByProject', null, req.data.signature))
	}
	let tasksLists = await createPayloadAndGetTodayTaskListsByProjectId(data)
	if (tasksLists.error) {
		return res.status(500).send(sendResponse(500, '', 'getTaskListForHomePage', null, req.data.signature))
	}

	return res.status(200).send(sendResponse(200, 'Task List', 'getTaskListForHomePage', tasksLists.data, req.data.signature))
}
exports.getTodayUsersListByProject = getTodayUsersListByProject;

const createPayloadAndGetTodayTaskListsByProjectId = async function (data) {
	try {
		let dateFilter = {}
		const fromDate = new Date(new Date().setUTCHours(0, 0, 0, 0))
		console.log("fromDate", fromDate)
		data.fromDate = fromDate
		dateFilter["$gte"] = new Date(data.fromDate)

		const toDate = new Date(new Date().setUTCHours(23, 59, 59, 999))
		data.toDate = toDate
		dateFilter["$lte"] = new Date(data.toDate)
		console.log("toDate", data.toDate)

		let findData = {
			isDeleted: false,
			isArchived: false,
		}

		if (data.fromDate || data.toDate) {
			findData.createdAt = dateFilter
		}

		let pipeline = [
			{
				$match: findData,
			},
			{
				$group: {
					_id: "$projectId",
					tasks: { $push: "$$ROOT" },
				},
			},
			{
				$lookup: {
					from: "users",
					localField: "tasks.assignedTo",
					foreignField: "_id",
					as: "assignedTo",
				},
			},
			{
				$lookup: {
					from: "projects",
					localField: "_id",
					foreignField: "_id",
					as: "project",
				},
			},
			{
				$unwind: "$project",
			},
			{
				$unwind: "$assignedTo",
			},
			{
				$group: {
					_id: "$project._id",
					projectName: { $first: "$project.name" },
					users: { $addToSet: "$assignedTo.name" },
				},
			},
		]

		let taskList = await Task.taskAggregate(pipeline)
		console.log("taskList ===", taskList)
		return { data: taskList, error: false }
	} catch (err) {
		console.log("Error => ", err)
		return { data: err, error: true }
	}
};

//Get task lists for homepage - Set according to role
const getAllUnassignedUsersList = async function (req, res, next) {

	let data = req.data;
	if (!['SUPER_ADMIN', 'ADMIN'].includes(data.auth.role)) {
		return res.status(400).send(sendResponse(401, 'You are Not Allowed', 'getTodayUsersListByProject', null, req.data.signature))
	}
	let tasksLists = await createPayloadAndGetAllUnassignedUsers(data);
	if (tasksLists.error) {
		return res.status(500).send(sendResponse(500, '', 'getTaskListForHomePage', null, req.data.signature))
	}

	return res.status(200).send(sendResponse(200, 'Task List', 'getTaskListForHomePage', tasksLists.data, req.data.signature));
}
exports.getAllUnassignedUsersList = getAllUnassignedUsersList;

const createPayloadAndGetAllUnassignedUsers = async function (data) {
	try {
		let dateFilter = {};
		const fromDate = new Date(new Date().setUTCHours(0, 0, 0, 000))
		console.log("fromDate", fromDate)
		data.fromDate = fromDate;
		dateFilter['$gte'] = new Date(data.fromDate)

		const toDate = new Date(new Date().setUTCHours(23, 59, 59, 999))
		data.toDate = toDate;
		dateFilter['$lte'] = new Date(data.toDate)
		console.log("toDate", data.toDate)


		let findData = {
			isDeleted: false,
			isArchived: false,
			assignedTo: { $exists: true }
		};

		if (data.fromDate || data.toDate) {
			findData.createdAt = dateFilter
		}

		let projection = {
			assignedTo: 1
		}

		let populate = {
			path: "assignedTo",
			select: "name",
			model: "users"
		}
		let sortCriteria = { createdAt: 1 }
		let taskList = await Task.taskFindQuery(findData, projection, populate, sortCriteria);

		let TaskUserIds = taskList.map(task => task.assignedTo);
		let ExtractTaskUserIds = TaskUserIds.map(user => user?._id);

		// console.log(ExtractTaskUserIds)

		data.excludeUsers = ExtractTaskUserIds;
		let ExcludedUsersList = await userController.findAllUserNonPagination(data)
		let usersLists = ExcludedUsersList.data.users
		// console.log("============",usersLists)
		return { data: usersLists, error: false }

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

		let dateFilter = {};
		if (data.fromDate) {
			dateFilter['$gte'] = new Date(data.fromDate)
		}
		if (data.toDate) {
			dateFilter['$lte'] = new Date(data.toDate)
		}

		let findData = {
			isDeleted: false,
			isArchived: false,
		};

		if (data.fromDate || data.toDate) {
			findData.dueDate = dateFilter
		}

		if (!['SUPER_ADMIN'].includes(data.auth.role)) {
			findData.projectId = { $in: data.filteredProjects || [] }
		}
		if (!['SUPER_ADMIN', 'ADMIN', "GUEST"].includes(data.auth.role)) {
			findData["$or"] = [
				{ createdBy: data.auth.id },
				{ assignedTo: data.auth.id },
				{ lead: data.auth.id }
			]
			let deletedUserData = await userController.createPayloadAndgetDeletedUsers(data)
			if (deletedUserData.data) {
				let deletedUserIds = deletedUserData.data || []
				findData.assignedTo = { $nin: deletedUserIds }
				findData.createdBy = { $nin: deletedUserIds }
			}
		}


		let populate = 'assignedTo'

		let sortCriteria = { dueDate: 1 }
		let taskList = await Task.taskFindQuery(findData, {}, populate, sortCriteria);
		return { data: taskList, error: false }

	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}


const getTodayTasksListByUserId = async function (req, res, next) {

	let data = req.data;

	let tasksLists = await createPayloadAndGetTodayTaskListsByUserId(data);
	if (tasksLists.error) {
		return res.status(500).send(sendResponse(500, '', 'getTodayTasksListByUserId', null, req.data.signature))
	}

	return res.status(200).send(sendResponse(200, 'Task List', 'getTodayTasksListByUserId', tasksLists.data, req.data.signature));
}
exports.getTodayTasksListByUserId = getTodayTasksListByUserId;

const createPayloadAndGetTodayTaskListsByUserId = async function (data) {
	try {

		let dateFilter = {};
		if (data.fromDate) {
			dateFilter['$gte'] = new Date(data.fromDate)
		}
		if (data.toDate) {
			dateFilter['$lte'] = new Date(data.toDate)
		}

		let findData = {
			assignedTo: data.userId,
			isDeleted: false,
			isArchived: false,
		};

		if (data.fromDate || data.toDate) {
			findData.createdAt = dateFilter
		}

		let populate = 'assignedTo verificationComments'

		let sortCriteria = { createdAt: 1 }

		let taskList = await Task.taskFindQuery(findData, {}, populate, sortCriteria);
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
			isArchived: false,
			status: { $nin: ['ONHOLD', 'COMPLETED'] }, dueDate: { $lte: new Date(new Date().toUTCString()) }
		};

		if (data.assignedTo) {
			findData.assignedTo = data.assignedTo
		}

		if (!['SUPER_ADMIN'].includes(data.auth.role) && data.filteredProjects) {
			findData.projectId = { $in: data.filteredProjects }
		}

		let populate = 'lead assignedTo'
		let sortCriteria = { dueDate: 1 }
		let taskList = await Task.taskFindQuery(findData, {}, populate, sortCriteria);
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
			ratingAllowed: true,
			isArchived: false,
			status: "COMPLETED",
			isVerified: false
		};

		if (data.memberId) {
			findData.assignedTo = data.memberId
		}
		//filter tasks of only those project which are assigned to LEAD, CONTRIBUTOR, INTERN
		if (!['SUPER_ADMIN'].includes(data.auth.role)) {
			findData.projectId = { $in: data.filteredProjects }
		}

		if (["CONTRIBUTOR", "INTERN"].includes(data.auth.role)) {

			findData["$or"] = [
				{ createdBy: data.auth.id },
				{ assignedTo: data.auth.id }
			]
		}
		if (data.auth.role == 'LEAD') {
			findData.lead = data.auth.id
		}


		let populate = 'lead assignedTo'

		if (!['SUPER_ADMIN', 'ADMIN'].includes(data.auth.role)) {
			let deletedUserData = await userController.createPayloadAndgetDeletedUsers(data)
			if (deletedUserData.data) {
				let deletedUserIds = deletedUserData.data || []
				findData.assignedTo = { $nin: deletedUserIds }
				findData.createdBy = { $nin: deletedUserIds }
			}
		}

		let sortCriteria = { dueDate: 1 }
		let taskList = await Task.taskFindQuery(findData, {}, populate, sortCriteria);
		return { data: taskList, error: false }

	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

const checkLeadAndAssigneeForTask = async function (data) {

	try {

		let findLead = {
			_id: { $in: data.tasklead || [] }
		}
		let leadRes = await User.userfindOneQuery(findLead)
		if (!leadRes) {
			return { data: { allowed: false }, error: false }
		}
		let selectedLeadRole = leadRes.role

		let findAssignee = {
			_id: { $in: [data.assignedTo] }
		}
		let assigneeRes = await User.userfindOneQuery(findAssignee)
		if (!assigneeRes) {
			return { data: { allowed: false }, error: false }
		}
		let selectedAssigneeRole = assigneeRes.role

		let selectedLeadRolePriority = utilities.fetchRolePriority(selectedLeadRole)
		if (selectedLeadRolePriority.error || !selectedLeadRolePriority.data) {
			return { data: { allowed: false }, error: false }
		}
		selectedLeadRolePriority = parseInt(selectedLeadRolePriority.data)

		let selectedAssigneeRolePriority = utilities.fetchRolePriority(selectedAssigneeRole)
		if (selectedAssigneeRolePriority.error || !selectedAssigneeRolePriority.data) {
			return { data: { allowed: false }, error: false }
		}
		selectedAssigneeRolePriority = parseInt(selectedAssigneeRolePriority.data)

		let authRolePriority = utilities.fetchRolePriority(data.auth.role)
		if (authRolePriority.error || !authRolePriority.data) {
			return { data: { allowed: false }, error: false }
		}
		authRolePriority = parseInt(authRolePriority.data)

		console.log("============selected lead/asigned/auth=======", selectedLeadRolePriority, selectedAssigneeRolePriority, authRolePriority)

		if (authRolePriority < selectedAssigneeRolePriority || selectedLeadRolePriority < selectedAssigneeRolePriority || leadRes._id.toString() == assigneeRes._id.toString()) {
			return { data: { allowed: false }, error: false }
		}

		return { data: { allowed: true }, error: false }


	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

const getTaskDetails = async function (data) {
	try {

		let findData = {
			_id: data.taskId,
			isDeleted: false
		}

		let populate = 'createdBy assignedTo'
		let taskDetails = await Task.taskFindOneQuery(findData, {}, populate);
		return { data: taskDetails, error: false }
	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

const checkifAllowedToEditTask = async function (data) {

	try {

		let taskDetails = data.taskDetails
		let taskCreatedByRole = (taskDetails.createdBy && taskDetails.createdBy.role) || null
		if (!taskCreatedByRole) {
			return { data: { allowed: false }, error: false }
		}

		let taskCreatedRolePriority = utilities.fetchRolePriority(taskCreatedByRole)
		if (taskCreatedRolePriority.error || !taskCreatedRolePriority.data) {
			return { data: { allowed: false }, error: false }
		}
		taskCreatedRolePriority = parseInt(taskCreatedRolePriority.data)

		let authRolePriority = utilities.fetchRolePriority(data.auth.role)
		if (authRolePriority.error || !authRolePriority.data) {
			return { data: { allowed: false }, error: false }
		}
		authRolePriority = parseInt(authRolePriority.data)

		console.log("============created/auth=======", taskCreatedRolePriority, authRolePriority)
		console.log("============1234567auth=======", data.auth.role)


		if (authRolePriority < taskCreatedRolePriority) {
			return { data: { allowed: false }, error: false }
		}

		return { data: { allowed: true }, error: false }


	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

const checkifAllowedToUpdateTaskStatus = async function (data) {

	try {

		if (['SUPER_ADMIN'].includes(data.auth.role)) {
			return { data: { allowed: true }, error: false }
		}

		let findTask = {
			_id: data.taskId, isDeleted: false, isArchived: false, $or: [
				{ createdBy: data.auth.id },
				{ assignedTo: data.auth.id },
				{ lead: data.auth.id }
			]
		}

		let taskDetails = await Task.taskFindOneQuery(findTask, {}, '');

		if (!taskDetails) {
			return { data: { allowed: false, message: "You're not part of this task to update status" }, error: false }
		}

		let taskAssigneeRole = (data.taskDetails && data.taskDetails.assignedTo && data.taskDetails.assignedTo.role) || null
		if (!taskAssigneeRole) {
			return { data: { allowed: false }, error: false }
		}

		let taskAssigneeRolePriority = utilities.fetchRolePriority(taskAssigneeRole)
		if (taskAssigneeRolePriority.error || !taskAssigneeRolePriority.data) {
			return { data: { allowed: false }, error: false }
		}
		taskAssigneeRolePriority = parseInt(taskAssigneeRolePriority.data)

		let authRolePriority = utilities.fetchRolePriority(data.auth.role)
		if (authRolePriority.error || !authRolePriority.data) {
			return { data: { allowed: false }, error: false }
		}
		authRolePriority = parseInt(authRolePriority.data)

		console.log("============created/auth=======", taskAssigneeRolePriority, authRolePriority)

		if (authRolePriority < taskAssigneeRolePriority) {
			return { data: { allowed: false }, error: false }
		}

		return { data: { allowed: true }, error: false }


	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

const checkifAllowedToDeleteTask = async function (data) {

	try {

		if (['SUPER_ADMIN'].includes(data.auth.role)) {
			return { data: { allowed: true }, error: false }
		}

		let authRolePriority = utilities.fetchRolePriority(data.auth.role)
		if (authRolePriority.error || !authRolePriority.data) {
			return { data: { allowed: false }, error: false }
		}
		authRolePriority = parseInt(authRolePriority.data)

		console.log("============authRolePriority=========", authRolePriority)


		let taskData = data.taskDetails
		let createdBy = (taskData.createdBy && taskData.createdBy._id) || null
		let creatorRole = (taskData.createdBy && taskData.createdBy.role) || null

		let taskCreatorRolePriority = utilities.fetchRolePriority(creatorRole)
		if (taskCreatorRolePriority.error || !taskCreatorRolePriority.data) {
			return { data: { allowed: false }, error: false }
		}
		taskCreatorRolePriority = parseInt(taskCreatorRolePriority.data)
		console.log("============creator id/role=========", createdBy, creatorRole, taskCreatorRolePriority)


		let findTask = {
			_id: data.taskId, isDeleted: false, isArchived: false, $or: [
				{ createdBy: data.auth.id },
				{ assignedTo: data.auth.id },
				{ lead: data.auth.id }
			]
		}

		let taskAssignedDetail = await Task.taskFindOneQuery(findTask, {}, '');
		//check delete authority
		if (createdBy.toString() != data.auth.id.toString()) {

			console.log("==========creator and editor not same")
			if (authRolePriority > taskCreatorRolePriority) {

				return { data: { allowed: true }, error: false }
			} else {
				return { data: { allowed: false }, error: false }
			}
		}

		return { data: { allowed: true }, error: false }


	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

//Get task lists for homepage - Set according to role
const getTeamTasksList = async function (req, res, next) {

	let data = req.data;

	if (!data.userId) {
		return res.status(400).send(sendResponse(400, `User required`, 'getTaskDetailsByTaskId', null, req.data.signature))
	}
	data.assignedTo = data.userId

	let tasksLists = null;
	if (data.todayTasks) {
		tasksLists = await createPayloadAndGetTeamTasksList(data);
	} else if (data.overDueTasks) {
		tasksLists = await createPayloadAndGetOverDueTasks(data);
	} else if (data.pendingRatingTasks) {
		tasksLists = await createPayloadAndGetTeamPendingRatingTasks(data);
	} else if (data.isDelayedVerified) {
		tasksLists = await createPayloadAndGetTeamLateVerifiedTasksList(data);
	} else if (data.adhocTasks) {
		tasksLists = await createPayloadAndGetTeamAdhocTasksList(data);
	}

	// if (tasksLists || tasksLists.error) {
	// 	return res.status(500).send(sendResponse(500, '', 'getTaskListForHomePage', null, req.data.signature))
	// }
	let sendData = (tasksLists && tasksLists.data) || null

	return res.status(200).send(sendResponse(200, 'Task Lists fetched', 'getTaskListForHomePage', sendData, req.data.signature));
}
exports.getTeamTasksList = getTeamTasksList;

//today and upcoming
const createPayloadAndGetTeamTasksList = async function (data) {
	try {

		let currentDate = (data.currentDate && new Date(data.currentDate)) || new Date(new Date().toUTCString())
		let findData = {
			isDeleted: false,
			isArchived: false,
			dueDate: { $gte: currentDate }
		};

		if (data.assignedTo) {
			findData.assignedTo = data.assignedTo
		}

		if (!['SUPER_ADMIN'].includes(data.auth.role) && data.filteredProjects) {
			findData.projectId = { $in: data.filteredProjects }
		}

		let populate = 'lead assignedTo'
		let sortCriteria = { dueDate: 1 }
		let taskList = await Task.taskFindQuery(findData, {}, populate, sortCriteria);
		return { data: taskList, error: false }

	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

const createPayloadAndGetTeamPendingRatingTasks = async function (data) {
	try {

		let findData = {
			isDeleted: false,
			isArchived: false,
			status: "COMPLETED",
			isVerified: false
		};

		if (data.assignedTo) {
			findData.assignedTo = data.assignedTo
		}

		//filter tasks of only those project which are assigned to LEAD, CONTRIBUTOR, INTERN
		if (!['SUPER_ADMIN'].includes(data.auth.role)) {
			findData.projectId = { $in: data.filteredProjects || [] }
		}

		let populate = 'lead assignedTo'

		let sortCriteria = { dueDate: 1 }
		let taskList = await Task.taskFindQuery(findData, {}, populate, sortCriteria);
		return { data: taskList, error: false }

	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

//today and upcoming
const createPayloadAndGetTeamLateVerifiedTasksList = async function (data) {
	try {

		let findData = {
			isDeleted: false,
			isArchived: false,
			isDelayedVerified: true
		};

		if (data.assignedTo) {
			findData.assignedTo = data.assignedTo
		}

		if (!['SUPER_ADMIN'].includes(data.auth.role) && data.filteredProjects) {
			findData.projectId = { $in: data.filteredProjects }
		}

		let populate = 'lead assignedTo'
		let sortCriteria = { dueDate: 1 }
		let taskList = await Task.taskFindQuery(findData, {}, populate, sortCriteria);
		return { data: taskList, error: false }

	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

const createPayloadAndGetTeamAdhocTasksList = async function (data) {
	try {

		let findData = {
			isDeleted: false,
			isArchived: false,
			status: 'COMPLETED'
		};

		let projectFilter = [{ projectId: process.env.adhocProjectId }]
		if (data.assignedTo) {
			findData.assignedTo = data.assignedTo
		}

		if (!['SUPER_ADMIN'].includes(data.auth.role) && data.filteredProjects) {
			projectFilter.push({ projectId: { $in: data.filteredProjects } })
		}

		findData['$and'] = projectFilter
		let populate = 'lead assignedTo'
		let sortCriteria = { dueDate: 1 }
		let taskList = await Task.taskFindQuery(findData, {}, populate, sortCriteria);
		return { data: taskList, error: false }

	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

//Get task lists for homepage - Set according to role
const getTeamTasksCountReport = async function (req, res, next) {

	let data = req.data;

	if (!data.userId) {
		return res.status(400).send(sendResponse(400, `User required`, 'getTaskDetailsByTaskId', null, req.data.signature))
	}
	data.assignedTo = data.userId

	let tasksLists = null;
	if (data.todayTasks) {
		tasksLists = await createPayloadAndGetTeamTasksList(data);
	} else if (data.overDueTasks) {
		tasksLists = await createPayloadAndGetOverDueTasks(data);
	} else if (data.pendingRatingTasks) {
		tasksLists = await createPayloadAndGetTeamPendingRatingTasks(data);
	} else if (data.isDelayedVerified) {
		tasksLists = await createPayloadAndGetTeamLateVerifiedTasksList(data);
	} else if (data.adhocTasks) {
		tasksLists = await createPayloadAndGetTeamAdhocTasksList(data);
	}

	// if (tasksLists || tasksLists.error) {
	// 	return res.status(500).send(sendResponse(500, '', 'getTaskListForHomePage', null, req.data.signature))
	// }
	let sendData = (tasksLists && tasksLists.data) || null

	return res.status(200).send(sendResponse(200, 'Task Lists fetched', 'getTaskListForHomePage', sendData, req.data.signature));
}
exports.getTeamTasksCountReport = getTeamTasksCountReport;