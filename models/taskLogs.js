let mongoose = require("./db");
let Schema = mongoose.Schema;

let taskLogSchema = new Schema({
    actionTaken: {
        type: String
    },
    actionBy: {
        type: mongoose.Types.ObjectId,
        ref: "users"
    },
    taskId: {
        type: mongoose.Types.ObjectId,
        ref: "tasks"
    },
	commentId: {
        type: mongoose.Types.ObjectId,
        ref: "comments"
    },
	previous: { 
		title: { type: String },
		description: { type: String },
		section: {
			type: mongoose.Types.ObjectId,
			ref: "projectSections"
		},
		assignedTo: {
			type: mongoose.Types.ObjectId,
			ref: "users"
		},
		status: { type: String },
		dueDate: { type: Date },
		completedDate : { type: Date },
		priority: { type: String }
	},
	new : { 
		title: { type: String },
		description: { type: String },
		section: {
			type: mongoose.Types.ObjectId,
			ref: "projectSections"
		},
		assignedTo: {
			type: mongoose.Types.ObjectId,
			ref: "users"
		},
		status: { type: String },
		dueDate: { type: Date },
		completedDate : { type: Date },
		priority: { type: String } 
	}
    
}, {
    timestamps: true
});
let tasklogs = mongoose.model("tasklogs", taskLogSchema);
module.exports = tasklogs;
