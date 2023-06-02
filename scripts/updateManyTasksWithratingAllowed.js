require('../config/index');
const Tasks = require('../models/tasks')

let updateTasks = async () => {

    let payload = {ratingAllowed:{$exists:false}}
    let insertRatingAllowedKey = {$set:{ratingAllowed:true}}

     Tasks.updateMany(payload,insertRatingAllowedKey,(err, resp) => {
        if (err){
            console.log("error updating user",err);
        } else {
            return;
        }
    })

};

updateTasks();