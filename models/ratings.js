let mongoose = require("./db");
let Schema = mongoose.Schema;

let ratingSchema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "users"
    },
    givenBy: {
        type: mongoose.Types.ObjectId,
        ref: "users"
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: -1
    },
    comments: [
        {
            type: mongoose.Types.ObjectId,
            ref: "comments"
        }
    ],
    date: Number,
    month: Number,
    year: Number
}, { timestamps: true })

// We need to create a model using it
let ratings = mongoose.model("ratings", ratingSchema);

module.exports = ratings;