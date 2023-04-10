let mongoose = require("./db");
let Schema = mongoose.Schema;

var minuteFromNow = function () {
    var timeObject = new Date();
    timeObject.setTime(timeObject.getTime() + 1000 * 60 * 60 * 6);
    return timeObject;
};

let otpLogSchema = new Schema({
    email: String,
    otp: String,
    otpExpiration: { type: Date, default: minuteFromNow },
    ip: String,
    browser: String,
    device: String,
    purpose: String,
    isExpired: {type:Boolean, default:false},
    isUsed: {type:Boolean, default:false},
	tokenVerified: {type:Boolean, default:false},

}, {timestamps : true});

const otpLog = mongoose.model('otplogs', otpLogSchema);

module.exports = otpLog;