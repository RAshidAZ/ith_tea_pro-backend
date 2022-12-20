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
    return res.status(200).send(sendResponse(200, 'Comment Inserted', 'getAllProjects', projectRes.data, req.data.signature))
}
exports.getAllProjects = getAllProjects


const createPayloadAndgetAllProjects = async function (data) {
    try {
        let payload = {
        }
        let projection = {
            managedBy: 0,
            accessibleBy: 0,
        }
        let projectRes = await Project.getAllProjects(payload, projection)
        return { data: projectRes, error: false }
    } catch (err) {
        console.log("createPayloadAndgetAllProjects Error : ", err)
        return { data: err, error: true }
    }
}
exports.createPayloadAndgetAllProjects = createPayloadAndgetAllProjects


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
exports.createPayloadAndGetProjectsAllUser = createPayloadAndGetProjectsAllUser

