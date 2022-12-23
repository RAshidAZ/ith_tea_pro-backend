let mongoose = require("./db");
let Schema = mongoose.Schema;

let tasksSchema = new Schema({
    title: String,
    description: String,
    status: {
        type: String,
        enum: {
            values: process.env.TASK_STATUS.split(","),  // ["NO_PROGRESS", "ONGOING", "COMPLETED", "ONHOLD"]
            message: "Status ENUM FAILED",
        }
    },
    category: {
        type: String,

    },
    projectId: {
        type: mongoose.Types.ObjectId,
        ref: "projects"
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref: "users"
    },
    assignedTo: {
        type: mongoose.Types.ObjectId,
        ref: "users"
    },
    comments: [
        {
            type: mongoose.Types.ObjectId,
            ref: "comments"
        }
    ],

    dueDate: Date,


    completedDate: Date,

    // isCompleted: {
    //     type: Boolean,
    //     default: false
    // },

    // inProgress: {
    //     type: Boolean,
    //     default: false
    // },

    // onHold: {
    //     type: Boolean,
    //     default: false
    // },

    priority: {
        type: String,
        enum: {
            values: process.env.TASK_PRIORITY.split(","),  // ["LOW", "REPEATED", "MEDIUM", "HIGH"]
            message: "Priority ENUM FAILED",
        }
    }
});

let tasks = mongoose.model("tasks", tasksSchema);
module.exports = tasks;
