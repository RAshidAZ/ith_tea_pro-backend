const express = require('express');
const router = express.Router();


const { getUserRatingComment, insertUserRatingComment } = require('../controllers/comment');

// router.get("/v1/user/", [], getUserRatingComment);

router.post("/v1/user/insert", [], insertUserRatingComment);




module.exports = router;

