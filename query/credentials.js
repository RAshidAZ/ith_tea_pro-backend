const Credentials = require('../models/credentials')

exports.createCredentials = function (findData, updateData, options) {
    return Credentials.findOneAndUpdate(findData, updateData, options)
}