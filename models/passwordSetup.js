let mongoose = require("./db");
let Schema = mongoose.Schema;

var minuteFromNow = function () {
    var timeObject = new Date();
    timeObject.setTime(timeObject.getTime() + 1000 * 60 * 60 * 24 * 2);
    return timeObject;
};

// create a schema
let passwordSetupSchema = new Schema(
    {
        token: String,
		email : String,
        userId: {
            type: mongoose.Types.ObjectId,
            ref: "users"
        },
		tokenExpiration: { type: Date, default: minuteFromNow },
		isExpired: {type:Boolean, default:false},
        isActive: { type: Boolean, default: true },
		tokenVerified: {type:Boolean, default:false}
    },
    { timestamps: true }
);

// We need to create a model using it
let passwordsetup = mongoose.model("passwordsetup", passwordSetupSchema);

module.exports = passwordsetup;
