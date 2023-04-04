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

const { getProjectsAllUser, getAllProjects, removeUsersFromProject, assignProjectsToUser, unassignProjectsToUser, getSpecificProjectLeads, getSpecificProjectUsers, getSpecificProject, addNewProject, editProject, archiveStatusSectionUpdate, deleteProject, deleteProjectSection, editProjectSection, archiveStatusProjectUpdate, assignUserToProject, getUserAssignedProjects, removeUserFromProject, getAllProjectsList, assignLeadToProject, removeLeadFromProject, getAllProjectSections, addProjectSection } = require('../controllers/project');

//roles from config
const role = JSON.parse(process.env.role)

//Add new Project
router.post("/v1/add/new",
    [authenticator, authenticateRole([role.admin, role.superadmin])],
    addNewProject);

//Edit the Project
router.patch("/v1/edit",
    [authenticator, authenticateRole([role.admin, role.superadmin])],
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

router.patch("/v1/delete", [authenticator, authenticateRole([role.admin, role.superadmin])], deleteProject);

//change project archive status
router.patch("/v1/update/archive", [authenticator, authenticateRole([role.admin, role.superadmin, role.lead])], archiveStatusProjectUpdate);

//Assign Users to project
router.patch("/v1/assign/users",
    [authenticator, authenticateRole([role.admin, role.superadmin])],
    assignUserToProject);

//Assign Leads to project
router.patch("/v1/assign/leads",
    [authenticator, authenticateRole([role.admin, role.superadmin])],
    assignLeadToProject);

//Unassign Project
router.patch("/v1/remove/user",
    [authenticator, authenticateRole([role.admin, role.superadmin])],
    removeUserFromProject);

//Unassign Project from lead
router.patch("/v1/remove/lead",
    [authenticator, authenticateRole([role.admin, role.superadmin])],
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
[authenticator, authenticateRole([role.admin, role.superadmin, role.lead])],
addProjectSection);

//edit Project section/category
router.patch("/v1/edit/section",
[authenticator, authenticateRole([role.admin, role.superadmin, role.lead])],
editProjectSection);

//delete Project section/category
router.patch("/v1/delete/section",
[authenticator, authenticateRole([role.admin, role.superadmin, role.lead])],
deleteProjectSection);

//update section archive status
router.patch("/v1/archive/section", 
[authenticator, authenticateRole([role.admin, role.superadmin, role.lead])], 
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
    [authenticator, authenticateRole([role.admin, role.superadmin])],
    assignProjectsToUser);

//unassign projects of User
router.patch("/v1/unassign/projects",
[authenticator, authenticateRole([role.admin, role.superadmin])],
unassignProjectsToUser);
module.exports = router;

//Unassign/remove users from a project
router.patch("/v1/remove/users",
    [authenticator, authenticateRole([role.admin, role.superadmin])],
    removeUsersFromProject);
