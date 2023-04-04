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


const { editUserTask, insertUserTask, getGroupByTasks, getOverDueTasks, getTaskDetailsByTaskId, getTaskStatusAnalytics, getTodayTasksList,  getTaskList, rateUserTask, getTasksByProjectId, deleteTask, getTaskListWithPendingRating, getTaskListToRate, updateTaskStatus, commentUserTask, getUserTaskComments } = require('../controllers/task');

//roles from config
const role = JSON.parse(process.env.role)

//Insert task
router.post("/v1/user/insert",
    [authenticator, authenticateRole([role.admin, role.superadmin, role.lead, role.contributor, role.intern]), filterProjects],
    insertUserTask);

//edit task
router.patch("/v1/edit",
    [authenticator, authenticateRole([role.admin, role.superadmin, role.lead, role.contributor, role.intern]), filterProjects],
    editUserTask);

// Task Listing Main API
router.get("/v1/groupby",
    [authenticator, authenticateRole([role.admin, role.superadmin, role.lead, role.contributor, role.intern]), filterProjects],
    getGroupByTasks);

router.get("/v1/by/taskId", 
[authenticator], 
getTaskDetailsByTaskId);

router.get("/v1/overdue/tasks", 
[authenticator, authenticateRole([role.admin, role.superadmin])], 
getOverDueTasks);

router.get("/v1/status/analytics", [authenticator], getTaskStatusAnalytics);


/*Get task list for homepage - According to role : SA/A(All tasks), User( Task assigned,createdby and Of Its assigned Project ), Lead (Assigned Projects) 
*/
//for my work
router.get("/v1/list/homepage",
    [authenticator, filterProjects],
    getTaskList)

/*Get task list for homepage - According to role : SA/A(All tasks), User( Task assigned,createdby and Of Its assigned Project ), Lead (Assigned Projects) 
*/
router.get("/v1/list/pending/rating",
    [authenticator, filterProjects],
    getTaskListWithPendingRating)

/**Get Task by projectId && userId for a given Date */
router.get("/v1/list/for/rating",
    [authenticator, authenticateRole([role.admin, role.superadmin, role.lead]), filterProjects],
    getTaskListToRate);
    
/**Insert Task Rating */
router.post("/v1/rate",
    [authenticator, authenticateRole([role.admin, role.superadmin, role.lead]), filterProjects],
    rateUserTask);


//Delete task API
router.patch("/v1/delete",
    [authenticator, authenticateRole([role.admin, role.superadmin, role.lead, role.contributor, role.intern]), filterProjects],
    deleteTask);

//update task status
router.patch("/v1/update/status",
    [authenticator, authenticateRole([role.admin, role.superadmin, role.lead, role.contributor, role.intern]), filterProjects],
    updateTaskStatus);

/**Get all Tasks by projectId */
router.get("/v1/all/of/project",
    [authenticator, filterProjects],
    getTasksByProjectId);

/**Insert Task comment */
router.post("/v1/add/comment",
    [authenticator, authenticateRole([role.admin, role.superadmin, role.lead, role.contributor, role.intern]), filterProjects],
    commentUserTask);

/**Get comments of taks and rating of user for given date*/
router.get("/v1/comments",
    [authenticator],
    getUserTaskComments);
module.exports = router;

//get today tasks list for team work
router.get("/v1/get/today/tasks",
    [authenticator, authenticateRole([role.admin, role.superadmin, role.lead]), filterProjects],
    getTodayTasksList)
