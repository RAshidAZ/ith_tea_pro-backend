let mongoose = require("./db");
let Schema = mongoose.Schema;

let projectsSchema = new Schema({
    name: {
        type: String,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    categories: [{
        type: String
    }],
    managedBy: [{
        type: mongoose.Types.ObjectId,
        ref: "users"
    }],
    accessibleBy: [{
        type: mongoose.Types.ObjectId,
        ref: "users"
    }]
});

let projects = mongoose.model("projects", projectsSchema);
module.exports = projects;
