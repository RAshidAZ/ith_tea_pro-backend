const { sendResponse } = require('../helpers/sendResponse');
const queryController = require('../query')
const { Comments } = queryController;

const ratingController = require('./rating')
const { addCommnetIdInRatingById } = ratingController;

// const getUserRatingComment = async (req, res, next) => {
//     let data = req.data;
//     console.log('insertUserRatingComment data : ', req.data);

// }
// exports.getUserRatingComment = getUserRatingComment;


const insertUserRatingComment = async (req, res, next) => {
    let data = req.data;
    console.log('insertUserRatingComment data : ', req.data);

    if (!data.ratingId || !data.comment) {
        return res.status(400).send(sendResponse(400, "", 'insertUserRatingComment', null, req.data.signature))
    }
    //TODO: Change after auth is updated
    // data.givenBy = data.auth.id 
    data.givenBy = "601e3c6ef5eb242d4408dcc8"

    let commentRes = await createPayloadAndInsertComment(data)
    console.log('commentRes : ', commentRes)
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

