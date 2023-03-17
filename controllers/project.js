const { sendResponse } = require('../helpers/sendResponse');
const queryController = require('../query')
const { Project } = queryController;
const { ProjectSections } = queryController;
const { ProjectLogs } = queryController;

const mongoose = require("mongoose");

const ratingController = require('./rating')
const { addCommnetIdInRatingById } = ratingController;

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

    let projectRes = await createPayloadAndAddProject(data)
    if (projectRes.error || !projectRes.data) {
        return res.status(500).send(sendResponse(500, '', 'addNewProject', null, req.data.signature))
    }
    return res.status(200).send(sendResponse(200, "Project's Added Successfully", 'addNewProject', null, req.data.signature))
}
exports.addNewProject = addNewProject


const createPayloadAndAddProject = async function (data) {
    try {
        let payload = {
            name: data.name,
            // sections: data.projectCategories,
            managedBy: data.selectedManagers,
            accessibleBy: data.selectAccessibleBy || [],
            // image : data.imagePath
        }

		if(data.sections){
			payload.sections = data.sections
		}
		if(data.description){
			payload.description = data.description
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
		if(data.sections){
			updatePayload.sections = data.sections
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

    let projectRes = await createPayloadAndAssignProjectToUser(data)
    if (projectRes.error || !projectRes.data) {
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
        let updatePayload = {
            $addToSet: { accessibleBy: { $each: data.userIds } }
        }
        if (data.assignLead) {
            updatePayload = {
                $addToSet: { managedBy: { $each: data.userIds } }
            }
        }
        let projectRes = await Project.projectFindOneAndUpdate(payload, updatePayload)
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
    let projectRes = await createPayloadAndAssignProjectToUser(data)
    console.log('projectRes : ', projectRes)
    if (projectRes.error || !projectRes.data) {
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
    console.log('projectRes : ', projectRes)
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
    let projectRes = await createPayloadAndDeleteProject(data)
    if (projectRes.error) {
        return res.status(500).send(sendResponse(500, '', 'deleteProject', null, req.data.signature))
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
                updatedAt: new Date()
            }
        }
        let projectRes = await Project.projectFindOneAndUpdate(payload, updatePayload)
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

        if (!['SUPER_ADMIN','ADMIN'].includes(data.auth.role)) {
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
                $match: {
                    "isActive": true
                }
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
                                        // { $ne: ["$status", "COMPLETED"] },
                                        { $eq: ["$projectId", "$$projectId"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "tasks"
                }
            })
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
        pipeline.push(
            {
                $lookup: {
                    from: "users",
                    localField: "managedBy",
                    foreignField: "_id",
                    as: "managedBy"
                }
            }
        )
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
            isActive: true
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
            isActive: true
        }

		let sortCriteria = {
            createdAt: 1
        }
        
        let projectRes = await ProjectSections.getProjectSections(payload,{}, sortCriteria)
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
        return res.status(400).send(sendResponse(400, "", 'addNewProject', null, req.data.signature))
    }

    let projectSectionRes = await createPayloadAndAddProjectSection(data)
    if (projectSectionRes.error || !projectSectionRes.data) {
        return res.status(500).send(sendResponse(500, '', 'addNewProject', null, req.data.signature))
    }
	data.projectSections = [projectSectionRes.data._id]
	let projectRes = await createPayloadAndUpdateProjectSection(data)
    console.log('projectRes : ', projectRes)
    if (projectRes.error || !projectRes.data) {
        return res.status(500).send(sendResponse(500, '', 'addNewProject', null, req.data.signature))
    }
    return res.status(200).send(sendResponse(200, "Project's section Added Successfully", 'addNewProject', null, req.data.signature))
}
exports.addProjectSection = addProjectSection


const createPayloadAndAddProjectSection = async function (data) {
    try {
        let payload = {
            name: data.name
        }

		let options = {
			upsert: true,
			new: true,
			setDefaultsOnInsert: true
		}

		let updatePayload = {}
        let projectSectionRes = await ProjectSections.projectSectionFindOneAndUpdate(payload, updatePayload, options)
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
            _id: data.projectId
        }

		let projection = {}

		let populate = 'accessibleBy managedBy sections'

        let projectRes = await Project.findSpecificProject(payload, projection, populate)
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