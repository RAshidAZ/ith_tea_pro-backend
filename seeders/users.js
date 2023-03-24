const crypto = require("crypto");
const User = require("../models/users");
const Credential = require("../models/credentials");
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
            .pbkdf2Sync("sa@ith", randomSalt, 10000, 64, "sha1")
            .toString("base64"),
        salt: salt,
        emailVerified: true,
		profileCompleted : true,
        isActive: true,
        "department": "TECH",
        "designation": "TEA PRO SUPERADMIN",
        employeeId: "ITH2022181",
        "wings": "Backend"
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
            .pbkdf2Sync("ad@ith", randomSalt, 10000, 64, "sha1")
            .toString("base64"),
        salt: salt,
        emailVerified: true,
		profileCompleted : true,
        isActive: true,
        "department": "TECH",
        "designation": "TEA PRO ADMIN",
        employeeId: "ITH2022182",
        "wings": "Backend"
    }
];

let seedUsers = () => {
    User.find({}, (err, resp) => {
        if (resp.length > 0) {
			console.log("=======already")
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

let insertCreds = [
    {
        userId: "601e3c6ef5eb242d4408dcc5",
        accountId: "12345678",
        // employeeId: "ITH2022180",
        provider: "email",
        userName: "super_admin_seed",
        password: crypto
            .pbkdf2Sync("sa@ith", randomSalt, 10000, 64, "sha1")
            .toString("base64"),
        salt: salt,
        emailVerified: true,
        isActive: true,
        isBlocked: false,
    },
	{
        userId: "601e3c6ef5eb242d4408dcc6",
        accountId: "11223344",
        // employeeId: "ITH2022180",
        provider: "email",
        userName: "admin_seed",
        password: crypto
            .pbkdf2Sync("ad@ith", randomSalt, 10000, 64, "sha1")
            .toString("base64"),
        salt: salt,
        emailVerified: true,
        isActive: true,
        isBlocked: false,
    }
];

let seedCredential = () => {
    Credential.find({}, (err, resp) => {
        if (resp.length > 0) {
            return;
        } else {
            Credential.create(insertCreds, (err, response) => {
                if (err) {
                    console.log(err);
                    console.error("Unable to create Credential");
                    // process.exit(0)
                    return;
                }
                console.log("Credential Created");
                // process.exit(0)
            });
        }
    });
};
seedUsers();
seedCredential()
