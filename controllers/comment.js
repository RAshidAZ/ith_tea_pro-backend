

const { sendResponse } = require('../helpers/sendResponse')
const { Rating, Comments } = require('../query')


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