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

const { getProjectsAllUser, getAllProjects, addNewProject, editProject, deleteProject, assignUserToProject, getUserAssignedProjects, removeUserFromProject } = require('../controllers/project');

// router.get("/v1/user/", [], getUserRatingComment);

router.get("/v1/all", [authenticator], getAllProjects);
router.get("/v1/user/all", [authenticator], getProjectsAllUser);
router.post("/v1/add/new", [authenticator], addNewProject);
router.patch("/v1/edit", [authenticator], editProject);
router.patch("/v1/delete", [authenticator], deleteProject);
router.patch("/v1/assign/users", [authenticator], assignUserToProject);
router.patch("/v1/remove/user", [authenticator], removeUserFromProject);
router.get("/v1/user/assigned", [authenticator], getUserAssignedProjects);




module.exports = router;

