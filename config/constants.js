exports.CONSTANTS = {
	"GROUP_BY" :{ 
		default : { projectId: "$name", section: "$section.name" },
		section : {_id : null, section : `$section.name`},
		status : {_id : null, status : "$tasks.status"},
		assignedTo : {_id : null, assignedTo : "$tasks.assignedTo"},
		priority : {_id : null, priority : "$tasks.priority"},
		createdBy : {_id : null, createdBy : "$tasks.createdBy"},
		projectId : {_id : null, projectId : "$name"} 
	},
	"SORTBY_IN_INCREASING_ORDER": { 
		default : { "_id.projectId": 1, "_id.section": 1 },
		"due-date" : { "tasks.dueDate" : 1},
		status : { "tasks.status" : 1},
		"date-created" : { "tasks.createdAt" : 1},
		"date-updated" : { "tasks.updatedAt" : 1},
		"date-completed" : { "tasks.completedDate" : 1},
		"alphabetically" : { "_id.projectId": 1, "_id.section": 1 } 
	},
	"SORTBY_IN_DECREASING_ORDER": { 
		default : { "_id.projectId": -1, "_id.section": -1 },
		"due-date" : { "tasks.dueDate" : -1},
		status : { "tasks.status" : -1},
		"date-created" : { "tasks.createdAt" : -1},
		"date-updated" : { "tasks.updatedAt" : -1},
		"date-completed" : { "tasks.completedDate" : -1},
		"alphabetically" : { "_id.projectId": -1, "_id.section": -1 } 
	}
}