const express = require('express');
const router = express.Router();


const { editUserTask, insertUserTask } = require('../controllers/task');

// router.get("/v1/user/", [], getUserRatingComment);

router.post("/v1/user/insert", [], insertUserTask);
router.patch("/v1/edit", [], editUserTask);




module.exports = router;

