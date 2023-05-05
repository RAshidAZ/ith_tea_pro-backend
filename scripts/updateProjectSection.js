require('../config/index');
const ProjectSections = require('../models/projectSections')
const projectsQuery = require('../query/project')

let updateProjectSection = async () => {

    let paylaod = {}

    let project_id = await projectsQuery.findInProjects(paylaod)

    for (const obj of project_id) {
        let projectId = obj._id
        if (projectId) {
            const newDocumentCreateOnProjectAdd = new ProjectSections({

                name: process.env.DEFAULT_SECTION,
                projectId: projectId
            }
            );
            await newDocumentCreateOnProjectAdd.save();
        }
    }
}

updateProjectSection()