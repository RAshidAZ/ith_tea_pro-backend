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


const { editUserTask, insertUserTask, getGroupByTasks, getTaskDetailsByTaskId, getTaskStatusAnalytics } = require('../controllers/task');

// router.get("/v1/user/", [], getUserRatingComment);

router.post("/v1/user/insert", [authenticator], insertUserTask);
router.patch("/v1/edit", [authenticator], editUserTask);
router.get("/v1/groupby", [authenticator], getGroupByTasks);
router.get("/v1/by/taskId", [authenticator], getTaskDetailsByTaskId);
router.get("/v1/status/analytics", [authenticator], getTaskStatusAnalytics);




module.exports = router;

