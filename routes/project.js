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

const { getProjectsAllUser, getAllProjects, addNewProject, editProject, deleteProject, assignUserToProject, getUserAssignedProjects, removeUserFromProject, getAllProjectsList, assignLeadToProject, removeLeadFromProject, getAllProjectCategories } = require('../controllers/project');

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

// get all users assigned to given projectId
router.get("/v1/user/all",
    [authenticator, filterProjects],
    getProjectsAllUser);

router.patch("/v1/delete", [authenticator], deleteProject);

//Assign Users to project
router.patch("/v1/assign/users",
    [authenticator, authenticateRole(["ADMIN", "SUPER_ADMIN"])],
    assignUserToProject);

//Assign Leads to project
router.patch("/v1/assign/lead",
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
	getAllProjectCategories);


module.exports = router;

