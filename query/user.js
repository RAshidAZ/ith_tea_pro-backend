const Users = require('../models/users')

exports.insertUser = function (payload) {
    return Users.create(payload)
}

exports.getAllUsers = function (findPayload, projection) {
    return Users.find(findPayload, projection)
}
