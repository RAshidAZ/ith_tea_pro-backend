require('../config/index');
const Tasks = require('../models/tasks')

let updateTasks = () => {
	let findDueDates = {
		dueDate : {$nin : [null, ''], $exists:true}
	}
	let updateDueDates = [{ $set: { dueDate: { $add: ["$dueDate", -1000*60*60*5.5] } } }]
    Tasks.updateMany(findDueDates,updateDueDates, (err, resp) => {
        if (err){
            console.log("error updating user",err.message);
        } else {
			console.log("tasks due dates======",resp)
			
			let updateSeconds = [
				{
				  $set: {
					dueDate: {
					  $dateFromParts: {
						year: { $year: "$dueDate" },
						month: { $month: "$dueDate" },
						day: { $dayOfMonth: "$dueDate" },
						hour: { $hour: "$dueDate" },
						minute: { $minute: "$dueDate" },
						second: 59,
						millisecond: 999
					  }
					}
				  }
				}
			  ]
			Tasks.updateMany(findDueDates,updateSeconds, (err, tasks) => {
				if (err){
					console.log("error updating user",err.message);
				} else {
					console.log("tasks due dates seconds updated======",tasks)
					return;
				}
			});
        }
    });
};

updateTasks();