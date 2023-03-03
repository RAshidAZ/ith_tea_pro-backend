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

const { editUserTask, insertUserTask, getGroupByTasks, getTaskDetailsByTaskId, getTaskStatusAnalytics, userGetTaskListForHomePage, rateUserTask, getTasksByProjectId } = require('../controllers/task');

// router.get("/v1/user/", [], getUserRatingComment);

router.post("/v1/user/insert", [authenticator], insertUserTask);
router.patch("/v1/edit", [authenticator], editUserTask);
router.get("/v1/groupby", [], getGroupByTasks);
router.get("/v1/by/taskId", [authenticator], getTaskDetailsByTaskId);
router.get("/v1/status/analytics", [authenticator], getTaskStatusAnalytics);


router.get("/v1/task/list/homepage", [], userGetTaskListForHomePage)

/**Insert Task Rating */
router.post("/v1/rate", [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", "LEAD"])], rateUserTask);

/**Get Task byProjectId */
router.get("/v1/by/projectId",
    // [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", "LEAD", "USER", "INTERN"])],
    getTasksByProjectId);



module.exports = router;

