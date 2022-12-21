const express = require('express');
const router = express.Router();


const { getProjectsAllUser, getAllProjects , addNewProject } = require('../controllers/project');

// router.get("/v1/user/", [], getUserRatingComment);

router.get("/v1/all", [], getAllProjects);
router.get("/v1/user/all", [], getProjectsAllUser);
router.post("/v1/add/new", [], addNewProject);




module.exports = router;

