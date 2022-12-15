const crypto = require("crypto");
const User = require("../models/users");
const salt = crypto.randomBytes(16).toString("base64");
const randomSalt = Buffer(salt, "base64");

let insertUser = [
    {
        _id: "601e3c6ef5eb242d4408dcc5",
        name: "superadmin",
        email: "superadmin@ith.tech",
        accountId: "12345678",
        provider: "email",
        role: "SUPER_ADMIN",
        userName: "super_admin_seed",
        password: crypto
            .pbkdf2Sync("123456789", randomSalt, 10000, 64, "sha1")
            .toString("base64"),
        salt: salt,
        emailVerified: true,
        isActive: true,
    },
    {
        _id: "601e3c6ef5eb242d4408dcc6",
        name: "admin",
        email: "admin@ith.tech",
        accountId: "11223344",
        provider: "email",
        role: "ADMIN",
        userName: "admin_seed",
        password: crypto
            .pbkdf2Sync("123456789", randomSalt, 10000, 64, "sha1")
            .toString("base64"),
        salt: salt,
        emailVerified: true,
        isActive: true,
    },
    {
        _id: "601e3c6ef5eb242d4408dcc7",
        name: "user",
        email: "user@ith.tech",
        accountId: "87654321",
        provider: "email",
        role: "USER",
        userName: "user_seed",
        password: crypto
            .pbkdf2Sync("123456789", randomSalt, 10000, 64, "sha1")
            .toString("base64"),
        salt: salt,
        emailVerified: true,
        isActive: true,
    },
    {
        _id: "601e3c6ef5eb242d4408dcc8",
        name: "lead",
        email: "lead@ith.tech",
        accountId: "87654322",
        provider: "email",
        role: "LEAD",
        userName: "lead_seed",
        password: crypto
            .pbkdf2Sync("123456789", randomSalt, 10000, 64, "sha1")
            .toString("base64"),
        salt: salt,
        emailVerified: true,
        isActive: true,
    },
];

let seedUsers = () => {
    User.find({}, (err, resp) => {
        if (resp.length > 0) {
            return;
        } else {
            User.create(insertUser, (err, response) => {
                if (err) {
                    console.log(err);
                    console.error("Unable to create user");
                    // process.exit(0)
                    return;
                }
                console.log("User Created");
                // process.exit(0)
            });
        }
    });
};
seedUsers();

