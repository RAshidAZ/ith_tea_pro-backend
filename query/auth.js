const Users = require('../models/users')
const Credentials = require("../models/credentials");

exports.findUser = function (payload) {
    return Users.findOne(payload).exec()
}

exports.findAndUpdateUser = function (findData, updateData, options) {
    return Users.findOneAndUpdate(findData, updateData, options)
}

exports.findUserCredentials = function (payload) {
    return Credentials.findOne(payload).populate("userId").exec()
}