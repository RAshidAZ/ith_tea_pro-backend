const { sendResponse } = require('../helpers/sendResponse');
const queryController = require('../query')
const { Project } = queryController;

const ratingController = require('./rating')
const { addCommnetIdInRatingById } = ratingController;

const getAllProjects = async (req, res, next) => {
    let data = req.data;

    let projectRes = await createPayloadAndgetAllProjects(data)
    console.log('projectRes : ', projectRes)
    if (projectRes.error || !projectRes.data) {
        return res.status(500).send(sendResponse(500, '', 'getAllProjects', null, req.data.signature))
    }
    return res.status(200).send(sendResponse(200, 'Projects Fetched', 'getAllProjects', projectRes.data, req.data.signature))
}
exports.getAllProjects = getAllProjects


const createPayloadAndgetAllProjects = async function (data) {
    try {
        let payload = {
        }
        let projection = {
            managedBy: 0,
            // accessibleBy: 0,
        }
        let projectRes = await Project.getAllProjects(payload, projection)
        return { data: projectRes, error: false }
    } catch (err) {
        console.log("createPayloadAndgetAllProjects Error : ", err)
        return { data: err, error: true }
    }
}
exports.createPayloadAndgetAllProjects = createPayloadAndgetAllProjects;


const getProjectsAllUser = async (req, res, next) => {
    let data = req.data;
    if (!data.projectId) {
        return res.status(400).send(sendResponse(400, "", 'getProjectsAllUser', null, req.data.signature))
    }

    let projectRes = await createPayloadAndGetProjectsAllUser(data)
    console.log('projectRes : ', projectRes)
    if (projectRes.error || !projectRes.data) {
        return res.status(500).send(sendResponse(500, '', 'getProjectsAllUser', null, req.data.signature))
    }
    let projectUsers = projectRes.data.length ? projectRes.data[0].accessibleBy : []
    return res.status(200).send(sendResponse(200, "Project's User Fetched", 'getProjectsAllUser', projectUsers, req.data.signature))
}
exports.getProjectsAllUser = getProjectsAllUser


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

const addNewProject = async (req, res, next) => {
    let data = req.data;
    if (!data.name || !data.categories || !data.managedBy || !data.description) {
        return res.status(400).send(sendResponse(400, "", 'addNewProject', null, req.data.signature))
    }

    let projectRes = await createPayloadAndAddProject(data)
    console.log('projectRes : ', projectRes)
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
            categories: data.categories,
            managedBy: data.managedBy,
            accessibleBy: data.accessibleBy,
            description: data.description,
            // image : data.imagePath
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
    if (!data.projectId || !data.name || !data.categories || !data.description) {
        return res.status(400).send(sendResponse(400, "", 'editProject', null, req.data.signature))
    }

    let projectRes = await createPayloadAndEditProject(data)
    console.log('projectRes : ', projectRes)
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
            categories: data.categories,
            description: data.description,
        }
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
    console.log('projectRes : ', projectRes)
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
        let projectRes = await Project.assignProjectToMultipleUsers(payload, updatePayload)
        return { data: projectRes, error: false }
    } catch (err) {
        console.log("createPayloadAndEditProject Error : ", err)
        return { data: err, error: true }
    }
}
exports.createPayloadAndEditProject = createPayloadAndEditProject

