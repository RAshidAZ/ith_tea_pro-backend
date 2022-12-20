
const Rating = require('../models/ratings')


exports.insertUserRating = async function (payload) {
    console.log("------------------------", payload)
    return Rating.create(payload)
}
exports.findUserRatingGivenDate = async function (payload, projections) {
    console.log("findUserRatingGivenDate------------------------", payload)
    return Rating.findOne(payload, projections)
}
exports.addCommnetIdInRatingById = async function (payload, updatePayload) {
    console.log("addCommnetIdInRatingById------------------------", payload, updatePayload)
    return Rating.findOneAndUpdate(payload, updatePayload)
}