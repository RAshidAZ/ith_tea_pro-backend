let mongoose = require("./db");
let Schema = mongoose.Schema;

let tasksSchema = new Schema({
    title: String,
    description: String,
    status: {
        type: String,
        enum: {
            values: process.env.TASK_STATUS.split(","),  // ["NOT_STARTED", "ONGOING", "COMPLETED", "CLOSED", "ONHOLD"]
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

    isRated: {
        type: Boolean,
        default: false
    },
	isDelayTask: {
        type: Boolean,
        default: false
    },
	isDelayRated: {
        type: Boolean,
        default: false
    },
	ratingAllowed: {
        type: Boolean,
        default: true
    },
    miscType: String,
    rating: {
        type: Number,
        min: 0,
        max: 5,                      //to be increased as per requirement
        default: 0
    },

    givenBy: {
        type: mongoose.Types.ObjectId,              //for user that give rating
        ref: "users"
    },
	attachments: [
        {
            type: String
        }
    ],
    isDeleted: {
        type: Boolean,
        default: false
    },
	isArchived: {
        type: Boolean,
        default: false
    },
    ratingComments: [
        {
            type: mongoose.Types.ObjectId,
            ref: "comments"
        }
    ],
	isDeleted: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

let tasks = mongoose.model("tasks", tasksSchema);
module.exports = tasks;
