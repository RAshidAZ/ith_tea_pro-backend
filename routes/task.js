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


const { editUserTask, insertUserTask, getGroupByTasks, getTaskDetailsByTaskId, getTaskStatusAnalytics, getTaskList, rateUserTask, getTasksByProjectId, deleteTask, getTaskListWithPendingRating, getTaskListToRate } = require('../controllers/task');


//Insert task
router.post("/v1/user/insert",
    [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", "LEAD", "CONTRIBUTOR", "INTERN"]), filterProjects],
    insertUserTask);

//edit task
router.patch("/v1/edit",
    [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", "LEAD", "CONTRIBUTOR", "INTERN"]), filterProjects],
    editUserTask);

// Task Listing Main API
router.get("/v1/groupby",
    [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", "LEAD", "CONTRIBUTOR", "INTERN"])],
    getGroupByTasks);

router.get("/v1/by/taskId", [authenticator], getTaskDetailsByTaskId);

router.get("/v1/status/analytics", [authenticator], getTaskStatusAnalytics);


/*Get task list for homepage - According to role : SA/A(All tasks), User( Task assigned,createdby and Of Its assigned Project ), Lead (Assigned Projects) 
*/
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
    [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", "LEAD"]), filterProjects],
    getTaskListToRate);
    
/**Insert Task Rating */
router.post("/v1/rate",
    [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", "LEAD"]), filterProjects],
    rateUserTask);


//Delete task API
router.patch("/v1/delete",
    [authenticator, authenticateRole(["SUPER_ADMIN", "ADMIN", "LEAD", "CONTRIBUTOR", "INTERN"]), filterProjects],
    deleteTask);

/**Get all Tasks by projectId */
router.get("/v1/all/of/project",
    [authenticator, filterProjects],
    getTasksByProjectId);
    
module.exports = router;

