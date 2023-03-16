let mongoose = require("./db");
let Schema = mongoose.Schema;

let projectLogSchema = new Schema({
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
let projectlogs = mongoose.model("projectlogs", projectLogSchema);
module.exports = projectlogs;
