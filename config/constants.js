exports.CONSTANTS = {
	"GROUP_BY" :{ 
		default : { projectId: "$name", section: "$section.name" },
		section : {_id : null, section : `$section.name`},
		status : {_id : null, status : "$tasks.status"},
		assignedTo : {_id : null, assignedTo : "$tasks.assignedTo"},
		priority : {_id : null, priority : "$tasks.priority"},
		createdBy : {_id : null, createdBy : "$tasks.createdBy"},
		projectId : {_id : null, projectId : "$name"} 
	}
}