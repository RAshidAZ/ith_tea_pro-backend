const Tasks = require('../models/tasks')

exports.insertUserTask = function (payload) {
    return Tasks.create(payload)
}

exports.updateUserTask = function (findPayload, updatePayload) {
    return Tasks.findOneAndUpdate(findPayload, updatePayload)
}
