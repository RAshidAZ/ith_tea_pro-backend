const express = require('express');
const router = express.Router();

const clients = {
    users: {
        host: process.env.SERVICE_RPC_HOST,
        port: process.env.SERVICE_RPC_PORT
    }
};
const data = {}
const authenticator = require('../middlewares/authenticator')(clients, data);
const authenticateRole = require("../middlewares/authenticateRole");
const filterProjects = require("../middlewares/filterProjectsForRoles")();

const { getProjectsAllUser, getAllProjects, removeUsersFromProject, getSpecificProjectUsersForRating, assignProjectsToUser, unassignProjectsToUser, getSpecificProjectLeads, getSpecificProjectUsers, getSpecificProject, addNewProject, editProject, archiveStatusSectionUpdate, deleteProject, deleteProjectSection, editProjectSection, archiveStatusProjectUpdate, assignUserToProject, getUserAssignedProjects, removeUserFromProject, getAllProjectsList, assignLeadToProject, removeLeadFromProject, getAllProjectSections, addProjectSection } = require('../controllers/project');
//Add new Project
router.post("/v1/add/new",
    [authenticator, authenticateRole(["ADMIN", "SUPER_ADMIN"])],
    addNewProject);

//Edit the Project
router.patch("/v1/edit",
    [authenticator, authenticateRole(["ADMIN", "SUPER_ADMIN"])],
    editProject);

// Get all Projects - For Projects Module
router.get("/v1/all",
    [authenticator, filterProjects],
    getAllProjects);

// Get specific Projects - For Projects Module
router.get("/v1/specific",
[authenticator, filterProjects],
getSpecificProject);

// get all users assigned to given projectId
router.get("/v1/user/all",
    [authenticator, filterProjects],
    getProjectsAllUser);

router.patch("/v1/delete", [authenticator, authenticateRole(["ADMIN", "SUPER_ADMIN"])], deleteProject);

//change project archive status
router.patch("/v1/update/archive", [authenticator, authenticateRole(["ADMIN", "SUPER_ADMIN"])], archiveStatusProjectUpdate);

//Assign Users to project
router.patch("/v1/assign/users",
    [authenticator, authenticateRole(["ADMIN", "SUPER_ADMIN"])],
    assignUserToProject);

//Assign Leads to project
router.patch("/v1/assign/leads",
    [authenticator, authenticateRole(["ADMIN", "SUPER_ADMIN"])],
    assignLeadToProject);

//Unassign Project
router.patch("/v1/remove/user",
    [authenticator, authenticateRole(["ADMIN", "SUPER_ADMIN"])],
    removeUserFromProject);

//Unassign Project from lead
router.patch("/v1/remove/lead",
    [authenticator, authenticateRole(["ADMIN", "SUPER_ADMIN"])],
    removeLeadFromProject);

//Get projects assigned to given userId
router.get("/v1/user/assigned",
    [authenticator],
    getUserAssignedProjects);

// Get Your Projects Listing ( Get Only Assigned Projects - Homepage )
router.get("/v1/list/assigned",
    [authenticator, filterProjects],
    getAllProjectsList);

//get all project categories	
router.get("/v1/categories",
    [authenticator, filterProjects],
	getAllProjectSections);

//Add new Project section/category
router.post("/v1/add/section",
[authenticator, authenticateRole(["ADMIN", "SUPER_ADMIN", "LEAD"])],
addProjectSection);

//edit Project section/category
router.patch("/v1/edit/section",
[authenticator, authenticateRole(["ADMIN", "SUPER_ADMIN", "LEAD"])],
editProjectSection);

//delete Project section/category
router.patch("/v1/delete/section",
[authenticator, authenticateRole(["ADMIN", "SUPER_ADMIN", "LEAD"])],
deleteProjectSection);

//update section archive status
router.patch("/v1/archive/section", 
[authenticator, authenticateRole(["ADMIN", "SUPER_ADMIN", "LEAD"])], 
archiveStatusSectionUpdate);

// Get specific Projects - For Projects Module
router.get("/v1/project/users",
[authenticator, filterProjects],
getSpecificProjectUsers);

// Get specific Projects lead list
router.get("/v1/project/leads",
[authenticator, filterProjects],
getSpecificProjectLeads);

//Assign projects to User
router.patch("/v1/assign/projects",
    [authenticator, authenticateRole(["ADMIN", "SUPER_ADMIN"])],
    assignProjectsToUser);

//unassign projects of User
router.patch("/v1/unassign/projects",
[authenticator, authenticateRole(["ADMIN", "SUPER_ADMIN"])],
unassignProjectsToUser);
module.exports = router;

//Unassign/remove users from a project
router.patch("/v1/remove/users",
    [authenticator, authenticateRole(["ADMIN", "SUPER_ADMIN"])],
    removeUsersFromProject);

// Get specific Projects - For Projects Module
router.get("/v1/project/users/for/rating",
[authenticator, authenticateRole(["ADMIN", "SUPER_ADMIN", 'LEAD']), filterProjects],
getSpecificProjectUsersForRating);