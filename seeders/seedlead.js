const crypto = require("crypto");
const User = require("../models/users");
const ProjectSections = require("../models/projectSections");
const Credential = require("../models/credentials");
const salt = crypto.randomBytes(16).toString("base64");
const randomSalt = Buffer(salt, "base64");

let insertLeads = [
    {
        _id: "601e3c6ef5eb242d4408dcc7",
        name: "lead",
        email: "lead@ith.tech",
        accountId: "87654322",
        provider: "email",
        role: "LEAD",
        userName: "lead_seed",
        password: crypto
            .pbkdf2Sync("ld@ith", randomSalt, 10000, 64, "sha1")
            .toString("base64"),
        salt: salt,
        emailVerified: true,
        isActive: true,
        "department": "TECH",
        "designation": "TEA PRO LEAD",
        employeeId: "ITH2022184",
        "wings": "Backend"
    }
];

let seedLeads = () => {
    User.find({}, (err, resp) => {
        if (resp.length > 2) {
            return;
        } else {
            User.create(insertLeads, (err, response) => {
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
        userId: "601e3c6ef5eb242d4408dcc7",
        accountId: "87654322",
        // employeeId: "ITH2022180",
        provider: "email",
        userName: "lead_seed",
        password: crypto
            .pbkdf2Sync("ld@ith", randomSalt, 10000, 64, "sha1")
            .toString("base64"),
        salt: salt,
        emailVerified: true,
        isActive: true,
        isBlocked: false,
    }
];

let seedCredential = () => {
    Credential.find({}, (err, resp) => {
        if (resp.length > 2) {
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

let insertProjectSections = [
    {
        name: "Frontend"
    },
	{
        name: "Backend"
    },
	{
        name: "Adhoc"
    },
	{
        name: "Meeting"
    },
	{
        name: "R&D"
    },
	{
        name: "Interviews"
    },
	{
        name: "Random Task"
    },
	{
        name: "Task Allocation"
    }
];

let seedProjectSections = () => {
    ProjectSections.find({}, (err, resp) => {
        if (resp.length > 0) {
            return;
        } else {
            ProjectSections.create(insertProjectSections, (err, response) => {
                if (err) {
                    console.log(err);
                    console.error("Unable to create project sections");
                    // process.exit(0)
                    return;
                }
                console.log("Project sections created");
                // process.exit(0)
            });
        }
    });
};
seedLeads();
seedCredential();
seedProjectSections();
