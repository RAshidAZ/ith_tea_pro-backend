let mongoose = require("./db");
let Schema = mongoose.Schema;

let actionSchema = new Schema({
    actionType: {
        type: String,
        enum: {
            values: process.env.ACTION_TYPE.split(","),  // ["TASK", "RATING"]
            message: "ACTION TYPE FAILED",
        }
    },
    actionTaken: {
        type: String,
        enum: {
            values: process.env.ACTION_TAKEN.split(","),  // ["RATING_CHANGED", "TASK_STATUS_CHANGE","TASK_DUE_DATE_CHANGE"]
            message: "ACTION TAKEN ENUM FAILED",
        }
    },
    actionBy: {
        type: mongoose.Types.ObjectId,
        ref: "users"
    },
    actionFor: {
        type: mongoose.Types.ObjectId,
        ref: "users"
    },
    ratingId: {
        type: mongoose.Types.ObjectId,
        ref: "ratings"
    },
    taskId: {
        type: mongoose.Types.ObjectId,
        ref: "tasks"
    },
    projectId: {
        type: mongoose.Types.ObjectId,
        ref: "tasks"
    },
    
}, {
    timestamps: true
});
let actions = mongoose.model("actions", actionSchema);
module.exports = actions;
