let mongoose = require('./db');
const moment = require('moment');
let Schema = mongoose.Schema;

var minuteFromNow = function () {
    var timeObject = new Date();
    timeObject.setTime(timeObject.getTime() + 1000 * 60 * 60 * 6);
    return timeObject;
};

let passwordChangeSchema = new Schema({
    email: String,
    expiryTime: { type: Date, "default": minuteFromNow },
    isActive: Boolean,
    isExpired: {type:Boolean, default:false},
    ip: String,
    browser: String,
    device: String
},{ timestamps: true });

const ResetPasswords = mongoose.model('ResetPasswords', passwordChangeSchema);

module.exports = ResetPasswords;