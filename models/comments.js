let mongoose = require("./db");
let Schema = mongoose.Schema;

let commentSchema = new Schema({
    commentedBy: {
        type: mongoose.Types.ObjectId,
        ref: "users"
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    editHistory: [
        {
            timestamp: {
                type: Date,
                default: Date.now
            },
            previousComment: String
        }
    ],
    taggedUsers: [
        {
            type: mongoose.Types.ObjectId,
            ref: "users"
        }
    ],
    comment: String

});

let comments = mongoose.model("comments", commentSchema);
module.exports = comments;
