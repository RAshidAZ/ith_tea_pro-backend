const express = require('express');
const router = express.Router();


const { getAllUsers } = require('../controllers/user');

// router.get("/v1/user/", [], getUserRatingComment);

router.get("/v1/all/", [], getAllUsers);




module.exports = router;

