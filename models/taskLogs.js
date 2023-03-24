let mongoose = require("./db");
let Schema = mongoose.Schema;

let taskLogSchema = new Schema({
    actionTaken: {
        type: String,
        // enum: {
        //     values: process.env.ACTION_TAKEN.split(","),  // ["RATING_CHANGED", "TASK_STATUS_CHANGE","TASK_DUE_DATE_CHANGE","PROJECT_NAME_CHANGED", "PROJECT_CATEGORY_CHANGED"]
        //     message: "ACTION TAKEN ENUM FAILED",
        // }
    },
    actionBy: {
        type: mongoose.Types.ObjectId,
        ref: "users"
    },
    taskId: {
        type: mongoose.Types.ObjectId,
        ref: "tasks"
    }
    
}, {
    timestamps: true
});
let tasklogs = mongoose.model("tasklogs", taskLogSchema);
module.exports = tasklogs;
