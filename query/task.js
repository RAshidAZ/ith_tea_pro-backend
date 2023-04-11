const Tasks = require('../models/tasks')

exports.insertUserTask = function (payload) {
    return Tasks.create(payload)
}

exports.findOneAndUpdate = function (findPayload, updatePayload,options) {
    return Tasks.findOneAndUpdate(findPayload, updatePayload, options)
}
exports.taskAggregate = function (aggregate) {
    return Tasks.aggregate(aggregate)
}
exports.taskPopulate = function (res, populate) {
    return Tasks.populate(res, populate)
}
exports.taskFindOneQuery = function (findData, projection, populate) {
    return Tasks.findOne(findData, projection).populate(populate)
}
exports.taskFindQuery = function (findData, projection, populate, sortCriteria = {}) {
    return Tasks.find(findData, projection).populate(populate).sort(sortCriteria)
}

exports.taskCount = function (findData) {
    return Tasks.countDocuments(findData)
}

exports.updateMany = async function (payload, updatePayload) {
    return Tasks.updateMany(payload, updatePayload)
}
