const Projects = require('../models/projects')


exports.findInProjects = async function (payload, projection) {
    console.log("------------------------", payload)
    return Projects.find(payload, projection)
}
exports.getAllProjects = async function (payload, projection, sortCriteria, populate) {
    if (!sortCriteria) {
        sortCriteria = { createdAt: -1 }
    }
	if (!populate) {
        populate = 'accessibleBy managedBy'
    }
    console.log("------------------------", payload, sortCriteria)
    return Projects.find(payload, projection).populate(populate).sort(sortCriteria)
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
    if (!projection) {
        projection = {}
    }
    if (!populate) {
        populate = ""
    }
    return Projects.findOne(payload, projection).populate(populate);
}

exports.updateMany = async function (payload, updatePayload) {
    console.log("assignProjectToMultipleUsers------------------------", payload, updatePayload)
    return Projects.updateMany(payload, updatePayload)
}

exports.distinctProjects = async function (field, payload) {
    console.log("distinctProjects------------------------", payload, field)
    return Projects.distinct(field, payload)
}

exports.projectPopulate = function (res, populate) {
    return Projects.populate(res, populate)
}

exports.updateProjects = async function (payload, updatePayload) {
    console.log("updateProjects------------------------", payload)
    return Projects.updateMany(payload, updatePayload, {multi : true})
}