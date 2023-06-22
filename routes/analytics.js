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

const analytics = require('../controllers/analytics')

// Rating of the task by Rating Duration 
router.get("/v1/all/rating", [authenticator], analytics.getAllUsersRatingByRatingDuration);   

module.exports = router;