const express = require('express');
const router = express.Router();


const { getAllUsers, editUserDetails } = require('../controllers/user');

// router.get("/v1/user/", [], getUserRatingComment);

router.get("/v1/all/", [], getAllUsers);
router.patch("/v1/edit/", [], editUserDetails);




module.exports = router;

