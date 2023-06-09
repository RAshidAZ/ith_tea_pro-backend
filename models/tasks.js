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

    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedBy: {
        type: mongoose.Types.ObjectId,
        ref: "users"
    },
    isDelayedVerified: {
        type: Boolean,
        default: false
    },
    verificationComments: [
        {
            type: mongoose.Types.ObjectId,
            ref: "comments"
        }
    ],

    ratingAllowed: {
        type: Boolean,
        default: false
    },
    
	isDelayTask: {
        type: Boolean,
        default: false
    },
    isReOpen:{
        type: Boolean,
        default: false
    },

    miscType: String,

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

	isDeleted: {
        type: Boolean,
        default: false
    },

    defaultTaskTime:{
        type: Object
    },

	timeTaken: {
        type: Number,
        default:0
    }

}, {
    timestamps: true
});

let tasks = mongoose.model("tasks", tasksSchema);
module.exports = tasks;
