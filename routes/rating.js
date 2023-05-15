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
const filterProjects = require("../middlewares/filterProjectsForRoles")();

const rating = require('../controllers/rating')

router.get("/v1/user/", [authenticator], rating.getUserRating);

router.post("/v1/user/insert", [authenticator], rating.insertUserRating);

router.patch("/v1/user/update", [authenticator], rating.updateUserRating);


router.get("/v1/month/all/user", 
[authenticator, filterProjects], 
rating.getMonthAllUserRating);

router.get("/v1/week/rating", [authenticator], rating.getWeekRating);   

// Rating of the task by date  
router.get("/v1/day/rating", [authenticator], rating.getRatingByDate);   

module.exports = router;

