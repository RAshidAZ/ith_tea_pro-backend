const Users = require('../models/users')
const Credentials = require("../models/credentials");
const PasswordSetup = require("../models/passwordSetup");
const ResetPassword = require("../models/resetPassword");
const OtpLogs = require("../models/otpLog");

exports.findUser = function (payload) {
    return Users.findOne(payload).exec()
}

exports.findAndUpdateUser = function (findData, updateData, options) {
    return Users.findOneAndUpdate(findData, updateData, options)
}

exports.findUserCredentials = function (payload) {
    return Credentials.findOne(payload).populate("userId").exec()
}

exports.addPasswordSetupToken = async function (payload) {
    console.log("PasswordSetup------------------------", payload)
    return PasswordSetup.create(payload)
}

exports.findPasswordSetupToken = function (payload) {
    return PasswordSetup.findOne(payload).exec()
}

exports.findPasswordSetupTokens = function (payload) {
    return PasswordSetup.find(payload).exec()
}

exports.createResetPaswordRequest = async function (payload) {
    console.log("ResetPassword------------------------", payload)
    return ResetPassword.create(payload)
}

exports.findOtpLog = function (payload) {
    return OtpLogs.findOne(payload).exec()
}

exports.createOtpLog = async function (payload) {
    return OtpLogs.create(payload)
}

exports.findAndUpdateOtpLog = function (findData, updateData) {
    return OtpLogs.findOneAndUpdate(findData, updateData)
}