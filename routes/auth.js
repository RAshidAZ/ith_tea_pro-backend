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
const authenticateRole = require("../middlewares/authenticateRole");

const { getAllUsers, editUserDetails } = require('../controllers/user');
const Auth = require("../controllers/auth");

//roles from config
const role = JSON.parse(process.env.role)

// router.get("/v1/user/", [], getUserRatingComment);

router.get("/v1/all/", [], getAllUsers);
router.patch("/v1/edit/", [], editUserDetails);

//login
router.post("/v1/user/login", [], Auth.userLogin);

//resend password setup link email
router.post("/v1/resend/password/setup", 
[authenticator, authenticateRole([role.admin, role.superadmin, role.lead])], 
Auth.resendPasswordSetupLink);


//check setup password token
router.get("/v1/verify/token", [], Auth.verifyPasswordToken);

router.post("/v1/set/password", [], Auth.setPassword);


module.exports = router;

