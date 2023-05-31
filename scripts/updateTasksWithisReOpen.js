require('../config/index');
const Tasks = require('../models/tasks')

let updateTasks = async () => {

    let payload = {isReOpen:{$exists:false}}
    let insertisReOpenKey = {$set:{isReOpen:false}}

    let ratingAllowedRes =  await Tasks.updateMany(payload,insertisReOpenKey,(err, resp) => {
        if (err){
            console.log("error updating user",err);
        } else {
            console.log("tasks due dates seconds updated======",resp)
            return;
        }
    });

};

updateTasks();