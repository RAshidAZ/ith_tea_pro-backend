let mongoose = require("./db");
let Schema = mongoose.Schema;

let projectSectionSchema = new Schema({
    name: { type: String },
	projectId: {
        type: mongoose.Types.ObjectId,
        ref: "projects"
    },
    isActive: {
        type: Boolean,
        default: true
    },
	isArchived: {
        type: Boolean,
        default: false
    },
	isDeleted: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

let projectSections = mongoose.model("projectSections", projectSectionSchema);
module.exports = projectSections;
