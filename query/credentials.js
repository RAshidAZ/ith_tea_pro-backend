const Credentials = require('../models/credentials')

exports.createCredentials = function (findData, updateData, options) {
    return Credentials.findOneAndUpdate(findData, updateData, options)
}
exports.findOneQuery = function (findPayload, projection) {
    return Credentials.findOne(findPayload, projection)
}
exports.findQuery = function (findPayload, projection) {
    return Credentials.find(findPayload, projection)
}
exports.findDistinctQuery = function (findPayload) {
    return Credentials.distinct(findPayload)
}