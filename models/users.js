let mongoose = require("./db");
let Schema = mongoose.Schema;

// create a schema
let userSchema = new Schema(
    {
        name: String,
        profilePicture: String,
        email: { type: String, unique: true, lowercase: true },
        provider: {
            type: String,
            default: "email",
        },
        role: {
            type: String,
            enum: {
                values: process.env.ROLE.split(","), // ["USER", "SUPER_ADMIN", "ADMIN", "LEAD"]
                message: "ROLE ENUM FAILED",
            },
            default: "USER",
        },
        githubLink : String,
        linkedInLink : String,
    },
    { timestamps: true }
);

// We need to create a model using it
let users = mongoose.model("users", userSchema);

module.exports = users;