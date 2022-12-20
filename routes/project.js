const express = require('express');
const router = express.Router();


const { getProjectsAllUser, getAllProjects } = require('../controllers/project');

// router.get("/v1/user/", [], getUserRatingComment);

router.get("/v1/all", [], getAllProjects);
router.get("/v1/user/all", [], getProjectsAllUser);




module.exports = router;

