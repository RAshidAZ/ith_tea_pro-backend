let mongoose = require("./db");
let Schema = mongoose.Schema;

let actionSchema = new Schema({
    actionType: {
        type: String,
        enum: {
            values: process.env.ACTION_TYPE.split(","),  // ["TASK", "TASK_RATING", "PROJECTS"]
            message: "ACTION TYPE FAILED",
        }
    },
    actionTaken: {
        type: String,
        enum: {
            values: process.env.ACTION_TAKEN.split(","),  // ["RATING_CHANGED", "TASK_STATUS_CHANGE","TASK_DUE_DATE_CHANGE","PROJECT_NAME_CHANGED", "PROJECT_CATEGORY_CHANGED"]
            message: "ACTION TAKEN ENUM FAILED",
        }
    },
    actionBy: {
        type: mongoose.Types.ObjectId,
        ref: "users"
    },
    taskId: {
        type: mongoose.Types.ObjectId,
        ref: "tasks"
    },
    projectId: {
        type: mongoose.Types.ObjectId,
        ref: "projects"
    },
    addedUserId: {
        type: mongoose.Types.ObjectId,
        ref: "users"
    },
    
}, {
    timestamps: true
});
let actions = mongoose.model("actions", actionSchema);
module.exports = actions;
