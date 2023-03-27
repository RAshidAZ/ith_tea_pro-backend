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

const { getProjectLogs } = require('../controllers/projectLogs');

router.get("/v1/get", [authenticator], getProjectLogs);

module.exports = router;
