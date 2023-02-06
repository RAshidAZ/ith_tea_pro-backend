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

const { getAllUsers, editUserDetails, addNewUser, getUserDetailsByUserId } = require('../controllers/user');

// router.get("/v1/user/", [], getUserRatingComment);

router.get("/v1/all/", [authenticator], getAllUsers);
router.patch("/v1/edit/", [authenticator], editUserDetails);
router.post("/v1/add/", [authenticator], addNewUser);
router.get("/v1/userId", [authenticator], getUserDetailsByUserId);





module.exports = router;

