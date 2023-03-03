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
const authenticateRole  = require("../middlewares/authenticateRole");

const { getProjectsAllUser, getAllProjects, addNewProject, editProject, deleteProject, assignUserToProject, getUserAssignedProjects, removeUserFromProject, getAllProjectsList } = require('../controllers/project');

// router.get("/v1/user/", [], getUserRatingComment);

router.get("/v1/all", [authenticator], getAllProjects);
router.get("/v1/user/all", [authenticator], getProjectsAllUser);
router.post("/v1/add/new", [authenticator,authenticateRole(["ADMIN", "SUPER_ADMIN"])], addNewProject);
router.patch("/v1/edit", [authenticator], editProject);
router.patch("/v1/delete", [authenticator], deleteProject);
router.patch("/v1/assign/users", [authenticator], assignUserToProject);
router.patch("/v1/remove/user", [authenticator], removeUserFromProject);
router.get("/v1/user/assigned", [authenticator], getUserAssignedProjects);

// Get Projects Listing
router.get("/v1/list", [authenticator], getAllProjectsList);



module.exports = router;

