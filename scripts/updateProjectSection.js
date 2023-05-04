require('../config/index');
const ProjectSections = require('../models/projectSections')
const Projects = require('../models/projects')

let updateProjectSection = async () => {
    let payload = {
		name :  "Notes" 
	}
    let newProjectSection = await ProjectSections.findOne(payload)

    let findSection = {}

    let updateSection = {
        $push:{sections:newProjectSection._id}
    }

    Projects.updateMany(findSection,updateSection , (err, resp) => {
    if (err){
        console.log("error updating user",err);
    } else {
        console.log("tasks due dates======",resp)
        }
    })
}

updateProjectSection()