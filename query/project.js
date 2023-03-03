const Projects = require('../models/projects')


exports.findInProjects = async function (payload, projection) {
    console.log("------------------------", payload)
    return Projects.find(payload, projection)
}
exports.getAllProjects = async function (payload, projection) {
    console.log("------------------------", payload)
    return Projects.find(payload, projection).populate('accessibleBy managedBy')
}

exports.getProjectsAllUser = async function (payload, projection) {
    console.log("------------------------", payload)
    return Projects.find(payload, projection).populate('accessibleBy managedBy')
}

exports.addNewProject = async function (payload,) {
    console.log("addNewProject------------------------", payload)
    return Projects.create(payload)
}

exports.editProjectDetails = async function (payload, updatePayload) {
    console.log("editProjectDetails------------------------", payload)
    return Projects.findOneAndUpdate(payload, updatePayload)
}
exports.projectFindOneAndUpdate = async function (payload, updatePayload) {
    console.log("assignProjectToMultipleUsers------------------------", payload, updatePayload)
    return Projects.findOneAndUpdate(payload, updatePayload)
}

exports.projectAggregate = async function (pipeline) {
    return Projects.aggregate(pipeline)
}

exports.findSpecificProject = async function (payload, projection, populate) {
    if(!projection){
        projection = {}
    }
    return Projects.findOne(payload, projection).populate(populate);
}