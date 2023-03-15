let mongoose = require("./db");
let Schema = mongoose.Schema;

let projectSectionSchema = new Schema({
    name: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

let projectSections = mongoose.model("projectSections", projectSectionSchema);
module.exports = projectSections;
