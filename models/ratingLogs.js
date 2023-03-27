let mongoose = require("./db");
let Schema = mongoose.Schema;

let ratingLogSchema = new Schema({
    actionTaken: {
        type: String
    },
    actionBy: {
        type: mongoose.Types.ObjectId,
        ref: "users"
    },

	userId: {
        type: mongoose.Types.ObjectId,
        ref: "users"
    },
    taskId: {
        type: mongoose.Types.ObjectId,
        ref: "tasks"
    },
	ratingId: {
        type: mongoose.Types.ObjectId,
        ref: "ratings"
    },
	previous: { type: Object },
	new : { type: Object }
    
}, {
    timestamps: true
});
let ratinglogs = mongoose.model("ratinglogs", ratingLogSchema);
module.exports = ratinglogs;
