let mongoose = require("./db");
let Schema = mongoose.Schema;

let projectsSchema = new Schema({
    name: {
        type: String,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    image: String,
    description: String,
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
    }]
}, {
    timestamps: true
});

let projects = mongoose.model("projects", projectsSchema);
module.exports = projects;
