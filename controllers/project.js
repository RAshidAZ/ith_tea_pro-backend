const { sendResponse } = require('../helpers/sendResponse');
const queryController = require('../query')
const { Project } = queryController;
const { ProjectSections } = queryController;
const { Task } = queryController;
const { ProjectLogs } = queryController;
const { User } = queryController;

const mongoose = require("mongoose");

const emailUtitlities = require("../helpers/email");

const ratingController = require('./rating')
const { addCommnetIdInRatingById } = ratingController;
const actionLogController = require("../controllers/actionLogs");

const getAllProjects = async (req, res, next) => {
	let data = req.data;

	let projectRes = await createPayloadAndgetAllProjects(data)

	if (projectRes.error || !projectRes.data) {
		return res.status(500).send(sendResponse(500, '', 'getAllProjects', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, 'Projects Fetched', 'getAllProjects', projectRes.data, req.data.signature))
}
exports.getAllProjects = getAllProjects;

const getProjectsAllUser = async (req, res, next) => {
	let data = req.data;
	if (!data.projectId) {
		return res.status(400).send(sendResponse(400, "", 'getProjectsAllUser', null, req.data.signature))
	}

	let projectRes = await createPayloadAndGetProjectsAllUser(data)
	if (projectRes.error || !projectRes.data) {
		return res.status(500).send(sendResponse(500, '', 'getProjectsAllUser', null, req.data.signature))
	}
	let projectUsers = projectRes.data.length ? projectRes.data[0].accessibleBy : [];
	projectUsers = projectUsers.filter(e => !e.isBlocked);
	return res.status(200).send(sendResponse(200, "Project's User Fetched", 'getProjectsAllUser', projectUsers, req.data.signature))
}
exports.getProjectsAllUser = getProjectsAllUser;


const createPayloadAndGetProjectsAllUser = async function (data) {
	try {
		let payload = {
			_id: data.projectId,
			"isDeleted": false
		}
		let projection = {
		}
		let projectRes = await Project.getProjectsAllUser(payload, projection)
		return { data: projectRes, error: false }
	} catch (err) {
		console.log("createPayloadAndGetProjectsAllUser Error : ", err)
		return { data: err, error: true }
	}
}
exports.createPayloadAndGetProjectsAllUser = createPayloadAndGetProjectsAllUser;

const getUserAssignedProjects = async (req, res, next) => {
	let data = req.data;
	if (!data.userId) {
		return res.status(400).send(sendResponse(400, "", 'getUserAssignedProjects', null, req.data.signature))
	}

	let projectRes = await createPayloadAndGetUserAssignedProjects(data)
	if (projectRes.error || !projectRes.data) {
		return res.status(500).send(sendResponse(500, '', 'getUserAssignedProjects', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, "User Project Fetched", 'getUserAssignedProjects', projectRes.data, req.data.signature))
}
exports.getUserAssignedProjects = getUserAssignedProjects


const createPayloadAndGetUserAssignedProjects = async function (data) {
	try {
		let payload = {
			accessibleBy: data.userId,
			"isDeleted": false
		}
		let projection = {
			_id: 1
		}
		let projectRes = await Project.findInProjects(payload, projection)
		return { data: projectRes, error: false }
	} catch (err) {
		console.log("createPayloadAndGetUserAssignedProjects Error : ", err)
		return { data: err, error: true }
	}
}
exports.createPayloadAndGetUserAssignedProjects = createPayloadAndGetUserAssignedProjects;

const addNewProject = async (req, res, next) => {
	let data = req.data;
	if (!data.name || !data.selectedManagers || !data.selectedManagers.length) {
		return res.status(400).send(sendResponse(400, "", 'addNewProject', null, req.data.signature))
	}

	let checkIfProjectNameExist = await checkUniqueProject(data)
	if(checkIfProjectNameExist.error){
		return res.status(500).send(sendResponse(500, '', 'addNewProject', null, req.data.signature))
	}
	if(checkIfProjectNameExist.data.exist){
		return res.status(400).send(sendResponse(400, "Project name already exist", 'addNewProject', null, req.data.signature))
	}
	let projectRes = await createPayloadAndAddProject(data)
	if (projectRes.error || !projectRes.data) {
		return res.status(500).send(sendResponse(500, '', 'addNewProject', null, req.data.signature))
	}

	let actionLogData = {
		actionTaken: 'PROJECT_ADDED',
		actionBy: data.auth.id,
		projectId : projectRes.data._id
	}
	data.actionLogData = actionLogData;
	let addActionLogRes = await actionLogController.addProjectLog(data);

	if (addActionLogRes.error) {
		console.log("===========error",addActionLogRes.data)
		return res.status(500).send(sendResponse(500, '', 'addNewProject', null, req.data.signature))
	}
	
	return res.status(200).send(sendResponse(200, "Project's Added Successfully", 'addNewProject', null, req.data.signature))
}
exports.addNewProject = addNewProject


const createPayloadAndAddProject = async function (data) {
	try {
		let selectedManagers = data.selectedManagers || [];
		selectedManagers.push(process.env.ADMIN_ID.toString());
		let payload = {
			name: data.name,
			// sections: data.projectCategories,
			managedBy: data.selectedManagers,
			accessibleBy: data.selectAccessibleBy || [],
			// image : data.imagePath
		}

		if (data.sections) {
			payload.sections = data.sections
		}
		if (data.description) {
			payload.description = data.description
		}
		if (data.colorCode) {
			payload.colorCode = data.colorCode
		}
		let projectRes = await Project.addNewProject(payload)
		return { data: projectRes, error: false }
	} catch (err) {
		console.log("createPayloadAndAddProject Error : ", err)
		return { data: err, error: true }
	}
}
exports.createPayloadAndAddProject = createPayloadAndAddProject


const editProject = async (req, res, next) => {
	let data = req.data;
	if (!data.projectId || !data.name || !data.description) {
		return res.status(400).send(sendResponse(400, "", 'editProject', null, req.data.signature))
	}

	let projectRes = await createPayloadAndEditProject(data)
	if (projectRes.error || !projectRes.data) {
		return res.status(500).send(sendResponse(500, '', 'editProject', null, req.data.signature))
	}

	let actionLogData = {
		actionTaken: 'PROJECT_UPDATED',
		actionBy: data.auth.id,
		projectId : projectRes.data._id
	}
	data.actionLogData = actionLogData;
	let addActionLogRes = await actionLogController.addProjectLog(data);

	if (addActionLogRes.error) {
		return res.status(500).send(sendResponse(500, '', 'editProject', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, "Project's Edited Successfully", 'editProject', null, req.data.signature))
}
exports.editProject = editProject


const createPayloadAndEditProject = async function (data) {
	try {
		let payload = {
			_id: data.projectId
		}
		let updatePayload = {
			name: data.name,
			// categories: data.categories,
			description: data.description,
		}
		if (data.selectedManagers) {
			updatePayload.managedBy = data.selectedManagers
		}
		if (data.selectAccessibleBy) {
			updatePayload.accessibleBy = data.selectAccessibleBy
		}
		if (data.sections) {
			updatePayload.sections = data.sections
		}
		if (JSON.stringify(data.colorCode)) {
			updatePayload.colorCode = data.colorCode
		}
		// let projectSectionRes = await Project.editProjectDetails(payload, updatePayload)
		let projectRes = await Project.editProjectDetails(payload, updatePayload)
		return { data: projectRes, error: false }
	} catch (err) {
		console.log("createPayloadAndEditProject Error : ", err)
		return { data: err, error: true }
	}
}
exports.createPayloadAndEditProject = createPayloadAndEditProject;


const assignUserToProject = async (req, res, next) => {
	let data = req.data;
	if (!data.projectId || !data.userIds) {
		return res.status(400).send(sendResponse(400, "", 'assignUserToProject', null, req.data.signature))
	}


	let projectData = await Project.findSpecificProject({ _id : data.projectId});

	if (!projectData || projectData.isArchived) {
		return res.status(400).send(sendResponse(400, "Project Archived, Can't assign lead/users ", 'assignUserToProject', null, req.data.signature))
	}
	let projectRes = await createPayloadAndAssignProjectToUser(data)
	if (projectRes.error || !projectRes.data) {
		return res.status(500).send(sendResponse(500, '', 'assignUserToProject', null, req.data.signature))
	}

	let actionLogData = {
		actionTaken: 'USERS_ASSIGNED',
		actionBy: data.auth.id,
		projectId : data.projectId
	}
	data.actionLogData = actionLogData;
	let addActionLogRes = await actionLogController.addProjectLog(data);

	if (addActionLogRes.error) {
		return res.status(500).send(sendResponse(500, '', 'assignUserToProject', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, "Project's  User Assigned Successfully", 'assignUserToProject', null, req.data.signature))
}
exports.assignUserToProject = assignUserToProject


const createPayloadAndAssignProjectToUser = async function (data) {
	try {
		let payload = {
			_id: data.projectId
		}

		let findUsers = {
			_id : { $in : data.userIds}
		}

		let allUsers = await User.getAllUsers(findUsers)
		data.allUsers = allUsers
		allUsers = allUsers.length ? allUsers : []
		let usersToAssign = allUsers.filter((el) => el.role == 'CONTRIBUTOR')
		let leadsToAssign = allUsers.filter((el) => el.role == 'LEAD')
		console.log("=================assign user/lead data=========",usersToAssign, leadsToAssign)
		if(usersToAssign.length && !usersToAssign[0].role){
			usersToAssign = []
		}

		
		if(leadsToAssign.length && !leadsToAssign[0].role){
			leadsToAssign = []
		}
		let updatePayload = {
			$addToSet: { accessibleBy: { $each: usersToAssign }, managedBy: { $each: leadsToAssign } }
		}

		let projectRes = await Project.projectFindOneAndUpdate(payload, updatePayload)
		data.projectRes = projectRes;
		// let sendAssignedProjectMail = await sendUsersProjectAssignedMail(data)
		return { data: projectRes, error: false }
	} catch (err) {
		console.log("createPayloadAndEditProject Error : ", err)
		return { data: err, error: true }
	}
}
exports.createPayloadAndAssignProjectToUser = createPayloadAndAssignProjectToUser

const assignLeadToProject = async (req, res, next) => {
	let data = req.data;
	if (!data.projectId || !data.userIds) {
		return res.status(400).send(sendResponse(400, "Missing Params", 'assignLeadToProject', null, req.data.signature))
	}

	data.assignLead = true;
	let projectData = await Project.findSpecificProject({ _id : data.projectId});

	if (!projectData || projectData.isArchived) {
		return res.status(400).send(sendResponse(400, "Project Archived, Can't assign lead/users ", 'assignUserToProject', null, req.data.signature))
	}
	let projectRes = await createPayloadAndAssignProjectToUser(data)
	if (projectRes.error || !projectRes.data) {
		return res.status(500).send(sendResponse(500, '', 'assignUserToProject', null, req.data.signature))
	}

	let actionLogData = {
		actionTaken: 'LEADS_ASSIGNED',
		actionBy: data.auth.id,
		projectId : data.projectId
	}
	data.actionLogData = actionLogData;
	let addActionLogRes = await actionLogController.addProjectLog(data);

	if (addActionLogRes.error) {
		console.log("===========error",addActionLogRes.data)
		return res.status(500).send(sendResponse(500, '', 'assignUserToProject', null, req.data.signature))
	}

	return res.status(200).send(sendResponse(200, "Project's Lead Assigned Successfully", 'assignUserToProject', null, req.data.signature))
}
exports.assignLeadToProject = assignLeadToProject

const removeUserFromProject = async (req, res, next) => {
	let data = req.data;
	if (!data.projectId || !data.userId) {
		return res.status(400).send(sendResponse(400, "", 'removeUserFromProject', null, req.data.signature))
	}

	let projectRes = await createPayloadAndUnAssignUser(data)
	if (projectRes.error || !projectRes.data) {
		return res.status(500).send(sendResponse(500, '', 'removeUserFromProject', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, "Project's  User Removed Successfully", 'removeUserFromProject', null, req.data.signature))
}
exports.removeUserFromProject = removeUserFromProject

const removeLeadFromProject = async (req, res, next) => {
	let data = req.data;
	if (!data.projectId || !data.userId) {
		return res.status(400).send(sendResponse(400, "", 'removeUserFromProject', null, req.data.signature))
	}

	data.removeLead = true;

	let projectRes = await createPayloadAndUnAssignUser(data)
	if (projectRes.error || !projectRes.data) {
		return res.status(500).send(sendResponse(500, '', 'removeUserFromProject', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, "Project's Lead Removed Successfully", 'removeUserFromProject', null, req.data.signature))
}
exports.removeLeadFromProject = removeLeadFromProject

const createPayloadAndUnAssignUser = async function (data) {
	try {
		let payload = {
			_id: data.projectId
		}
		let updatePayload = {
			$pull: { accessibleBy: data.userId }
		}
		if (data.removeLead) {
			updatePayload = {
				$pull: { managedBy: data.userId }
			}
		}
		let projectRes = await Project.projectFindOneAndUpdate(payload, updatePayload)
		return { data: projectRes, error: false }
	} catch (err) {
		console.log("createPayloadAndUnAssignUser Error : ", err)
		return { data: err, error: true }
	}
}
exports.createPayloadAndUnAssignUser = createPayloadAndUnAssignUser


const deleteProject = async (req, res, next) => {
	let data = req.data;
	if (!data.projectId) {
		return res.status(400).send(sendResponse(400, "", 'deleteProject', null, req.data.signature))
	}

	let taskCountRes = await getTaskCountForProject(data)
	if (taskCountRes.error) {
		return res.status(500).send(sendResponse(500, '', 'deleteProject', null, req.data.signature))
	}

	if(taskCountRes.data){
		return res.status(400).send(sendResponse(400, "Can't delete project, tasks exist", 'deleteProject', null, req.data.signature))
	}
	let projectRes = await createPayloadAndDeleteProject(data)
	if (projectRes.error) {
		return res.status(500).send(sendResponse(500, '', 'deleteProject', null, req.data.signature))
	}

	let actionLogData = {
		actionTaken: 'PROJECT_DELETED',
		actionBy: data.auth.id,
		projectId : data.projectId
	}
	data.actionLogData = actionLogData;
	let addActionLogRes = await actionLogController.addProjectLog(data);

	if (addActionLogRes.error) {
		return res.status(500).send(sendResponse(500, '', 'addNewProject', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, "Project Deleted Successfully", 'deleteProject', null, req.data.signature))
}
exports.deleteProject = deleteProject

const createPayloadAndDeleteProject = async function (data) {
	try {
		let payload = {
			_id: data.projectId
		}
		let updatePayload = {
			$set: {
				isActive: false,
				isDeleted : true,
				updatedAt: new Date()
			}
		}
		let projectRes = await Project.projectFindOneAndUpdate(payload, updatePayload)
		let taskPayload = { projectId : data.projectId}
		let taskUpdatePayload = {
			$set: {
				isDeleted : true,
				updatedAt: new Date()
			}
		}

		let tasksRes = await Task.updateMany(taskPayload, taskUpdatePayload)
		return { data: projectRes, error: false }
	} catch (err) {
		console.log("createPayloadAndDeleteProject Error : ", err)
		return { data: err, error: true }
	}
}
exports.createPayloadAndDeleteProject = createPayloadAndDeleteProject;


const createPayloadAndgetAllProjects = async function (data) {
	try {

		let pipeline = [];

		let projectAccess = {};

		let findData = {
			"isDeleted": false
		}
		
		if(JSON.stringify(data.isArchived)){
			findData['isArchived'] = JSON.parse(data.isArchived)
		}else{
			findData['isArchived'] = false
			findData['isActive'] = true
		}

		console.log("================finda data",findData)
		if (!['SUPER_ADMIN', 'ADMIN'].includes(data.auth.role)) {
			projectAccess["$match"] =
			{
				"$or": [
					{ accessibleBy: mongoose.Types.ObjectId(data.auth.id) },
					{ managedBy: mongoose.Types.ObjectId(data.auth.id) },
				]
			}
			pipeline.push(projectAccess);
		}

		pipeline.push(
			{
				$match: findData
			})
		pipeline.push(
			{
				$lookup: {
					from: "tasks",
					let: { "projectId": "$_id" },
					pipeline: [
						{
							$match: {
								"$expr": {
									$and: [
										{ $eq: ["$isDeleted", false] },
										{ $eq: ["$projectId", "$$projectId"] }
									]
								}
							}
						}
					],
					as: "tasks"
				}
			})

			// pipeline.push({ "$unwind": { "path": "$tasks", preserveNullAndEmptyArrays: true } })
		pipeline.push(
			{
				$lookup: {
					from: "users",
					localField: "accessibleBy",
					foreignField: "_id",
					as: "accessibleBy"
				}
			}
		)
		// pipeline.push({ "$unwind": { "path": "$accessibleBy", preserveNullAndEmptyArrays: true } })
		pipeline.push(
			{
				$lookup: {
					from: "users",
					localField: "managedBy",
					foreignField: "_id",
					as: "managedBy"
				}
			},
			)
		// pipeline.push({ "$unwind": { "path": "$managedBy", preserveNullAndEmptyArrays: true } })
		pipeline.push(
			{
				$lookup: {
					from: "projectsections",
					localField: "sections",
					foreignField: "_id",
					as: "sections"
				}
			}
			
		)
		// pipeline.push({ "$unwind": { "path": "$sections", preserveNullAndEmptyArrays: true } })
		pipeline.push(
			{
				$sort: {
					updatedAt : -1
				}
			}
		)

		let projectRes = await Project.projectAggregate(pipeline)
		return { data: projectRes, error: false }
	} catch (err) {
		console.log("createPayloadAndgetAllProjects Error : ", err)
		return { data: err, error: true }
	}
}
exports.createPayloadAndgetAllProjects = createPayloadAndgetAllProjects;

const getAllProjectsList = async (req, res, next) => {
	let data = req.data;

	let projectRes = await createPayloadAndgetAllProjectsList(data)

	if (projectRes.error) {
		return res.status(500).send(sendResponse(500, '', 'getAllProjects', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, 'Projects Fetched', 'getAllProjects', projectRes.data, req.data.signature))
}
exports.getAllProjectsList = getAllProjectsList;

const createPayloadAndgetAllProjectsList = async function (data) {
	try {
		let payload = {
			isActive: true,
			"isDeleted": false
		}
		if (!['SUPER_ADMIN', "ADMIN"].includes(data.auth.role)) {
			console.log("Role other than SA/A...", data.auth.role)
			payload["$or"] = [
				{ accessibleBy: data.auth.id },
				{ managedBy: data.auth.id },
			]
		}
		let projection = {};

		let sortCriteria = {};
		let populate = 'accessibleBy managedBy sections'
		if (data.alphabetical) {
			sortCriteria.name = -1
		}
		let projectRes = await Project.getAllProjects(payload, projection, sortCriteria, populate)
		return { data: projectRes, error: false }
	} catch (err) {
		console.log("createPayloadAndgetAllProjects Error : ", err)
		return { data: err, error: true }
	}
}

//get all project categories
const getAllProjectSections = async (req, res, next) => {
	let data = req.data;

	let projectRes = await createPayloadAndgetAllProjectSections(data)

	if (projectRes.error || !projectRes.data) {
		return res.status(500).send(sendResponse(500, '', 'getAllProjectSections', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, 'Projects section Fetched', 'getAllProjectSections', projectRes.data, req.data.signature))
}
exports.getAllProjectSections = getAllProjectSections;

//create payload for getting sections of project
const createPayloadAndgetAllProjectSections = async function (data) {
	try {
		let payload = {
			isActive: true,
			"isDeleted": false
		}

		let sortCriteria = {
			createdAt: 1
		}

		let projectRes = await ProjectSections.getProjectSections(payload, {}, sortCriteria)
		return { data: projectRes, error: false }
	} catch (err) {
		console.log("createPayloadAndgetAllProjectCategories Error : ", err)
		return { data: err, error: true }
	}
}

//add project section
const addProjectSection = async (req, res, next) => {
	let data = req.data;
	if (!data.name || !data.projectId) {
		return res.status(400).send(sendResponse(400, "Missing params", 'addProjectSection', null, req.data.signature))
	}

	let sectionRes = await checkIfSectionEist(data)
	if (sectionRes.error) {
		return res.status(500).send(sendResponse(500, '', 'addProjectSection', null, req.data.signature))
	}

	if (sectionRes.data) {
		return res.status(400).send(sendResponse(400, "Section with the name already exist for this project", 'addProjectSection', null, req.data.signature))
	}

	let projectSectionRes = await createPayloadAndAddProjectSection(data)
	if (projectSectionRes.error || !projectSectionRes.data) {
		return res.status(500).send(sendResponse(500, '', 'addProjectSection', null, req.data.signature))
	}
	data.projectSections = [projectSectionRes.data._id]
	let projectRes = await createPayloadAndUpdateProjectSection(data)
	if (projectRes.error || !projectRes.data) {
		return res.status(500).send(sendResponse(500, '', 'addProjectSection', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, "Project's section Added Successfully", 'addProjectSection', projectSectionRes.data, req.data.signature))
}
exports.addProjectSection = addProjectSection


const createPayloadAndAddProjectSection = async function (data) {
	try {
		let payload = {
			name: data.name,
			isActive : true,
			isDeleted : false,
			projectId : data.projectId
		}

		let projectSectionRes = await ProjectSections.createProjectSection(payload)
		return { data: projectSectionRes, error: false }
	} catch (err) {
		console.log("createPayloadAndAddProject Error : ", err)
		return { data: err, error: true }
	}
}
exports.createPayloadAndAddProjectSection = createPayloadAndAddProjectSection

const createPayloadAndUpdateProjectSection = async function (data) {
	try {
		let payload = {
			_id: data.projectId
		}

		let updatePayload = {
			$addToSet: { sections: { $each: data.projectSections || [] } }
		}

		let projectSectionRes = await Project.editProjectDetails(payload, updatePayload)
		return { data: projectSectionRes, error: false }
	} catch (err) {
		console.log("createPayloadAndAddProject Error : ", err)
		return { data: err, error: true }
	}
}
exports.createPayloadAndUpdateProjectSection = createPayloadAndUpdateProjectSection

const getSpecificProject = async (req, res, next) => {
	let data = req.data;

	if (!data.projectId) {
		return res.status(400).send(sendResponse(400, "Missing params", 'getSpecificProject', null, req.data.signature))
	}

	let projectRes = await createPayloadAndfindSpecificProject(data)

	if (projectRes.error || !projectRes.data) {
		return res.status(500).send(sendResponse(500, '', 'getSpecificProject', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, 'Projects Fetched', 'getSpecificProject', projectRes.data, req.data.signature))
}
exports.getSpecificProject = getSpecificProject;

const createPayloadAndfindSpecificProject = async function (data) {
	try {
		let payload = {
			_id: data.projectId,
			"isDeleted": false
		}

		let projection = {}

		let populate = 'accessibleBy managedBy sections'

		let projectRes = await Project.findSpecificProject(payload, projection, populate)
		// if(data.auth.role =='LEAD' && projectRes && projectRes.accessibleBy){

		// 	let user = await User.userfindOneQuery({_id : data.auth.id})
		// 	projectRes.accessibleBy.push(user)
		// }
		return { data: projectRes, error: false }
	} catch (err) {
		console.log("createPayloadAndAddProject Error : ", err)
		return { data: err, error: true }
	}
}
exports.createPayloadAndfindSpecificProject = createPayloadAndfindSpecificProject

const createProjectLogPayloadAndAddLog = async function (data) {
	try {
		let payload = {
			_id: data.projectId,
		}

		let projectLogRes = await ProjectLogs.addProjectLog(payload)
		return { data: projectLogRes, error: false }
	} catch (err) {
		console.log("createPayloadAndGetProjectsAllUser Error : ", err)
		return { data: err, error: true }
	}
}
exports.createProjectLogPayloadAndAddLog = createProjectLogPayloadAndAddLog;

const archiveStatusProjectUpdate = async (req, res, next) => {
	let data = req.data;
	if (!data.projectId || !JSON.stringify(data.isArchived)) {
		return res.status(400).send(sendResponse(400, "", 'archiveStatusProjectUpdate', null, req.data.signature))
	}

	if(data.isArchived == 'true' || data.isArchived == true){

		console.log("==============check task before archive project")
		let dueTaskRes = await getDueTaskCountForProject(data)
		if (dueTaskRes.error) {
			return res.status(500).send(sendResponse(500, '', 'archiveStatusProjectUpdate', null, req.data.signature))
		}
	
		console.log("==============check task before archive project",dueTaskRes.data )
		if(dueTaskRes.data){
			return res.status(400).send(sendResponse(400, "Can't archive project, due tasks exist", 'archiveStatusProjectUpdate', null, req.data.signature))
		}
	}
	let projectRes = await createPayloadAndArchiveProject(data)
	if (projectRes.error) {
		return res.status(500).send(sendResponse(500, '', 'archiveStatusProjectUpdate', null, req.data.signature))
	}

	let actionLogData = {
		actionTaken: data.isArchived ? 'PROJECT_ARCHIVED' : 'PROJECT_UNARCHIVED',
		actionBy: data.auth.id,
		projectId : data.projectId
	}
	data.actionLogData = actionLogData;
	let addActionLogRes = await actionLogController.addProjectLog(data);

	if (addActionLogRes.error) {
		return res.status(500).send(sendResponse(500, '', 'assignUserToProject', null, req.data.signature))
	}

	return res.status(200).send(sendResponse(200, "Project Archive status changed Successfully", 'archiveStatusProjectUpdate', null, req.data.signature))
}
exports.archiveStatusProjectUpdate = archiveStatusProjectUpdate

const createPayloadAndArchiveProject = async function (data) {
	try {
		let payload = {
			_id: data.projectId
		}
		let updatePayload = {
			$set: {
				isArchived: data.isArchived,
				isActive : data.isArchived,
				updatedAt: new Date()
			}
		}
		let projectRes = await Project.projectFindOneAndUpdate(payload, updatePayload)

		let taskPayload = { projectId : data.projectId, isDeleted : false}
		let taskUpdatePayload = {
			$set: {
				isArchived : data.isArchived,
				updatedAt: new Date()
			}
		}

		let sectionRes = await ProjectSections.updateMany(taskPayload, taskUpdatePayload)
		let tasksRes = await Task.updateMany(taskPayload, taskUpdatePayload)
		return { data: projectRes, error: false }
	} catch (err) {
		console.log("createPayloadAndArchiveProject Error : ", err)
		return { data: err, error: true }
	}
}
exports.createPayloadAndArchiveProject = createPayloadAndArchiveProject;

//editeditProjectSection project section
const editProjectSection = async (req, res, next) => {
	let data = req.data;
	if (!data.name || !data.sectionId) {
		return res.status(400).send(sendResponse(400, "", 'editProjectSection', null, req.data.signature))
	}

	let projectSectionRes = await createPayloadAndEditProjectSection(data)
	if (projectSectionRes.error || !projectSectionRes.data) {
		return res.status(500).send(sendResponse(500, '', 'editProjectSection', null, req.data.signature))
	}
	
	return res.status(200).send(sendResponse(200, "Project's section updated Successfully", 'editProjectSection', null, req.data.signature))
}
exports.editProjectSection = editProjectSection

const createPayloadAndEditProjectSection = async function (data) {
	try {
		let payload = {
			_id : data.sectionId
		}

		let options = {
			upsert: true,
			new: true,
			setDefaultsOnInsert: true
		}

		let updatePayload = { }
	
		if(data.name){
			updatePayload.name = data.name
		}
		let projectSectionRes = await ProjectSections.projectSectionFindOneAndUpdate(payload, updatePayload, options)
		return { data: projectSectionRes, error: false }
	} catch (err) {
		console.log("createPayloadAndAddProject Error : ", err)
		return { data: err, error: true }
	}
}
exports.createPayloadAndAddProjectSection = createPayloadAndAddProjectSection

//add project section
const deleteProjectSection = async (req, res, next) => {
	let data = req.data;
	if (!data.sectionId) {
		return res.status(400).send(sendResponse(400, "", 'deleteProjectSection', null, req.data.signature))
	}

	let tasksList = await getAllTasksWithSameSection(data)

	if (tasksList.error) {
		return res.status(500).send(sendResponse(500, '', 'deleteProjectSection', null, req.data.signature))
	}

	if(tasksList && tasksList.data.length){
		return res.status(400).send(sendResponse(400, "Can't delete section, task exist", 'deleteProjectSection', null, req.data.signature))
	}
	let projectSectionRes = await createPayloadAndDeleteProjectSection(data)
	if (projectSectionRes.error || !projectSectionRes.data) {
		return res.status(500).send(sendResponse(500, '', 'deleteProjectSection', null, req.data.signature))
	}
	let projectRes = await createPayloadAndRemoveProjectSection(data)
	if (projectRes.error || !projectRes.data) {
		return res.status(500).send(sendResponse(500, '', 'deleteProjectSection', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, "Section deleted Successfully", 'deleteProjectSection', null, req.data.signature))
}
exports.deleteProjectSection = deleteProjectSection

const createPayloadAndRemoveProjectSection = async function (data) {
	try {
		let payload = {
			sections : data.sectionId
		}

		let updatePayload = {
			$pull: { sections: data.sectionId }
		}

		let projectRes = await Project.updateProjects(payload, updatePayload)
		return { data: projectRes, error: false }
	} catch (err) {
		console.log("createPayloadAndRemoveProjectSection Error : ", err)
		return { data: err, error: true }
	}
}
exports.createPayloadAndRemoveProjectSection = createPayloadAndRemoveProjectSection

const getAllTasksWithSameSection = async function (data) {
	try {

		let findData = {
			isDeleted : false,
			section : data.sectionId
		}

		let allTasks = await Task.taskFindQuery(findData, {}, "");
		return { data: allTasks, error: false }

	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

//editeditProjectSection project section
const createPayloadAndDeleteProjectSection = async function (data) {
	try {
		let payload = {
			_id : data.sectionId
		}

		let updatePayload = { isDeleted : true, isActive : false }
	
		let projectSectionRes = await ProjectSections.projectSectionFindOneAndUpdate(payload, updatePayload, {})
		return { data: projectSectionRes, error: false }
	} catch (err) {
		console.log("createPayloadAndDeleteProjectSection Error : ", err)
		return { data: err, error: true }
	}
}
exports.createPayloadAndDeleteProjectSection = createPayloadAndDeleteProjectSection


const archiveStatusSectionUpdate = async (req, res, next) => {
	let data = req.data;
	if (!data.sectionId || !JSON.stringify(data.isArchived)) {
		return res.status(400).send(sendResponse(400, "", 'archiveStatusProjectUpdate', null, req.data.signature))
	}
	if(data.isArchived == 'true' || data.isArchived == true){

		console.log("==============check task before archive section")
		let dueTaskRes = await getDueTaskCountForSection(data)
		if (dueTaskRes.error) {
			return res.status(500).send(sendResponse(500, '', 'archiveStatusProjectUpdate', null, req.data.signature))
		}
	
		console.log("==============check task before archive section",dueTaskRes.data )
		if(dueTaskRes.data){
			return res.status(400).send(sendResponse(400, "Can't archive section, due tasks exist", 'archiveStatusProjectUpdate', null, req.data.signature))
		}
	}
	let projectSectionRes = await createPayloadAndArchiveSection(data)
	if (projectSectionRes.error) {
		return res.status(500).send(sendResponse(500, '', 'archiveStatusProjectUpdate', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, "Section Archive status changed Successfully", 'archiveStatusProjectUpdate', null, req.data.signature))
}
exports.archiveStatusSectionUpdate = archiveStatusSectionUpdate

const createPayloadAndArchiveSection = async function (data) {
	try {
		let payload = {
			_id: data.sectionId
		}
		let updatePayload = {
			$set: {
				isArchived: data.isArchived,
				updatedAt: new Date()
			}
		}
		let projectSectionRes = await ProjectSections.projectSectionFindOneAndUpdate(payload, updatePayload)

		let taskPayload = { section : data.sectionId}
		let taskUpdatePayload = {
			$set: {
				isArchived : true,
				updatedAt: new Date()
			}
		}

		let tasksRes = await Task.updateMany(taskPayload, taskUpdatePayload)
		return { data: projectSectionRes, error: false }
	} catch (err) {
		console.log("createPayloadAndArchiveSection Error : ", err)
		return { data: err, error: true }
	}
}
exports.createPayloadAndArchiveSection = createPayloadAndArchiveSection;

const getTaskCountForProject = async function (data) {
	try {

		let findData = {
			isDeleted : false,
			isRated : false,
			projectId : data.projectId
		}

		let tascCount = await Task.taskCount(findData);
		return { data: tascCount, error: false }

	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

const checkIfSectionEist = async function (data) {
	try {
		let payload = {
			name: data.name,
			isActive : true,
			isDeleted : false,
			projectId : data.projectId
		}
		
		let projectSectionRes = await ProjectSections.findSection(payload)
		return { data: projectSectionRes, error: false }
	} catch (err) {
		console.log("createPayloadAndAddProject Error : ", err)
		return { data: err, error: true }
	}
}

const getDueTaskCountForProject = async function (data) {
	try {

		let findData = {
			isDeleted : false,
			isRated : false,
			projectId : data.projectId
		}

		let taskCount = await Task.taskCount(findData);
		return { data: taskCount, error: false }

	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

const checkUniqueProject = async function (data) {
	try {
		let payload = {
			name: data.name,
			isDeleted : false
		}
		if(data.projectId){
			payload._id = { $ne : data.projectId}
		}
		let projectRes = await Project.findSpecificProject(payload)
		if(projectRes){
			return { data: { exist: true }, error: false }
		}
		return { data: { exist: false }, error: false }
	} catch (err) {
		console.log("checkUniqueProject Error : ", err)
		return { data: err, error: true }
	}
}

const getDueTaskCountForSection = async function (data) {
	try {

		let findData = {
			isDeleted : false,
			isRated : false,
			section : data.sectionId
		}

		let taskCount = await Task.taskCount(findData);
		return { data: taskCount, error: false }

	} catch (err) {
		console.log("Error => ", err);
		return { data: err, error: true }
	}
}

const sendUsersProjectAssignedMail = async function (data) {
	try {
		console.log("=============assign project mail")
		let allUsers = data.allUsers
		let projectRes = data.projectRes

		for(let i in allUsers){
			let mailData= {
				email : allUsers[i].email,
				assignedRole : allUsers[i].role,
				userName : allUsers[i].name,
				projectName : projectRes.name
			}

			console.log("=============assign project mail data", mailData)
			let sendProjectAssignedMail = await emailUtitlities.sendProjectAssignedMailToUser(mailData);
			if(sendProjectAssignedMail.error){
				console.log("============assigned project mail",sendProjectAssignedMail.error,sendProjectAssignedMail.data )
				return { data: err, error: true }
			}
			if(parseInt(i)+1 ==  allUsers.length){
				return { data: projectRes, error: false }
			}
		}
	} catch (err) {
		console.log("sendUsersProjectAssignedMail Error : ", err)
		return { data: err, error: true }
	}
}
exports.sendUsersProjectAssignedMail = sendUsersProjectAssignedMail

const sendProjectAssignedMail = async function (data) {
	try {
		
		return { data: null, error: false }
	} catch (err) {
		console.log("createPayloadAndUnAssignUser Error : ", err)
		return { data: err, error: true }
	}
}
exports.sendProjectAssignedMail = sendProjectAssignedMail

const getSpecificProjectUsers = async (req, res, next) => {
	let data = req.data;

	if (!data.projectId) {
		return res.status(400).send(sendResponse(400, "Missing params", 'getSpecificProject', null, req.data.signature))
	}

	let projectRes = await createPayloadAndfindSpecificProjectUsers(data)

	if (projectRes.error || !projectRes.data) {
		return res.status(500).send(sendResponse(500, '', 'getSpecificProject', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, 'Projects Fetched', 'getSpecificProject', projectRes.data, req.data.signature))
}
exports.getSpecificProjectUsers = getSpecificProjectUsers;

const createPayloadAndfindSpecificProjectUsers = async function (data) {
	try {
		let payload = {
			_id: data.projectId,
			"isDeleted": false
		}

		let projection = {}
		if(data.auth.role == 'CONTRIBUTOR'){
			payload.accessibleBy = data.auth.id
			projection['accessibleBy.$']  = 1
			projection['managedBy']  = 0
		}

		let populate = 'accessibleBy managedBy'

		let projectRes = await Project.findSpecificProject(payload, projection, populate)

		let allUsers = JSON.parse(JSON.stringify(projectRes.accessibleBy || []))
		let allLeads = JSON.parse(JSON.stringify(projectRes.managedBy || []))
		allLeads = allLeads.filter(el=> el.role == 'LEAD')

		let sendData = [];
		if(data.auth.role == 'LEAD'){
			if(data.selectedLeadRole && data.selectedLeadRole == 'ADMIN'){
				allUsers = []
				allLeads = allLeads.filter(el=> el._id.toString() == data.auth.id.toString())
			}else if(data.selectedLeadRole){
				allLeads = []
			}

		}else if(['SUPER_ADMIN', 'ADMIN'].includes(data.auth.role)){
			
			// if(data.selectedLeadRole && data.selectedLeadRole == 'ADMIN'){
			// 	allUsers = []
			// }
		}

		sendData = allUsers.concat(allLeads)

		
		return { data: sendData, error: false }
	} catch (err) {
		console.log("createPayloadAndAddProject Error : ", err)
		return { data: err, error: true }
	}
}

const getSpecificProjectLeads = async (req, res, next) => {
	let data = req.data;

	if (!data.projectId) {
		return res.status(400).send(sendResponse(400, "Missing params", 'getSpecificProjectLeads', null, req.data.signature))
	}

	let projectRes = await createPayloadAndfindSpecificProjectLeads(data)

	if (projectRes.error || !projectRes.data) {
		return res.status(500).send(sendResponse(500, '', 'getSpecificProjectLeads', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, 'Projects leads Fetched', 'getSpecificProjectLeads', projectRes.data, req.data.signature))
}
exports.getSpecificProjectLeads = getSpecificProjectLeads;

const createPayloadAndfindSpecificProjectLeads = async function (data) {
	try {
		let payload = {
			_id: data.projectId,
			"isDeleted": false
		}

		let projection = {}

		let populate = 'managedBy'

		let projectRes = await Project.findSpecificProject(payload, projection, populate)

		let leadList = JSON.parse(JSON.stringify(projectRes.managedBy || []));

		if(data.auth.role == 'CONTRIBUTOR'){
			leadList = leadList.filter(el=>(el && el.role == 'LEAD'))
		}else if(data.auth.role == 'LEAD'){
			leadList = leadList.filter(el=> ((el._id.toString() == data.auth.id.toString()) || (el.role == 'ADMIN')))
		}
		
		return { data: leadList, error: false }
	} catch (err) {
		console.log("createPayloadAndAddProject Error : ", err)
		return { data: err, error: true }
	}
}

const assignProjectsToUser = async (req, res, next) => {
	let data = req.data;
	if (!data.projectIds || !data.userId) {
		return res.status(400).send(sendResponse(400, "", 'assignProjectsToUser', null, req.data.signature))
	}

	let projectData = await Project.getAllProjects({ _id : { $in : data.projectIds }, $or : [{isArchived : true},{isActive : false}, {isDeleted : true}]});

	if (projectData && projectData.length) {
		return res.status(400).send(sendResponse(400, "Project Archived/Inactive, Can't assign lead/users ", 'assignProjectsToUser', null, req.data.signature))
	}

	let findUsers = {
		_id : data.userId
	}

	let user = await User.userfindOneQuery(findUsers)
	if(!user){
		return res.status(400).send(sendResponse(400, "User not found", 'assignProjectsToUser', null, req.data.signature))
	}
	data.user = user

	let projectRes = await createPayloadAndAssignProjectsToUser(data)
	if (projectRes.error || !projectRes.data) {
		return res.status(500).send(sendResponse(500, '', 'assignProjectsToUser', null, req.data.signature))
	}

	let actionLogData = {
		actionTaken: 'USERS_ASSIGNED',
		actionBy: data.auth.id,
		// projectId : data.projectId
	}
	data.actionLogData = actionLogData;
	let addActionLogRes = await actionLogController.addProjectLog(data);

	if (addActionLogRes.error) {
		return res.status(500).send(sendResponse(500, '', 'assignUserToProject', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, "Project(s) assigned to user Successfully", 'assignProjectsToUser', null, req.data.signature))
}
exports.assignProjectsToUser = assignProjectsToUser

const createPayloadAndAssignProjectsToUser = async function (data) {
	try {
		let payload = {
			_id: { $in : data.projectIds || [] }
		}

		
		let user = data.user
		if(!user){
			return { data: "User not found", error: true }
		}

		let updatePayload = { }
		
		if(user.role == 'CONTRIBUTOR'){
			updatePayload = { $addToSet: { accessibleBy: user._id }}
		}else{
			updatePayload = { $addToSet: { managedBy: user._id }}
		}

		let projectRes = await Project.updateMany(payload, updatePayload)
		data.projectRes = projectRes;
		// console.log("============assign data, and resp",updatePayload, projectRes)
		// let sendAssignedProjectMail = await sendUsersProjectAssignedMail(data)
		return { data: projectRes, error: false }
	} catch (err) {
		console.log("createPayloadAndAssignProjectsToUser Error : ", err)
		return { data: err, error: true }
	}
}