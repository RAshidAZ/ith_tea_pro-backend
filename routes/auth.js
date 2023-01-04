const express = require('express');
const router = express.Router();
const clients = {
    users: {
        host: process.env.SERVICE_RPC_HOST,
        port: process.env.SERVICE_RPC_PORT
    }
};
const data={}
const authenticator = require('../middlewares/authenticator')(clients, data);

const { getAllUsers, editUserDetails } = require('../controllers/user');
const Auth = require("../controllers/auth");

// router.get("/v1/user/", [], getUserRatingComment);

router.get("/v1/all/", [], getAllUsers);
router.patch("/v1/edit/", [], editUserDetails);

router.post("/v1/user/login", [], Auth.userLogin);


module.exports = router;

