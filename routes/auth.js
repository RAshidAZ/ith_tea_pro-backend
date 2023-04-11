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

// router.get("/v1/user/", [], getUserRatingComment);

router.get("/v1/all/", [], getAllUsers);
router.patch("/v1/edit/", [], editUserDetails);

//login
router.post("/v1/user/login", [], Auth.userLogin);

//resend password setup link email
router.post("/v1/resend/password/setup", 
[authenticator, authenticateRole(["ADMIN", "SUPER_ADMIN"])], 
Auth.resendPasswordSetupLink);


//check setup password token
router.get("/v1/verify/token", [], Auth.verifyPasswordToken);

router.post("/v1/set/password", [], Auth.setPassword);

//forgot password request
router.post("/v1/user/forgot/password", [], Auth.forgotPassword);

//forgot password verify otp
router.post("/v1/otp/verify/forgot/password", [], Auth.otpVerify);

//change password
router.post("/v1/user/forgot/change/password", [], Auth.forgotChangePassword);

//resend otp for forgot password
// router.post("/v1/resend/forgot/password/otp", [], Auth.setPassword);

//reset password
router.patch("/v1/user/reset/password",
    [authenticator],
    Auth.resetPassword);


module.exports = router;

