
const Comments = require('../models/comments')

exports.insertRatingComment = function (payload) {
    return Comments.create(payload)
}

exports.updateRatingComment = function (findPayload, updatePayload) {
    return Comments.findOneAndUpdate(findPayload, updatePayload)
}
