const { sendResponse } = require('../helpers/sendResponse');
const queryController = require('../query')
const { Comments } = queryController;

const ratingController = require('./rating');
const { addCommentIdInTaskById } = require('./task');
const { addCommnetIdInRatingById, createPayloadAndGetComments } = ratingController;

const getCommentsOnRating = async (req, res, next) => {
    let data = req.data;
    if (!data.ratingId) {
        return res.status(400).send(sendResponse(400, "", 'getCommentsOnRating', null, req.data.signature))
    }
    let commentRes = await createPayloadAndGetComments(data)
    if (commentRes.error) {
        return res.status(500).send(sendResponse(500, '', 'getCommentsOnRating', null, req.data.signature))
    }
    return res.status(200).send(sendResponse(200, 'Comments Fetched', 'insertUserRatingComment', commentRes.data, req.data.signature))


}
exports.getCommentsOnRating = getCommentsOnRating;



const insertUserRatingComment = async (req, res, next) => {
    let data = req.data;

    if (!data.ratingId || !data.comment) {
        return res.status(400).send(sendResponse(400, "", 'insertUserRatingComment', null, req.data.signature))
    }
    data.givenBy = data.auth.id 
    let commentRes = await createPayloadAndInsertComment(data)
    if (commentRes.error || !commentRes.data) {
        return res.status(500).send(sendResponse(500, '', 'insertUserRatingComment', null, req.data.signature))
    }
    data.commentId = commentRes.data._id
    // console.log(addCommnetIdInRatingById , typeof addCommnetIdInRatingById)
    let ratingRes = await addCommnetIdInRatingById(data)
    if (ratingRes.error || !ratingRes.data) {
        return res.status(500).send(sendResponse(500, '', 'insertUserRatingComment', null, req.data.signature))
    }
    return res.status(200).send(sendResponse(200, 'Comment Inserted', 'insertUserRatingComment', null, req.data.signature))
}
exports.insertUserRatingComment = insertUserRatingComment


const createPayloadAndInsertComment = async function (data) {
    try {
        let payload = {
            commentedBy: data.givenBy,
            editHistory: [{ previousComment: '' }],
            taggedUsers: data.taggedUsers,
            comment: data.comment
        }
        let commentRes = await Comments.insertRatingComment(payload)
        return { data: commentRes, error: false }
    } catch (err) {
        console.log("createPayloadAndInsertComment Error : ", err)
        return { data: err, error: true }
    }
}
exports.createPayloadAndInsertComment = createPayloadAndInsertComment


const insertUserTaskComment = async (req, res, next) => {
    let data = req.data;

    if (!data.taskId || !data.comment) {
        return res.status(400).send(sendResponse(400, "", 'insertUserTaskComment', null, req.data.signature))
    }
    data.givenBy = data.auth.id 

    let commentRes = await createPayloadAndInsertComment(data)
    console.log('commentRes : ', commentRes)
    if (commentRes.error || !commentRes.data) {
        return res.status(500).send(sendResponse(500, '', 'insertUserTaskComment', null, req.data.signature))
    }
    data.commentId = commentRes.data._id
    // console.log(addCommnetIdInRatingById , typeof addCommnetIdInRatingById)
    let taskRes = await addCommentIdInTaskById(data)
    if (taskRes.error || !taskRes.data) {
        return res.status(500).send(sendResponse(500, '', 'insertUserTaskComment', null, req.data.signature))
    }
    return res.status(200).send(sendResponse(200, 'Comment Inserted', 'insertUserTaskComment', null, req.data.signature))
}
exports.insertUserTaskComment = insertUserTaskComment

//update comment
const editComment = async (req, res, next) => {
    let data = req.data;
    if (!data.commentId) {
        return res.status(400).send(sendResponse(400, "", 'editComment', null, req.data.signature))
    }
    let commentRes = await createPayloadAndUpdateComment(data)
    if (commentRes.error) {
        return res.status(500).send(sendResponse(500, '', 'editComment', null, req.data.signature))
    }
    return res.status(200).send(sendResponse(200, 'Comment updated', 'editComment', commentRes.data, req.data.signature))


}
exports.editComment = editComment;

const createPayloadAndUpdateComment = async function (data) {
    try {
        let findData = {
			_id : data.commentId
        }
		
		let updatePayload = {}
		if(data.comment){
			updatePayload.comment = data.comment
		}
		if(data.taggedUsers){
			updatePayload.taggedUsers = data.taggedUsers
		}
		let options = { new : true }
        let commentRes = await Comments.updateComment(findData, updatePayload, options)
        return { data: commentRes, error: false }
    } catch (err) {
        console.log("createPayloadAndUpdateComment Error : ", err)
        return { data: err, error: true }
    }
}