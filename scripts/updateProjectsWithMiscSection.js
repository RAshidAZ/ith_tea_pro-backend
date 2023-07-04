require('../config/index');
const ProjectsQuery = require('../query/project');
const ProjectSectionsQuery = require('../query/projectSections');

let updateProjectSection = async () => {
  let payload = {
    name: process.env.DEFAULT_SECTION
  };

  let projectSection = await ProjectSectionsQuery.findInProjects(payload);
        console.log(projectSection)
  for (let section of projectSection) {
    let sectionId =  section._id;
    let findProject = {
      _id: section.projectId
    };
    let updatePayload = {
      $addToSet: { sections: sectionId }
    };

    let projectRes = await ProjectsQuery.projectFindOneAndUpdate(findProject, updatePayload);
    console.log(projectRes);
  }
};

updateProjectSection();
