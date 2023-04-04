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

const { getCommentsOnRating, insertUserRatingComment, insertUserTaskComment, editComment } = require('../controllers/comment');

router.get("/v1/rating/", [authenticator], getCommentsOnRating);

router.post("/v1/user/insert", [authenticator], insertUserRatingComment);

router.post("/v1/user/task/insert", [authenticator], insertUserTaskComment);

router.patch("/v1/update",
    [authenticator],
    editComment);

module.exports = router;

