const ProjectSections = require('../models/projectSections')


exports.findInProjects = async function (payload, projection) {
    console.log("------------------------", payload)
    return ProjectSections.find(payload, projection)
}

exports.findSection = async function (payload) {
    console.log("------------------------", payload)
    return ProjectSections.findOne(payload)
}

exports.getAllProjects = async function (payload, projection, sortCriteria) {
    if (!sortCriteria) {
        sortCriteria = { createdAt: -1 }
    }
    console.log("------------------------", payload, sortCriteria)
    return ProjectSections.find(payload, projection).populate('accessibleBy managedBy').sort(sortCriteria)
}

exports.getProjectSections = async function (payload, projection, sortCriteria) {
    if (!sortCriteria) {
        sortCriteria = { createdAt: -1 }
    }
	if (!projection) {
        projection = { }
    }
    console.log("------------------------", payload, sortCriteria)
    return ProjectSections.find(payload, projection).populate('projectId').sort(sortCriteria)
}

exports.getProjectsAllUser = async function (payload, projection) {
    console.log("------------------------", payload)
    return ProjectSections.find(payload, projection).populate('accessibleBy managedBy')
}

exports.projectSectionFindOneAndUpdate = async function (payload, updatePayload, options = {}) {
    console.log("addNewProjectSection------------------------", payload)
    return ProjectSections.findOneAndUpdate(payload,updatePayload, options)
}

exports.createProjectSection = async function (payload) {
    console.log("createProjectSection------------------------", payload)
    return ProjectSections.create(payload)
}

exports.updateMany = async function (payload, updatePayload) {
    console.log("assignProjectToMultipleUsers------------------------", payload, updatePayload)
    return ProjectSections.updateMany(payload, updatePayload)
}

exports.distinctProjects = async function (field, payload) {
    console.log("distinctProjects------------------------", payload, field)
    return ProjectSections.distinct(field, payload)
}