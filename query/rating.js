
const Rating = require('../models/ratings')


exports.insertUserRating = async function (payload) {
    console.log("------------------------", payload)
    return Rating.create(payload)
}
exports.ratingFindOne = async function (payload, projection) {
    console.log("applyAggregateOnRating------------------------", payload)
    return Rating.findOne(payload, projection)
}
exports.applyAggregateOnRating = async function (payload) {
    console.log("applyAggregateOnRating------------------------", payload)
    return Rating.aggregate(payload)
}
exports.findCommentsForRatingId = async function (payload, projections) {
    console.log("findCommentsForRatingId------------------------", payload)
    return Rating.findOne(payload, projections).populate('comments comments.commentedBy')
}
exports.addCommnetIdInRatingById = async function (payload, updatePayload) {
    console.log("addCommnetIdInRatingById------------------------", payload, updatePayload)
    return Rating.findOneAndUpdate(payload, updatePayload)
}
exports.getAllUsersRatingForMonth = async function (payload) {
    console.log("getAllUsersRatingForMonth------------------------", payload)
    return Rating.aggregate(payload)
}
exports.ratingFindOneAndUpdate = async function (payload, updatePayload, options) {
    // console.log("ratingFindOneAndUpdate------------------------", payload, updatePayload)
    if(!options){
        options = {
            new:true
        }
    }
    return Rating.findOneAndUpdate(payload, updatePayload, options)
}