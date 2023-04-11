require('../config/index');
const Users = require('../models/users')

let updateUsers = () => {
	let payload = {
		$or : [
			{ isDeleted : { $exists: false } },
			{ isDeleted : false }
		]
	}
    Users.updateMany(payload, { isDeleted : false}, (err, resp) => {
        if (err){
            console.log("error updating user",err.message);
        } else {
			return;
        }
    });
};

updateUsers();