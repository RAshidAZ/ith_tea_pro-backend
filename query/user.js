const Users = require('../models/users')

exports.insertUser = function (payload) {
    return Users.create(payload)
}

exports.getAllUsers = function (findPayload, projection, sortCriteria) {
    if (sortCriteria) {
        return Users.find(findPayload, projection).sort(sortCriteria)
    } else {
        return Users.find(findPayload, projection)
    }
}

exports.editUserDetails = function (findPayload, updatePayload) {
    return Users.findOneAndUpdate(findPayload, updatePayload)
}

exports.userfindOneQuery = function (findPayload, projection) {
    return Users.findOne(findPayload, projection)
}

exports.getAllUsersPagination = function (findPayload, projection, sort, skip, limit) {
    console.log("----", skip, limit)
    return Users.find(findPayload, projection)
        .sort(sort)
        .skip(skip)
        .limit(limit)
}

exports.getAllUsersCountForPagination = function (findPayload) {
    return Users.countDocuments(findPayload)
}

exports.getAllUsersRatingForMonth = async function (payload) {
    console.log("getAllUsersRatingForMonth------------------------", payload)
    return Users.aggregate(payload)
}