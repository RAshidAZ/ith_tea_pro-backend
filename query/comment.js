
const Comments = require('../models/comments')

exports.insertComment = function (payload) {
    return Comments.create(payload)
}

exports.updateComment = function (findPayload, updatePayload, options = {}) {
    return Comments.findOneAndUpdate(findPayload, updatePayload, options)
}
