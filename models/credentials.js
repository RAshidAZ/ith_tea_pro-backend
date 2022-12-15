let mongoose = require("./db");
let Schema = mongoose.Schema;

// create a schema
let credentialsSchema = new Schema(
    {
        accountId: Number,
        password: String,
        salt: String,
        userId: {
            type: mongoose.Types.ObjectId,
            ref: "users"
        },
        emailVerified: { type: Boolean, default: false },
        isActive: { type: Boolean, default: false },
        isBlocked: { type: Boolean, default: false },
        employeeId: String
    },
    { timestamps: true }
);

// We need to create a model using it
let credentials = mongoose.model("credentials", credentialsSchema);

module.exports = credentials;
