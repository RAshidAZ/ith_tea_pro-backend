require('../config/index');
const Tasks = require('../models/tasks')

let updateTasks = async () => {

    let payload = {timeTaken:{$exists:false}}
    let insertTimeTakenKey = {$set:{timeTaken:0}}

     Tasks.updateMany(payload,insertTimeTakenKey,(err, resp) => {
        if (err){
            console.log("error updating user",err);
        } else {
            console.log("tasks due dates seconds updated======",resp)
            return;
        }
    });

};

updateTasks();