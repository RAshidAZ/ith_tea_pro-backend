const express = require('express');
const router = express.Router();
module.exports = router;

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



const {getTaskListToVerify, getTodayTasksListByUserId, verfiyUserTask, reopenUserTask, exportDataToExcel, editUserTask, insertUserTask, getGroupByTasks, getOverDueTasks, getTaskDetailsByTaskId, getTeamTasksCountReport, getTaskStatusAnalytics, getTodayTasksList, getTaskList, verifyUserTask, getTasksByProjectId, deleteTask, getTaskListWithPendingRating, getTaskListToRate, updateTaskStatus, commentUserTask, getUserTaskComments, getTeamTasksList } = require('../controllers/task');


//Insert task
router.post("/v1/user/insert", [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", "LEAD", "CONTRIBUTOR"]), filterProjects], insertUserTask);

//edit task
router.patch("/v1/edit", [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", "LEAD", "CONTRIBUTOR"]), filterProjects], editUserTask);

router.post("/v1/reopen", [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", "LEAD"]), filterProjects], reopenUserTask);

// Task Listing Main API
router.get("/v1/groupby", [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", "LEAD", "CONTRIBUTOR", "INTERN"]), filterProjects], getGroupByTasks);

router.get("/v1/by/taskId", [authenticator], getTaskDetailsByTaskId);

router.get("/v1/overdue/tasks", [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN"]), filterProjects], getOverDueTasks);

router.get("/v1/user/tasks", [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN"]), filterProjects], getTodayTasksListByUserId);

router.get("/v1/status/analytics", [authenticator], getTaskStatusAnalytics);

/*Get task list for homepage - According to role : SA/A(All tasks), User( Task assigned,createdby and Of Its assigned Project ), Lead (Assigned Projects) 
*/
//for my work
router.get("/v1/list/homepage", [authenticator, filterProjects], getTaskList)

/*Get task list for homepage - According to role : SA/A(All tasks), User( Task assigned,createdby and Of Its assigned Project ), Lead (Assigned Projects) 
*/
router.get("/v1/list/pending/rating", [authenticator, filterProjects], getTaskListWithPendingRating)

/**Get Task by projectId && userId for a given Date */

// router.get("/v1/list/for/rating", [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", "LEAD"]), filterProjects], getTaskListToRate);
router.get("/v1/list/for/rating", [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", "LEAD"]), filterProjects], getTaskListToVerify);

/**Insert Task Rating */
router.post("/v1/verify", [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", "LEAD"]), filterProjects], verifyUserTask);

//Delete task API
router.patch("/v1/delete", [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", "LEAD", "CONTRIBUTOR"]), filterProjects], deleteTask);

//update task status
router.patch("/v1/update/status", [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", "LEAD", "CONTRIBUTOR"]), filterProjects], updateTaskStatus);

/**Get all Tasks by projectId */
router.get("/v1/all/of/project", [authenticator, filterProjects], getTasksByProjectId);

/**Insert Task comment */
router.post("/v1/add/comment", [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", "LEAD", "CONTRIBUTOR", "INTERN", "GUEST"]), filterProjects], commentUserTask);

/**Get comments of taks and rating of user for given date*/
router.get("/v1/comments", [authenticator], getUserTaskComments);

//get today tasks list for team work
router.get("/v1/get/today/tasks", [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", 'LEAD', 'GUEST']), filterProjects], getTodayTasksList)

// get team-member tasks list
router.get("/v1/get/team/task", [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", 'LEAD']), filterProjects], getTeamTasksList)

// get team-member tasks count
router.get("/v1/get/team/task/count", [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", 'LEAD']), filterProjects], getTeamTasksCountReport)

router.get("/v1/downloadExcel", [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", 'LEAD']), filterProjects], exportDataToExcel)

module.exports = router;
