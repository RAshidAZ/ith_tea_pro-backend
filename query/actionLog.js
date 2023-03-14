const ActionLog = require('../models/actions');

exports.insertActionLog = function (payload) {
    return ActionLog.create(payload);
}