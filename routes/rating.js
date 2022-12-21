const express = require('express');
const router = express.Router();


const rating = require('../controllers/rating')

router.get("/v1/user/", [], rating.getUserRating);

router.post("/v1/user/insert", [], rating.insertUserRating);

router.get("/v1/month/all/user", [], rating.getMonthAllUserRating);




module.exports = router;

