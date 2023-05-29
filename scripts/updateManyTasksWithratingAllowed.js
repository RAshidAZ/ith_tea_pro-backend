require('../config/index');
const TasksQuery = require('../models/tasks')

let updateTasks = async () => {

    let payload = {ratingAllowed:{$exists:false}}
    let insertRatingAllowedKey = {$set:{ratingAllowed:true}}

    let ratingAllowedRes =  await TasksQuery.updateMany(payload,insertRatingAllowedKey,(err, resp) => {
        if (err){
            console.log("error updating user",err.message);
        } else {
            return;
        }
    })

};

updateTasks();