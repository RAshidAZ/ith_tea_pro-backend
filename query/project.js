const Projects = require('../models/projects')


exports.getAllProjects = async function (payload, projection) {
    console.log("------------------------", payload)
    return Projects.find(payload, projection)
}

exports.getProjectsAllUser = async function (payload, projection) {
    console.log("------------------------", payload)
    return Projects.find(payload, projection).populate('accessibleBy')
}
