const express = require('express');
const router = express.Router();


const { getCommentsOnRating, insertUserRatingComment } = require('../controllers/comment');

router.get("/v1/rating/", [], getCommentsOnRating);

router.post("/v1/user/insert", [], insertUserRatingComment);




module.exports = router;

