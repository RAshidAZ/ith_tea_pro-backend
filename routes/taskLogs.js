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

const { getTaskLogs } = require('../controllers/taskLogs');

router.get("/v1/get", [authenticator], getTaskLogs);

module.exports = router;
