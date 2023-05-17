const queryController = require('../query')
const { User, Auth, Credentials, Project } = queryController;
const crypto = require('crypto');
const mongoose = require("mongoose");
const btoa = require('btoa')
const { sendResponse } = require('../helpers/sendResponse');
const utilities = require('../helpers/security');
const emailUtitlities = require("../helpers/email");

const actionLogController = require("../controllers/actionLogs");
const credentials = require('../models/credentials');

/**Get all users with Custom Pagination */
const getAllUsers = async (req, res, next) => {
    let data = req.data;

    let userRes = await findAllUserWithPagination(data)

    if (userRes.error) {
        return res.status(500).send(sendResponse(500, '', 'getAllUsers', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Users Fetched', 'getAllUsers', userRes.data, req.data.signature))
}
exports.getAllUsers = getAllUsers;

const findAllUserWithPagination = async function (data) {
    try {
		
		let payload = {
			role: { $nin: ["SUPER_ADMIN","GUEST"]}
        }

		// if(['LEAD', 'CONTRIBUTOR', 'GUEST'].includes(data.auth.role) && data.filteredProjects){
		// 	let filteredProjectsUsers = await filteredDistinctProjectsUsers(data)
		// 	if(filteredProjectsUsers && filteredProjectsUsers.data){
		// 		payload._id  = { $in : filteredProjectsUsers.data}
		// 	}
		// }

		if(!['SUPER_ADMIN', 'ADMIN'].includes(data.auth.role)){
			payload.isDeleted = false
		}

        if (data.search) {
            payload["$or"] = [
                { "name": { "$regex": data.search, "$options": "i" } },
                { "email": { "$regex": data.search, "$options": "i" } },
            ]
        }
        let projection = {};

        let usersCount = await User.getAllUsersCountForPagination(payload);

        let limit = parseInt(process.env.PAGE_LIMIT);
        if (data.limit) {
            limit = parseInt(data.limit);
        }

        let skip = 0;
        if (data.currentPage) {
            skip = (data.currentPage - 1) * limit
        }

        let sortCriteria = {
            createdAt: -1
        }
        // let userRes = await User.getAllUsersPagination(payload, projection, sortCriteria, skip, limit);
		let pipeline = [
			{
				$match : payload
			},
			{
				$lookup: {
								from: "credentials",
								localField: "_id",
								foreignField: "userId",
								as: "credentials"
							}
				},
				{
					$unwind : {path:"$credentials",preserveNullAndEmptyArrays:true}
				},
				{
					$project:{
						"credentials.password":0,
						"credentials.salt":0,
						"credentials.accountId":0
					}
				},
				{
					$sort : sortCriteria
				},
				{
					$skip : parseInt(skip)
				},
				{
					$limit : parseInt(limit)
				}
		]
		let userRes = await User.userAggregate(pipeline);

        let sendData = {
            users: userRes,
            totalCount: usersCount,
            currentPage: data.currentPage,
            limit: data.limit
        }
        return { data: sendData, error: false }
    } catch (err) {
        console.log("findAllUserWithPagination Error : ", err)
        return { data: err, error: true }
    }
}
exports.findAllUserWithPagination = findAllUserWithPagination

/**Get all Guest with Custom Pagination */
const getAllGuest = async (req, res, next) => {
    let data = req.data;

    let userRes = await findAllGuestWithPagination(data)

    if (userRes.error) {
        return res.status(500).send(sendResponse(500, '', 'getAllUsers', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Users Fetched', 'getAllUsers', userRes.data, req.data.signature))
}
exports.getAllGuest = getAllGuest;

const findAllGuestWithPagination = async function (data) {
    try {
		
		let payload = {
			role: { $nin: ["SUPER_ADMIN","ADMIN","LEAD","CONTRIBUTOR"]}
        }


		if(!['SUPER_ADMIN', 'ADMIN'].includes(data.auth.role)){
			payload.isDeleted = false
		}

        if (data.search) {
            payload["$or"] = [
                { "name": { "$regex": data.search, "$options": "i" } },
                { "email": { "$regex": data.search, "$options": "i" } },
            ]
        }
        let projection = {};

        let usersCount = await User.getAllUsersCountForPagination(payload);

        let limit = parseInt(process.env.PAGE_LIMIT);
        if (data.limit) {
            limit = parseInt(data.limit);
        }

        let skip = 0;
        if (data.currentPage) {
            skip = (data.currentPage - 1) * limit
        }

        let sortCriteria = {
            createdAt: -1
        }
		let pipeline = [
			{
				$match : payload
			},
			{
				$lookup: {
                    from: "projects",
                    localField: "_id",
                    foreignField: "accessibleBy",
                    as: "projects"
                }
				},
				{
					$unwind : {path:"$credentials",preserveNullAndEmptyArrays:true}
				},
				{
					$project:{
						"credentials.password":0,
						"credentials.salt":0,
						"credentials.accountId":0
					}
				},
				{
					$sort : sortCriteria
				},
				{
					$skip : parseInt(skip)
				},
				{
					$limit : parseInt(limit)
				}
		]
		let userRes = await User.userAggregate(pipeline);

        let sendData = {
            users: userRes,
            totalCount: usersCount,
            currentPage: data.currentPage,
            limit: data.limit
        }
        return { data: sendData, error: false }
    } catch (err) {
        console.log("findAllUserWithPagination Error : ", err)
        return { data: err, error: true }
    }
}
exports.findAllGuestWithPagination = findAllGuestWithPagination


const getAllUsersListingNonPaginated = async (req, res, next) => {
    let data = req.data;

    let userRes = await findAllUserNonPagination(data)

    if (userRes.error) {
        return res.status(500).send(sendResponse(500, '', 'getAllUsersListingNonPaginated', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Users Fetched', 'getAllUsersListingNonPaginated', userRes.data, req.data.signature))
}
exports.getAllUsersListingNonPaginated = getAllUsersListingNonPaginated;

const findAllUserNonPagination = async function (data) {
    try {
        let payload = {
            role: { $nin: ["ADMIN", "SUPER_ADMIN"]},
			isDeleted : false
        }
        if (data.search) {
            payload["$or"] = [
                { "name": { "$regex": data.search, "$options": "i" } },
                { "email": { "$regex": data.search, "$options": "i" } },
            ]
        }
        let projection = {};

        let sortCriteria = {
            createdAt: -1
        }

        let userRes = await User.getAllUsers(payload, projection, sortCriteria);

        let sendData = {
            users: userRes,
        }
        return { data: sendData, error: false }
    } catch (err) {
        console.log("findAllUserNonPagination Error : ", err)
        return { data: err, error: true }
    }
}
exports.findAllUserNonPagination = findAllUserNonPagination


const editUserDetails = async (req, res, next) => {
    let data = req.data;

    if (['CONTRIBUTOR', 'INTERN'].includes(data.auth.role)) {
        data.userId = data.auth.id;
    }
    if (['LEAD', 'SUPER_ADMIN', 'ADMIN'].includes(data.auth.role) && !data.userId) {
        data.userId = data.auth.id;
    }
    if (!data.userId) {
        return res.status(400).send(sendResponse(400, "Missing Params", 'editUserDetails', null, req.data.signature))
    }
	if(data.employeeId){
		let employeeIdRes = await checkEmployeeIdExists(data);
		if (employeeIdRes.error) {
			return res.status(500).send(sendResponse(500, '', 'addNewUser', null, req.data.signature))
		}
		if (employeeIdRes.data) {
			return res.status(400).send(sendResponse(400, 'Employee Id Already Exists', 'editUserDetails', null, req.data.signature))
		}
	}
    let userRes = await createPayloadAndEditUserDetails(data)
    if (userRes.error) {
        return res.status(500).send(sendResponse(500, 'Something Went Wrong', 'editUserDetails', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Profile updated', 'editUserDetails', userRes.data, req.data.signature))
}
exports.editUserDetails = editUserDetails


const createPayloadAndEditUserDetails = async function (data) {
    try {
        let payload = {
            _id: data.userId,
        }
        let updatePayload = {}
        if (JSON.stringify(data.name)) {
            updatePayload.name = data.name
        }
        if (JSON.stringify(data.department)) {
            updatePayload.department = data.department
        }
        if (JSON.stringify(data.wings)) {
            updatePayload.wings = data.wings
        }
		if (JSON.stringify(data.dob)) {
            updatePayload.dob = data.dob
        }
        if (JSON.stringify(data.designation)) {
            updatePayload.designation = data.designation
        }
        if (JSON.stringify(data.linkedInLink)) {
            updatePayload.linkedInLink = data.linkedInLink
        }
        if (JSON.stringify(data.githubLink)) {
            updatePayload.githubLink = data.githubLink
        }
		if (JSON.stringify(data.facebookLink)) {
            updatePayload.facebookLink = data.facebookLink
        }
        if (JSON.stringify(data.twitterLink)) {
            updatePayload.twitterLink = data.twitterLink
        }

		if(JSON.stringify(data.employeeId)){
			updatePayload.employeeId = data.employeeId
		}

		if(JSON.stringify(data.profilePicture)){
			updatePayload.profilePicture = data.profilePicture
		}

		// if (data.name && data.dob && data.department && data.designation && data.employeeId) {
        //     updatePayload.profileCompleted = true
        // }else{
		// 	updatePayload.profileCompleted = false
		// }

		if (JSON.stringify(data.profileCompleted)) {
            updatePayload.profileCompleted = data.profileCompleted;
        }

        if (JSON.stringify(data.isBlocked)) {
            updatePayload.isBlocked = data.isBlocked;
        }
        let userRes = await User.editUserDetails(payload, updatePayload)
        return { data: userRes, error: false }
    } catch (err) {
        console.log("createPayloadAndEditUserDetails Error : ", err)
        return { data: err, error: true }
    }
}
exports.createPayloadAndEditUserDetails = createPayloadAndEditUserDetails

const addNewUser = async (req, res, next) => {
    let data = req.data;
    if (!data.name || !data.email|| !data.role) {
        return res.status(400).send(sendResponse(400, "", 'addNewUser', null, req.data.signature))
    }
	// if (["SUPER_ADMIN", "ADMIN"].includes(data.role)) {
    //     return res.status(400).send(sendResponse(400, "Not allowed to add this role", 'addNewUser', null, req.data.signature))
    // }
	if ((data.auth.role == "ADMIN" && ["SUPER_ADMIN", "ADMIN"].includes(data.role)) || data.role == 'SUPER_ADMIN') {
        return res.status(400).send(sendResponse(400, "Not allowed to add this role", 'addNewUser', null, req.data.signature))
    }
	
    let emailRes = await checkEmailExists(data);
    if (emailRes.error) {
        return res.status(500).send(sendResponse(500, '', 'addNewUser', null, req.data.signature))
    }
    if (emailRes.data) {
        return res.status(400).send(sendResponse(400, 'Email Already Exists', 'addNewUser', null, req.data.signature))
    }
	if(data.employeeId){
		let employeeIdRes = await checkEmployeeIdExists(data);
		console.log('employeeIdRes : ', employeeIdRes)
		if (employeeIdRes.error) {
			return res.status(500).send(sendResponse(500, '', 'addNewUser', null, req.data.signature))
		}
		if (employeeIdRes.data) {
			return res.status(400).send(sendResponse(400, 'Employee Id Already Exists', 'addNewUser', null, req.data.signature))
		}
	}

    let registerUser = await createPayloadAndRegisterUser(data);
	if (registerUser.error) {
		return res.status(500).send(sendResponse(500, 'Error adding user', 'addNewUser', null, req.data.signature))
	}
    data.registerUser = registerUser.data;
    data.registerUserId = registerUser.data._id;

    if (data.projectIds && data.projectIds.length) {
        let assignProjectsToUserRes = await createPayloadAndAssignProjectToAddedUser(data);
        if (assignProjectsToUserRes.error) {
            return res.status(500).send(sendResponse(500, '', 'addNewUser', null, req.data.signature))
        }
    }
    let actionLogData = {
        actionType: "TEAM_MEMBER",
        actionTaken: "TEAM_MEMBER_ADDED",
        actionBy: data.auth.id,
        addedUserId: registerUser.data?._id
    }
    data.actionLogData = actionLogData;
    let addActionLogRes = await actionLogController.addActionLog(data);

    if (addActionLogRes.error) {
        return res.status(500).send(sendResponse(500, '', 'addNewUser', null, req.data.signature))
    }

    let sendWelcomeEmailRes = await emailUtitlities.sendWelcomeEmail(data);
    return res.status(200).send(sendResponse(200, 'Users Created', 'addNewUser', null, req.data.signature))
}
exports.addNewUser = addNewUser;

const addNewGuest = async (req, res, next) => {
    let data = req.data;
    if (!data.name || !data.email|| !data.role || data.role!="GUEST") {
        return res.status(400).send(sendResponse(400, "", 'addNewGuest', null, req.data.signature))
    }

	if ((data.auth.role == "ADMIN" && ["SUPER_ADMIN", "ADMIN"].includes(data.role)) || data.role == 'SUPER_ADMIN') {
        return res.status(400).send(sendResponse(400, "Not allowed to add this role", 'addNewGuest', null, req.data.signature))
    }
	
    let emailRes = await checkEmailExists(data);
    if (emailRes.error) {
        return res.status(500).send(sendResponse(500, '', 'addNewGuest', null, req.data.signature))
    }
    if (emailRes.data) {
        return res.status(400).send(sendResponse(400, 'Email Already Exists', 'addNewGuest', null, req.data.signature))
    }
    let generatePasswordForGuest = crypto.randomBytes(8).toString('base64');
        data.password = generatePasswordForGuest

    let registerUser = await createPayloadAndRegisterUser(data);
	if (registerUser.error) {
		return res.status(500).send(sendResponse(500, 'Error adding user', 'addNewGuest', null, req.data.signature))
	}
    data.registerUser = registerUser.data;
    data.registerUserId = registerUser.data._id;

    if (data.projectIds && data.projectIds.length) {
        let assignProjectsToUserRes = await createPayloadAndAssignProjectToAddedUser(data);
        if (assignProjectsToUserRes.error) {
            return res.status(500).send(sendResponse(500, '', 'addNewUser', null, req.data.signature))
        }
    }
    let passgeneratedHashAndSalt = generateHashAndSalt(data);
    if (passgeneratedHashAndSalt.error) {
		return res.status(500).send(sendResponse(500, 'Error adding user', 'addNewGuest', null, req.data.signature))
	}
    data.generatedHashAndSalt = passgeneratedHashAndSalt.data 

    let insertGuestCredentials = await createPayloadAndInsertCredentials(data);
    if (insertGuestCredentials.error) {
		return res.status(500).send(sendResponse(500, 'Error adding user', 'addNewGuest', null, req.data.signature))
	}

    
    if (data.projectIds && data.projectIds.length) {
        let assignProjectsToUserRes = await createPayloadAndAssignProjectToAddedUser(data);
        if (assignProjectsToUserRes.error) {
            return res.status(500).send(sendResponse(500, '', 'addNewGuest', null, req.data.signature))
        }
    }
    let actionLogData = {
        actionType: "GUEST",
        actionTaken: "GUEST_ADDED",
        actionBy: data.auth.id,
        addedUserId: registerUser.data._id
    }
    console.log(actionLogData)
    data.actionLogData = actionLogData;
    let addActionLogRes = await actionLogController.addActionLog(data);

    if (addActionLogRes.error) {
        return res.status(500).send(sendResponse(500, '', 'addNewGuest',addActionLogRes , req.data.signature))
    }

    let sendWelcomeEmailRes = await emailUtitlities.sendWelcomeEmailToGuest(data);
    return res.status(200).send(sendResponse(200, 'Users Created', 'addNewGuest', null, req.data.signature))
}
exports.addNewGuest = addNewGuest;

const checkEmailExists = async (data) => {
    try {
        let payload = {
            email: data.email
        }
        let projection = { email: 1 }
        let userRes = await User.userfindOneQuery(payload, projection)
        return { data: userRes, error: false }
    } catch (err) {
        console.log("createPayloadAndEditUserDetails Error : ", err)
        return { data: err, error: true }
    }
}

const generateHashAndSalt =  (data) =>{

    try{
        let hashedPasswordAndSalt =  utilities.generatePassword(data.password);


        return { data: hashedPasswordAndSalt, error: false }

    }catch(err){
        return { data: err, error: true }
    }
}
const checkEmployeeIdExists = async (data) => {
    try {
        let payload = {
            employeeId: data.employeeId,
        }
		if(data.userId){
			payload._id = {$ne : data.userId}
		}
        let projection = { employeeId: 1 }
        let userRes = await User.userfindOneQuery(payload, projection)
        return { data: userRes, error: false }
    } catch (err) {
        console.log("createPayloadAndEditUserDetails Error : ", err)
        return { data: err, error: true }
    }
}

const createPayloadAndRegisterUser = async function (data) {
    
    let findData = {
        email: data.email
    }
    let updateData = {
        email: data.email,
        provider: 'email',
        name: data.name,
        role: data.role,
        isActive: true,
        isBlocked: false,
        emailVerified: true
    }

	if (data.name) {
		updateData.name = data.name
	}
	if (data.department) {
		updateData.department = data.department
	}
	if (data.wings) {
		updateData.wings = data.wings
	}
	if (data.dob) {
		updateData.dob = data.dob
	}
	if (data.designation) {
		updateData.designation = data.designation
	}
	if (data.linkedInLink) {
		updateData.linkedInLink = data.linkedInLink
	}
	if (data.githubLink) {
		updateData.githubLink = data.githubLink
	}
	if (data.facebookLink) {
		updateData.facebookLink = data.facebookLink
	}
	if (data.employeeId) {
		updateData.employeeId = data.employeeId
	}
	if (data.twitterLink) {
		updateData.twitterLink = data.twitterLink
	}
	if (data.name && data.dob && data.department && data.designation && data.wings) {
		updateData.profileCompleted = true
	}else{
		updateData.profileCompleted = false
	}
    let options = {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
    }

    try {
		let registerUser = await Auth.findAndUpdateUser(findData, updateData, options);
		const randomString = Math.random().toString(36).substring(2) + registerUser._id.toString().substring(15,24);
		data.signupToken = btoa(randomString).toString();
		// let updateUser = await Auth.findAndUpdateUser(findData, updateData);
		let payload = {
			email : data.email,
            // password:data.password,
			token : randomString,
			userId : registerUser._id
		}
		let addPasswordSetupToken = await Auth.addPasswordSetupToken(payload);

        return {
            data: registerUser,
            error: false
        }
    }
    catch (error) {
        return {
            data: error,
            error: true
        }
    }
}

const createPayloadAndInsertCredentials = async function (data) {
    let generatedPass = data.generatedHashAndSalt;
    if (!generatedPass.hash || !generatedPass.salt) {
        return cb(responseUtilities.responseStruct(500, "no hash/salt", "registerUser", null, data.req.signature));
    }
    let findData = {
        userId: data.registerUser._id
    }
    let updateData = {
        userId: data.registerUser._id,
        password: generatedPass.hash,
        salt: generatedPass.salt,
        accountId: data.accountId,
        isActive: true,
        isBlocked: false,
        emailVerified: true
    }
    // if (data.employeeId) {
    //     updateData.employeeId = data.employeeId
    // }
    let options = {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
    }

    try {
        let insertCredentials = await Credentials.createCredentials(findData, updateData, options);
        console.log("Create Credentials User Response => ", insertCredentials)
        return {
            data: insertCredentials,
            error: false
        }
    }
    catch (error) {
        return {
            data: error,
            error: true
        }
    }
}

const createPayloadAndAssignProjectToAddedUser = async function (data) {
    try {

        let payload = {
            _id: { $in: data.projectIds }
        }

        let updatePayload = {};
        if (data.role == "LEAD") {
            updatePayload = {
                $addToSet: { managedBy: mongoose.Types.ObjectId(data.registerUserId) }
            }
        }
        if (["CONTRIBUTOR", "INTERN","GUEST"].includes(data.role)) {
            updatePayload = {
                $addToSet: { accessibleBy: mongoose.Types.ObjectId(data.registerUserId) }
            }
        }
        let projectAssignRes = await Project.updateMany(payload, updatePayload)
        return { data: projectAssignRes, error: false }
    } catch (err) {
        console.log("createPayloadAndEditProject Error : ", err)
        return { data: err, error: true }
    }
}

const getUserDetailsByUserId = async (req, res, next) => {
    let data = req.data;

    if (!data.userId && !data.auth.id) {
        return res.status(400).send(sendResponse(400, "", 'getUserDetailsByUserId', null, req.data.signature))
    }
    let userRes = await createPayloadAndGetUserDetailsByUserId(data)
    if (userRes.error) {
        return res.status(500).send(sendResponse(500, '', 'getUserDetailsByUserId', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Users Fetched', 'getUserDetailsByUserId', userRes.data, req.data.signature))
}
exports.getUserDetailsByUserId = getUserDetailsByUserId

const createPayloadAndGetUserDetailsByUserId = async function (data) {
    try {
        let payload = {
            _id: data.userId || data.auth.id,
        }
        let projection = {
            // name: data.name,
            // email: data.email,
        }
        let userRes = await User.userfindOneQuery(payload, projection)
        return { data: userRes, error: false }
    } catch (err) {
        console.log("createPayloadAndGetUserDetailsByUserId Error : ", err)
        return { data: err, error: true }
    }
}
exports.createPayloadAndGetUserDetailsByUserId = createPayloadAndGetUserDetailsByUserId

// Non Pagination Leads List
const getAllLeadsLisitng = async (req, res, next) => {
    let data = req.data;

    let leadsRes;
    if (data.projectId) {
        leadsRes = await createPayloadAndGetLeadsOfSpecificProject(data);
    } else {
        leadsRes = await createPayloadAndfindAllLeadsList(data)
    }

    if (leadsRes.error) {
        return res.status(500).send(sendResponse(500, '', 'getAllLeadsLisitng', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Leads Fetched', 'getAllLeadsLisitng', leadsRes.data, req.data.signature))
}
exports.getAllLeadsLisitng = getAllLeadsLisitng

const createPayloadAndGetLeadsOfSpecificProject = async function (data) {
    try {

        let payload = {
            _id: data.projectId
        }
        let projection = {};
        let populate = "managedBy";
        let projectRes = await Project.findSpecificProject(payload, projection, populate);

        let allLeads = projectRes?.managedBy;
        allLeads = allLeads.filter((e) => {
            return (e.isActive && (!e.isBlocked) && e.emailVerified)
        })

        return { data: allLeads, error: false }
    } catch (err) {
        console.log("getLeadsOfSpecificProject Error : ", err)
        return { data: err, error: true }
    }
}

const createPayloadAndfindAllLeadsList = async function (data) {
    try {

        let findData = {
            role: { $in : ["LEAD", 'ADMIN']},
			isDeleted : false
        }
        let projection = {};

        let leadsRes = await User.getAllUsers(findData, projection);
        return { data: leadsRes, error: false }
    } catch (err) {
        console.log("findLeads Error : ", err)
        return { data: err, error: true }
    }
}
// Non Pagination Users List
const getAllUsersNonPaginated = async (req, res, next) => {
    let data = req.data;

    let findData = {
        role: {$in : ['CONTRIBUTOR']},
		isDeleted : false
    }
    if (data.search) {
        findData["$or"] = [
            { "name": { "$regex": data.search, "$options": "i" } },
            { "email": { "$regex": data.search, "$options": "i" } },
        ]
    }
    data.findData = findData;
    let userRes = await createPayloadAndfindAllUsersList(data)

    if (userRes.error) {
        return res.status(500).send(sendResponse(500, '', 'getAllUsersNonPaginated', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Users Fetched', 'getAllUsersNonPaginated', userRes.data, req.data.signature))
}
exports.getAllUsersNonPaginated = getAllUsersNonPaginated;

const createPayloadAndfindAllUsersList = async function (data) {
    try {

        let projection = {};
        let payload = data.findData;
		if(!payload.isDeleted){
			payload.isDeleted = false
		}
        let sortCriteria = { createdAt: -1 }
        let userRes = await User.getAllUsers(payload, projection, sortCriteria);
        return { data: userRes, error: false }
    } catch (err) {
        console.log("createPayloadAndfindAllUsersList Error : ", err)
        return { data: err, error: true }
    }
}


// Non Pagination Leads List
const updateUserBlockStatus = async (req, res, next) => {
    let data = req.data;

    if (!data.userId) {
        return res.status(400).send(sendResponse(400, 'Missing Params', 'updateUserBlockStatus', null, req.data.signature))
    }

    let updateStatusRes = await createPayloadAndEditUserDetails(data);
    if (updateStatusRes.error) {
        return res.status(500).send(sendResponse(500, '', 'getAllLeadsLisitng', null, req.data.signature))
    }

    //this will change when schema of credentials and authenticator is modified
    let updateUserInCredentials = await createPayloadAndEditUserCredentialsDetails(data);
    if (updateUserInCredentials.error) {
        return res.status(500).send(sendResponse(500, '', 'getAllLeadsLisitng', null, req.data.signature))
    }
    return res.status(200).send(sendResponse(200, 'User block status updated', 'getAllLeadsLisitng', null, req.data.signature))
}
exports.updateUserBlockStatus = updateUserBlockStatus


const createPayloadAndEditUserCredentialsDetails = async function (data) {
    try {
        let payload = {
            userId: data.userId,
        }
        let updatePayload = {}

        if (JSON.stringify(data.isBlocked)) {
            updatePayload.isBlocked = data.isBlocked;
        }
        let options = {
            new: true
        }
        let userRes = await Credentials.createCredentials(payload, updatePayload, options)
        return { data: userRes, error: false }
    } catch (err) {
        console.log("createPayloadAndEditUserDetails Error : ", err)
        return { data: err, error: true }
    }
}

const getUnAssignedUserLisitng = async (req, res, next) => {
    let data = req.data;

    let userRes;
    if (!data.projectId) {
        return res.status(400).send(sendResponse(400, 'Missing Params', 'getUnAssignedUserLisitng', null, req.data.signature))
	}

	if(data.role && !['CONTRIBUTOR', 'LEAD'].includes(data.role)){
        return res.status(400).send(sendResponse(400, 'Invalid role passed', 'getUnAssignedUserLisitng', null, req.data.signature))
	}
	userRes = await createPayloadAndGetUnAssignedUserOfSpecificProject(data);

    if (userRes.error) {
        return res.status(500).send(sendResponse(500, '', 'getAllLeadsLisitng', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Leads Fetched', 'getUnAssignedUserLisitng', userRes.data, req.data.signature))
}
exports.getUnAssignedUserLisitng = getUnAssignedUserLisitng

const createPayloadAndGetUnAssignedUserOfSpecificProject = async function (data) {
    try {

        let payload = {
            _id: data.projectId
        }
        let projection = {}
		// let populate ='managedBy accessibleBy';
		let userRes = null;
        let projectRes = await Project.findSpecificProject(payload, projection);
		
		let userPayload = {
			isDeleted : false
		}
		if(data.role == 'LEAD'){
			userPayload.role = { $in : ['LEAD', 'ADMIN'] }
			userRes = (projectRes && projectRes.managedBy) || []
		}else{
			userPayload.role = { $in : [data.role] }
			userRes = (projectRes && projectRes.accessibleBy) || []
		}

		userPayload._id = { $nin : userRes }
		let sortCriteria = {
			createdAt : -1
		}
		projection = {
			name : 1,
			role : 1,
			email : 1
		}
		let usersData = await User.getAllUsers(userPayload, projection, sortCriteria);
        // userRes = userRes.filter((e) => {
        //     return (e.isActive && (!e.isBlocked) && e.emailVerified)
        // })

        return { data: usersData, error: false }
    } catch (err) {
        console.log("createPayloadAndGetUnAssignedUserOfSpecificProject Error : ", err)
        return { data: err, error: true }
    }
}

const filteredDistinctProjectsUsers = async function (data) {
	try {

		let filteredProjects = data.filteredProjects || []
		filteredProjects = filteredProjects.map(el => mongoose.Types.ObjectId(el))
		let findData = { _id : { $in : filteredProjects } }

        let pipeline = [
			{
				$match : findData
			},
			{
			  $project: {
				allUsers: {
				  $setUnion: ["$managedBy", "$accessibleBy"]
				}
			  }
			}
		  ]
        let projectsUsers = await Project.projectAggregate(pipeline)
		let allUsers = (projectsUsers[0] && projectsUsers[0].allUsers) || []
		console.log("======================all users======",allUsers)
        return { data: allUsers, error: false }
    } catch (err) {
        console.log("createPayloadAndEditUserDetails Error : ", err)
        return { data: err, error: true }
    }
        

       
}
exports.filteredDistinctProjectsUsers = filteredDistinctProjectsUsers

// team analytics
const getTeamAnalytics = async (req, res, next) => {
    let data = req.data;

    let userRes = await createPayloadAndgetTeamAnalytics(data)

    if (userRes.error) {
        return res.status(500).send(sendResponse(500, '', 'getTeamAnalytics', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Users Fetched', 'getTeamAnalytics', userRes.data, req.data.signature))
}
exports.getTeamAnalytics = getTeamAnalytics;

const createPayloadAndgetTeamAnalytics = async function (data) {
    try {

		let findData = { }

		if(!['SUPER_ADMIN', 'ADMIN'].includes(data.auth.role)){
			findData.isDeleted = false
		}
        let payload = [
			{ $match : findData },
			{
			  $lookup: {
				from: "tasks",
				localField: "_id",
				foreignField: "assignedTo",
				as: "tasks"
			  }
			},
			{
			  $project: {
				name: 1,
				 email : 1,
				totalTasks: { $size: "$tasks" },
				completedTasks: {
				  $size: {
					$filter: {
					  input: "$tasks",
					  as: "task",
					  cond: { $eq: ["$$task.status", "COMPLETED"] }
					}
				  }
				},
		        completedAfterDueDate: {
		          $size: {
		            $filter: {
		              input: "$tasks",
		              as: "task",
		              cond: {
		                $and: [
		                  { $eq: ["$$task.status", "COMPLETED"] },
		                  { $gt: ["$$task.completedDate", "$$task.dueDate"] }
		                ]
		              }
		            }
		          }
		        }
			  }
			},
			 {
				$project: {
				  name: 1,
				  totalTasks: 1,
				  completedTasks: 1,
				  completedAfterDueDate: 1,
				  completedPercentage: {
					$cond: {
					  if: { $eq: ["$totalTasks", 0] },
					  then: 0,
					  else: { $multiply: [{ $divide: ["$completedTasks", "$totalTasks"] }, 100] }
					}
				  },
				  completedAfterDueDatePercentage: {
					$cond: {
					  if: { $eq: ["$totalTasks", 0] },
					  then: 0,
					  else: { $multiply: [{ $divide: ["$completedAfterDueDate", "$totalTasks"] }, 100] }
					}
				}
			}
		}
		  ]
        let userRes = await User.userAggregate(payload);
        return { data: userRes, error: false }
    } catch (err) {
        console.log("createPayloadAndgetTeamAnalytics Error : ", err)
        return { data: err, error: true }
    }
}

const deleteUser = async (req, res, next) => {
    let data = req.data;

    if (!data.userId) {
        return res.status(400).send(sendResponse(400, 'Missing Params', 'deleteUser', null, req.data.signature))
    }

	let findPayload = {
		_id : data.userId
	}
	let userRes = await User.userfindOneQuery(findPayload)
	if (!userRes) {
        return res.status(400).send(sendResponse(400, 'User Not Found', 'deleteUser', null, req.data.signature))
    }
	let userRole = userRes.role
	if(data.auth.role == 'SUPER_ADMIN' && userRole == 'SUPER_ADMIN'){
        return res.status(400).send(sendResponse(400, "Can't delete given user", 'deleteUser', null, req.data.signature))
	}

	if(data.auth.role == 'ADMIN' && ['ADMIN', 'SUPER_ADMIN'].includes(userRole)){
        return res.status(400).send(sendResponse(400, "Not Allowed to delete given user", 'deleteUser', null, req.data.signature))
	}

    let userDeleteRes = await createPayloadAndDeleteUser(data);
    if (userDeleteRes.error) {
        return res.status(500).send(sendResponse(500, '', 'deleteUser', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'User deleted', 'deleteUser', null, req.data.signature))
}
exports.deleteUser = deleteUser

const  activeGuest = async (req, res, next) => {
    let data = req.data;

    if (!data.userId) {
        return res.status(400).send(sendResponse(400, 'Missing Params', 'deleteUser', null, req.data.signature))
    }

	let findPayload = {
		userId : data.userId
	}
	let userRes = await Credentials.findOneQuery(findPayload)
    if (!userRes) {
        return res.status(400).send(sendResponse(400, 'User Not Found', 'activeGuest', null, req.data.signature))
    }
    if(userRes.isActive == true){
        let guestUpdateRes = await createPayloadAndDeactivateStatus(data);
        // console.log(guestUpdateRes)  
        if (guestUpdateRes.error) {
            return res.status(500).send(sendResponse(500, '', 'activeGuest', null, req.data.signature))
        }
        return res.status(200).send(sendResponse(200, 'Guest is now Inactive', 'activeGuest', null, req.data.signature))
    }else{
        let guestUpdateRes = await createPayloadAndUpdateToTrue(data);
        console.log(guestUpdateRes)
        if (guestUpdateRes.error) {
            return res.status(500).send(sendResponse(500, '', 'activeGuest', null, req.data.signature))
        }
        return res.status(200).send(sendResponse(200, 'Guest is now active', 'activeGuest', null, req.data.signature))

       
    }

    // return res.status(200).send(sendResponse(200, 'Guest is now active', 'activeGuest', null, req.data.signature))
}
exports.activeGuest = activeGuest

const createPayloadAndUpdateToTrue = async (data) => {

    let findPayload = {
	  userId: data.userId
	}
    let updatePayload = {
        isActive: true
    }

    let updateStatusRes = await Credentials.updateCredentials(findPayload,updatePayload)
    //  console.log(updateStatusRes)

    return { data: updateStatusRes , error: false }
}

const createPayloadAndDeactivateStatus = async (data) => {

    let findPayload = {
	  userId: data.userId
	}
    let updatePayload = {
        isActive: false
    }

    let updateStatusRes = await Credentials.updateCredentials(findPayload,updatePayload)
    //  console.log(updateStatusRes)

    return { data: updateStatusRes , error: false }
}

const createPayloadAndDeleteUser = async (data) => {
    try {
        let findPayload = {
            _id : data.userId
        }

		let updatePayload = {
			isDeleted : true
        }

        userRes = await User.editUserDetails(findPayload, updatePayload)
		let projectPayload = { }

		let updateProjectPayload = { }
		
		if(userRes.role == 'CONTRIBUTOR'){
			updateProjectPayload = { $pull: { accessibleBy: userRes._id }}
		}else{
			updateProjectPayload = { $pull: { managedBy: userRes._id }}
		}

		// let projectRes = await Project.updateMany(projectPayload, updateProjectPayload)
        return { data: userRes, error: false }
    } catch (err) {
        console.log("createPayloadAndDeleteUser Error : ", err)
        return { data: err, error: true }
    }
}

const createPayloadAndgetDeletedUsers = async function (data) {
    try {

        let payload = data.findDeletedUsers || { isDeleted : true };
        let userRes = await User.getDistinct("_id", payload);
        return { data: userRes, error: false }
    } catch (err) {
        console.log("createPayloadAndgetDeletedUsers Error : ", err)
        return { data: err, error: true }
    }
}
exports.createPayloadAndgetDeletedUsers = createPayloadAndgetDeletedUsers

const getUserListing = async (req, res, next) => {
    let data = req.data;

    let userRes = await findAllUsers(data)

    if (userRes.error) {
        return res.status(500).send(sendResponse(500, '', 'getAllUsersListingNonPaginated', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Users Fetched', 'getAllUsersListingNonPaginated', userRes.data, req.data.signature))
}
exports.getUserListing = getUserListing;

const findAllUsers = async function (data) {
    try {
        let payload = {
            role: { $nin: ["ADMIN"]}
        }
        if (data.search) {
            payload["$or"] = [
                { "name": { "$regex": data.search, "$options": "i" } },
                { "email": { "$regex": data.search, "$options": "i" } },
            ]
        }
        let projection = {
			"label":"$name",
			"value": "$_id",
			_id : 0
		};

        let sortCriteria = {
            createdAt: -1
        }

        let userRes = await User.getAllUsers(payload, projection, sortCriteria);

        let sendData = {
            users: userRes,
        }
        return { data: sendData, error: false }
    } catch (err) {
        console.log("findAllUserNonPagination Error : ", err)
        return { data: err, error: true }
    }
}

const getAllLeadsListing = async (req, res, next) => {
    let data = req.data;

    let userRes = await findAllLeads(data)

    if (userRes.error) {
        return res.status(500).send(sendResponse(500, '', 'getAllLeadsListing', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Leads Fetched', 'getAllLeadsListing', userRes.data, req.data.signature))
}
exports.getAllLeadsListing = getAllLeadsListing;

const findAllLeads = async function (data) {
    try {
        let payload = {
            role: { $in: ['ADMIN', 'LEAD']},
			isDeleted : false
        }
        let projection = {
			name :1
		};

        let sortCriteria = {
            createdAt: -1
        }

        let userRes = await User.getAllUsers(payload, projection, sortCriteria);

        let sendData = {
            users: userRes,
        }
        return { data: sendData, error: false }
    } catch (err) {
        console.log("findAllUserNonPagination Error : ", err)
        return { data: err, error: true }
    }
}