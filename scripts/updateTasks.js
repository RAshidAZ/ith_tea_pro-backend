require('../config/index');
const Tasks = require('../models/tasks')

let updateUsers = () => {
	let findDueDates = {
		dueDate : {$nin : [null, '']}
	}
	let updateDueDates = [{ $set: { dueDate: { $add: ["$dueDate", -1000*60*60*5.5] } } }]
    Tasks.updateMany(findDueDates,updateDueDates, (err, resp) => {
        if (err){
            console.log("error updating user",err.message);
        } else {
			console.log("tasks due dates======",resp)
			return;
        }
    });
};

updateUsers();