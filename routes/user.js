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

const { getAllUsers, editUserDetails, addNewUser, getUserDetailsByUserId, getAllLeadsLisitng, getAllUsersNonPaginated } = require('../controllers/user');

// router.get("/v1/user/", [], getUserRatingComment);

router.get("/v1/all/pagination", [authenticator], getAllUsers);

router.patch("/v1/edit", [authenticator, authenticateRole(["ADMIN", "SUPER_ADMIN", "USER", "INTERN",])], editUserDetails);
router.post("/v1/add", [authenticator, authenticateRole(["ADMIN", "SUPER_ADMIN"])], addNewUser);
router.get("/v1/userId", [authenticator], getUserDetailsByUserId);

router.get("/v1/leads/list", [], getAllLeadsLisitng);

router.get("/v1/list", [authenticator], getAllUsersNonPaginated);



module.exports = router;

