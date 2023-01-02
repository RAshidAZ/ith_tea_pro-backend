const express = require('express');
const router = express.Router();


const { getProjectsAllUser, getAllProjects, addNewProject, editProject, assignUserToProject, getUserAssignedProjects, removeUserFromProject } = require('../controllers/project');

// router.get("/v1/user/", [], getUserRatingComment);

router.get("/v1/all", [], getAllProjects);
router.get("/v1/user/all", [], getProjectsAllUser);
router.post("/v1/add/new", [], addNewProject);
router.patch("/v1/edit", [], editProject);
router.patch("/v1/assign/users", [], assignUserToProject);
router.patch("/v1/remove/user", [], removeUserFromProject);
router.get("/v1/user/assigned", [], getUserAssignedProjects);




module.exports = router;

