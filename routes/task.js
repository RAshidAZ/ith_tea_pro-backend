const express = require('express');
const router = express.Router();


const { editUserTask, insertUserTask, getGroupByTasks, getTaskDetailsByTaskId, getTaskStatusAnalytics } = require('../controllers/task');

// router.get("/v1/user/", [], getUserRatingComment);

router.post("/v1/user/insert", [], insertUserTask);
router.patch("/v1/edit", [], editUserTask);
router.get("/v1/groupby", [], getGroupByTasks);
router.get("/v1/by/taskId", [], getTaskDetailsByTaskId);
router.get("/v1/status/analytics", [], getTaskStatusAnalytics);




module.exports = router;

