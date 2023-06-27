let mongoose = require("./db");
let Schema = mongoose.Schema;

let ratingSchema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "users"
    },
    rating: {
        type: Number,
        min: 0,
        default: -1
    },
    comments: [
        {
            type: mongoose.Types.ObjectId,
            ref: "comments"
        }
    ],
    isDelayedRated:{
        type:Boolean,
        default:false  
    },
    taskIds: [
        {
            type: mongoose.Types.ObjectId,
            ref: "tasks"
        }
    ],
    date: Number,
    month: Number,
    year: Number,
	dueDate: Date
}, { timestamps: true })

// We need to create a model using it
let ratings = mongoose.model("ratings", ratingSchema);

module.exports = ratings;