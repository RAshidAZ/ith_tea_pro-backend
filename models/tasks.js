let mongoose = require("./db");
let Schema = mongoose.Schema;

let tasksSchema = new Schema({
    title: String,
    description: String,
    status: {
        type: String,
        enum: {
            values: process.env.TASK_STATUS.split(","),  // ["NOT_STARTED", "ONGOING", "COMPLETED", "ONHOLD"]
            message: "Status ENUM FAILED",
        },
        default: "NOT_STARTED"
    },
    section: {
		type: mongoose.Types.ObjectId,
        ref: "projectSections"
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
    lead: [
        {
            type: mongoose.Types.ObjectId,
            ref: "users"
        }
    ],
    priority: {
        type: String,
        enum: {
            values: process.env.TASK_PRIORITY.split(","),  // ["LOW", "REPEATED", "MEDIUM", "HIGH"]
            message: "Priority ENUM FAILED",
        }
    },
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

    isRated: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },

    givenBy: {
        type: mongoose.Types.ObjectId,
        ref: "users"
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    ratingComments: [
        {
            type: mongoose.Types.ObjectId,
            ref: "comments"
        }
    ],

}, {
    timestamps: true
});

let tasks = mongoose.model("tasks", tasksSchema);
module.exports = tasks;
