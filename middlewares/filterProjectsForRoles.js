require("../config/index");

const Users = require("../models/users");
const Projects = require("../models/projects");

module.exports = function () {

    return async function (req, res, next) {

        let role = req.data.auth.role;
        console.log("Data in middle ware....", role)
        if (!["SUPER_ADMIN"].includes(role)) {

            let allProjectsAssigned = [];
            if (role == "LEAD" || role == 'ADMIN') {
                allProjectsAssigned = await Projects.distinct("_id", { managedBy: req.data.auth.id, isDeleted : false })
            } else {
                allProjectsAssigned = await Projects.distinct("_id", { accessibleBy: req.data.auth.id, isDeleted : false })
            }
            if (allProjectsAssigned.error) {
                console.log(allProjectsAssigned.error);
                var response = {
                    success: false,
                    message: 'Something Went Wrong'
                };
                return res.status(500).send(response);
            }
            allProjectsAssigned = allProjectsAssigned.map(e => e.toString());

            let projectsToFilter = [];
            if (req.query?.projectId) {
                projectsToFilter.push(req.query.projectId);
            }
            if (req.params?.projectId) {
                projectsToFilter.push(req.params.projectId)
            }
            if (req.body?.projectId) {
                projectsToFilter.push(req.body?.projectId);
            }
            if (req.query?.projectIds) {
                projectsToFilter.push(...req.query?.projectId);
            }
            if (req.body?.projectIds) {
                projectsToFilter.push(...req.body?.projectId);
            }

            if (projectsToFilter && projectsToFilter.length) {

                projectsToFilter = projectsToFilter.map(e => e.toString());
                if (!(projectsToFilter.every(projectToCheck => allProjectsAssigned.includes(projectToCheck)))) {
                    var response = {
                        success: false,
                        message: 'Unauthorized for this project'
                    };
                    return res.status(400).send(response);
                } else {
                    req.data.filteredProjects = allProjectsAssigned;
                    next();
                }
            }
            else {
                req.data.filteredProjects = allProjectsAssigned;
                next();
            }
        } else {
            next();
        }
    }
}