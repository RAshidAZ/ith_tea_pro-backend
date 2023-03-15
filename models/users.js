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
        department: String,
        wings: { type: String },
		dob : Date,
        designation: String,
        employeeId: String,
		passwordToken: String,
		profileCompleted : {
			type: Boolean,
			default: false
		},
        role: {
            type: String,
            enum: {
                values: process.env.ROLE.split(","), // ["CONTRIBUTOR", "SUPER_ADMIN", "ADMIN", "LEAD", "INTERN"]
                message: "ROLE ENUM FAILED",
            },
            default: "CONTRIBUTOR",
        },
        githubLink: String,
        linkedInLink: String,
        facebookLink: String,
        twitterLink: String,
    },
    { timestamps: true }
);

// We need to create a model using it
let users = mongoose.model("users", userSchema);

module.exports = users;
