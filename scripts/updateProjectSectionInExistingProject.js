require('../config/index');
const ProjectsQuery = require('../query/project')
const ProjectSectionsQuery = require('../query/projectSections')

let updateProjectSection = async () => {

    let paylaod = {}

    let projects = await ProjectsQuery.findInProjects(paylaod)

    for (let project of projects) {
        let projectId = project._id
        if (projectId) {
            let insertedProjectSection = {
                name: process.env.DEFAULT_SECTION,
                projectId: projectId
            }
            let projectSectionRes =  await ProjectSectionsQuery.createProjectSection(insertedProjectSection)
        }
    }
}

updateProjectSection()