const queryController = require('../query')
const { User, Auth, Credentials, Project } = queryController;

const mongoose = require("mongoose");
const btoa = require('btoa')
const { sendResponse } = require('../helpers/sendResponse');
const utilities = require('../helpers/security');
const emailUtitlities = require("../helpers/email");

const actionLogController = require("../controllers/actionLogs");

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
            role: { $nin: ["ADMIN", "SUPER_ADMIN"]}
        }
        if (data.search) {
            payload["$or"] = [
                { "name": { "$regex": data.search, "$options": "i" } },
                { "email": { "$regex": data.search, "$options": "i" } },
            ]
        }
        let projection = {};

        let usersCount = await User.getAllUsersCountForPagination(payload);

        let limit = process.env.PAGE_LIMIT;
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
        let userRes = await User.getAllUsersPagination(payload, projection, sortCriteria, skip, limit);

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
            role: { $nin: ["ADMIN", "SUPER_ADMIN"]}
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
    let userRes = await createPayloadAndEditUserDetails(data)
    console.log('userRes : ', userRes)
    if (userRes.error) {
        return res.status(500).send(sendResponse(500, 'Something Went Wrong', 'editUserDetails', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'User Edited', 'editUserDetails', userRes.data, req.data.signature))
}
exports.editUserDetails = editUserDetails


const createPayloadAndEditUserDetails = async function (data) {
    try {
        let payload = {
            _id: data.userId,
        }
        let updatePayload = {}
        if (data.name) {
            updatePayload.name = data.name
        }
        if (data.department) {
            updatePayload.department = data.department
        }
        if (data.wings) {
            updatePayload.wings = data.wings
        }
		if (data.dob) {
            updatePayload.dob = data.dob
        }
        if (data.designation) {
            updatePayload.designation = data.designation
        }
        if (data.linkedInLink) {
            updatePayload.linkedInLink = data.linkedInLink
        }
        if (data.githubLink) {
            updatePayload.githubLink = data.githubLink
        }
		if (data.facebookLink) {
            updatePayload.facebookLink = data.facebookLink
        }
        if (data.twitterLink) {
            updatePayload.twitterLink = data.twitterLink
        }
		if (data.name && data.dob && data.department && data.designation && data.wings) {
            updatePayload.profileCompleted = true
        }else{
			updatePayload.profileCompleted = false
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
    if (["SUPER_ADMIN", "ADMIN"].includes(data.role)) {
        return res.status(400).send(sendResponse(400, "Not allowed to add this role", 'addNewUser', null, req.data.signature))
    }
    let emailRes = await checkEmailExists(data);
    console.log('emailRes : ', emailRes)
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
    // let generatedHashSalt = utilities.generatePassword(data.password);
    // data.generatedHashSalt = generatedHashSalt;
    // let accountId = await utilities.generateAccountId();
    // data.accountId = accountId;
    // console.log("Password accountId => ", data.accountId);

    let registerUser = await createPayloadAndRegisterUser(data);
	if (registerUser.error) {
		return res.status(500).send(sendResponse(500, 'Error adding user', 'addNewUser', null, req.data.signature))
	}
    data.registerUser = registerUser.data;
    data.registerUserId = registerUser.data._id;
    console.log('registerUser ---------------: ', registerUser)
    // let insertUserCredentials = await createPayloadAndInsertCredentials(data);
    // console.log('insertUserCredentials : ', insertUserCredentials)

    // if (insertUserCredentials.error) {
    //     return res.status(500).send(sendResponse(500, '', 'addNewUser', null, req.data.signature))
    // }

    if (data.projectIds && data.projectIds.length) {
        let assignProjectsToUserRes = await createPayloadAndAssignProjectToAddedUser(data);
        if (assignProjectsToUserRes.error) {
            return res.status(500).send(sendResponse(500, '', 'addNewUser', null, req.data.signature))
        }
        console.log("Assign Projects assignProjectsToUserRes => ", assignProjectsToUserRes.data)
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
    console.log("sendWelcomeEmailRes ======> ", sendWelcomeEmailRes);
    return res.status(200).send(sendResponse(200, 'Users Created', 'addNewUser', null, req.data.signature))
}
exports.addNewUser = addNewUser;

const checkEmailExists = async (data) => {
    try {
        let payload = {
            email: data.email,
        }
        let projection = { email: 1 }
        let userRes = await User.userfindOneQuery(payload, projection)
        return { data: userRes, error: false }
    } catch (err) {
        console.log("createPayloadAndEditUserDetails Error : ", err)
        return { data: err, error: true }
    }
}
const checkEmployeeIdExists = async (data) => {
    try {
        let payload = {
            employeeId: data.employeeId,
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
    // let { hash, salt } = data.generatedHashSalt;
    // if (!hash || !salt) {
    //     return cb(responseUtilities.responseStruct(500, "no hash/salt", "registerUser", null, data.req.signature));
    // }
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
		let passwordToken = btoa(registerUser._id).toString()
		updateData.passwordToken = passwordToken;
		data.signupToken = passwordToken
		let updateUser = await Auth.findAndUpdateUser(findData, updateData);
        console.log("Register User Response => ", registerUser)
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
    let { hash, salt } = data.generatedHashSalt;
    if (!hash || !salt) {
        return cb(responseUtilities.responseStruct(500, "no hash/salt", "registerUser", null, data.req.signature));
    }
    let findData = {
        userId: data.registerUser._id
    }
    let updateData = {
        userId: data.registerUser._id,
        password: hash,
        salt: salt,
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
        if (["CONTRIBUTOR", "INTERN"].includes(data.role)) {
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
    console.log('userRes : ', userRes)
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
        console.log("All leads of given project => ", allLeads)
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
            role: "LEAD"
        }
        let projection = {};

        let leadsRes = await User.getAllUsers(findData, projection);
        console.log("Leads res => ", leadsRes.length)
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
        role: {$in : ['CONTRIBUTOR']}
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

    console.log("updateStatusRes",updateStatusRes)
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
		
		if(data.role == 'LEAD'){
			userRes = (projectRes && projectRes.managedBy) || []
		}else{
			userRes = (projectRes && projectRes.accessibleBy) || []
		}
		let userPayload = {
			_id : { $nin : userRes},
			role : data.role
		}
		let sortCriteria = {
			createdAt : -1
		}
		projection = {
			name : 1,
			role : 1,
			email : 1
		}
		let usersData = await User.getAllUsers(userPayload, projection, sortCriteria);
        console.log("All unassigned user of given project => ", usersData)
        // userRes = userRes.filter((e) => {
        //     return (e.isActive && (!e.isBlocked) && e.emailVerified)
        // })

        return { data: usersData, error: false }
    } catch (err) {
        console.log("createPayloadAndGetUnAssignedUserOfSpecificProject Error : ", err)
        return { data: err, error: true }
    }
}