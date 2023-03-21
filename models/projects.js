let mongoose = require("./db");
let Schema = mongoose.Schema;

let projectsSchema = new Schema({
    name: {
        type: String,
        unique: true
    },
    image: String,
    description: String,
	status: {
        type: String,
        enum: {
            values: process.env.PROJECT_STATUS.split(","),  // ["COMPLETED", "ONGOING", "UPCOMING"]
            message: "Status ENUM FAILED",
        },
        default: "ONGOING"
    },
    sections: [{
        type: mongoose.Types.ObjectId,
        ref: "projectSections"
    }],
    managedBy: [{
        type: mongoose.Types.ObjectId,
        ref: "users"
    }],
    accessibleBy: [{
        type: mongoose.Types.ObjectId,
        ref: "users"
    }],
	isActive: {
        type: Boolean,
        default: true
    },
	isDeleted: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

let projects = mongoose.model("projects", projectsSchema);
module.exports = projects;
