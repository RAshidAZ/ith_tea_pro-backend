let mongoose = require("./db");
let Schema = mongoose.Schema;

let commentSchema = new Schema({
    commentedBy: {
        type: mongoose.Types.ObjectId,
        ref: "users"
    },
    taskId: {
        type: mongoose.Types.ObjectId,
        ref: "tasks"
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
    ratingId: {
        type: mongoose.Types.ObjectId,
        ref: "ratings"
    },
    comment: String

});

let comments = mongoose.model("comments", commentSchema);
module.exports = comments;
