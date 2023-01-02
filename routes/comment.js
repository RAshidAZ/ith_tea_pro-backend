const express = require('express');
const router = express.Router();


const { getCommentsOnRating, insertUserRatingComment, insertUserTaskComment } = require('../controllers/comment');

router.get("/v1/rating/", [], getCommentsOnRating);

router.post("/v1/user/insert", [], insertUserRatingComment);

router.post("/v1/user/task/insert", [], insertUserTaskComment);




module.exports = router;

