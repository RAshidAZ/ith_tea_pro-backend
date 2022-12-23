const Project = require("../models/projects");

let insertProjects = [
    {
        _id: "601e3c6ef5eb242d4408dcd5",
        name: "CEX-MM",
        isActive: true,
        categories: ["Adhoc", "Backend", "Frontend", "Strategy"],
        managedBy: ["601e3c6ef5eb242d4408dcc5", "601e3c6ef5eb242d4408dcc8"],
        accessibleBy: ["601e3c6ef5eb242d4408dcc7", "601e3c6ef5eb242d4408dcc6"]
    },
    {
        _id: "601e3c6ef5eb242d4408dcd7",
        name: "OSHODHARA",
        isActive: true,
        categories: ["Adhoc", "Backend", "Frontend"],
        managedBy: ["601e3c6ef5eb242d4408dcc5", "601e3c6ef5eb242d4408dcc8"],
        accessibleBy: ["601e3c6ef5eb242d4408dcc7", "601e3c6ef5eb242d4408dcc6"]
    },
];

let seedProjects = () => {
    Project.find({}, (err, resp) => {
        if (resp.length > 0) {
            return;
        } else {
            Project.create(insertProjects, (err, response) => {
                if (err) {
                    console.log(err);
                    console.error("Unable to create Project");
                    // process.exit(0)
                    return;
                }
                console.log("Project Created");
                // process.exit(0)
            });
        }
    });
};


seedProjects();
