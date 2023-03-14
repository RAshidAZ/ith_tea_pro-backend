const Credentials = require('../models/credentials')

exports.createCredentials = function (findData, updateData, options) {
    return Credentials.findOneAndUpdate(findData, updateData, options)
}
exports.findOneQuery = function (findPayload, projection) {
    return Credentials.findOne(findPayload, projection)
}
exports.findQuery = async function (findPayload, projection, populate) {
    if (!populate) {
        populate = ""
    }
    console.log("findData => ", findPayload)
    return Credentials.find(findPayload, projection).populate(populate);
}
exports.findDistinctQuery = function (findPayload) {
    return Credentials.distinct(findPayload)
}