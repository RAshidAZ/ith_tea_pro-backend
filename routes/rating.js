const express = require('express');
const router = express.Router();


const rating = require('../controllers/rating')

router.get("/v1/user/", [], rating.getUserRating);




module.exports = router;

