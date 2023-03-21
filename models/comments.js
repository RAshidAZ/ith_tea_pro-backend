let mongoose = require("./db");
let Schema = mongoose.Schema;

let commentSchema = new Schema({
	type: {
        type: String,
        enum: {
            values: process.env.COMMENT_TYPE.split(","),  // ["NOT_STARTED", "ONGOING", "COMPLETED", "CLOSED", "ONHOLD"]
            message: "Type ENUM FAILED",
        }
    },
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

}, {
    timestamps: true
});

let comments = mongoose.model("comments", commentSchema);
module.exports = comments;
