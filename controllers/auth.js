const mongoose = require('mongoose');
const moment = require("moment");
const atob = require("atob");
const btoa = require('btoa')

// Helpers Functions
const utilities = require('../helpers/security');
const emailUtitlities = require("../helpers/email");

const { sendResponse } = require('../helpers/sendResponse')
const { Auth, Credentials } = require('../query');

//roles from config
const role = JSON.parse(process.env.role)

//register user based on email/password
const userRegistry = async (req, res, next) => {

    let data = req.data;
    data.purpose = "signup";
    if (!data.email || !data.password || !data.confirmPassword) {
        return res.status(400).send(sendResponse(400, "Params Missing", 'userRegistry', null, req.data.signature))
    }

    let findUser = await findUserExistence(data);

    if (findUser.error) {
        console.log("Error in checkIfEmailExist")
        return res.status(500).send(sendResponse(500, "Server Boom", "userRegistry", null, null))
    }

    if (findUser.data) {
        //Check User Credentials   
        // let checkUserCredentials = 
    }

    if (data.password != data.confirmPassword) {
        return res.status(400).send(sendResponse(400, "Password and Repeat Password must be same", "validatePassword", null, null))
    }

    if (!utilities.validatePassword(data.password)) {
        return res.status(400).send(sendResponse(400, "Password Too Weak", "validatePassword", null, null))
    }

    let generatedHashSalt = utilities.generatePassword(data.password);

    data.generatedHashSalt = generatedHashSalt;
    console.log("Password Generated => ", data.generatedHashSalt);

    let registerUser = await createPayloadAndRegisterUser(data);
    data.registerUser = registerUser;

    let insertUserCredentials = await createPayloadAndInsertCredentials(data);

    return res.status(200).send(sendResponse(200, "User Registered Successfully", 'userRegistry', registerUser, null))

    // waterFallFunctions.push(async.apply(generateOTP, data));
    // waterFallFunctions.push(async.apply(sendRegistryMail, data));
    // async.waterfall(waterFallFunctions, cb);
};
exports.userRegistry = userRegistry;

//check if user exist based on email, and fecth user details
const findUserExistence = async function (data) {
    try {

        let findData = {
            email: data.email
        };
        let user = await Auth.findUser(findData);
        return { data: user, error: false }
    } catch (error) {
        return { data: error, error: true }
    }
}

//find user details based on userId
const findUserExistenceByUserId = async function (data) {
    try {

        let findData = {
            _id: data.userId
        };
        let user = await Auth.findUser(findData);
        return { data: user, error: false }
    } catch (error) {
        return { data: error, error: true }
    }
}

//add/update registry details of user
const createPayloadAndRegisterUser = async function (data) {

    let { hash, salt } = data.generatedHashSalt;
    if (!hash || !salt) {
        return cb(responseUtilities.responseStruct(500, "no hash/salt", "registerUser", null, data.req.signature));
    }
    let findData = {
        email: data.email
    }
    let updateData = {
        email: data.email,
        password: hash,
        salt: salt,
        provider: 'email'
    }
    let options = {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
    }

    try {
        let registerUser = await Auth.findAndUpdateUser(findData, updateData, options);
        let sendData = {
            email: res.email,
            emailVerified: res.emailVerified
        }
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

//add user credentials
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
        isActive:true,
        emailVerified:true
    }
    if (data.employeeId) {
        updateData.employeeId = employeeId
    }
    let options = {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
    }

    try {
        let insertCredentials = await Credentials.createCredentials(findData, updateData, options);
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

//create payload for user credentials
const createPayloadAndInsertCredentialsForUser = async function (data) {
    let { hash, salt } = data.generatedHashSalt;
    if (!hash || !salt) {
        return cb(responseUtilities.responseStruct(500, "no hash/salt", "createPayloadAndInsertCredentialsForUser", null, data.req.signature));
    }
    let findData = {
        userId: data.userId
    }
    let updateData = {
        userId: data.userId,
        password: hash,
        salt: salt,
        accountId: data.accountId,
        isActive: true,
        isBlocked: false,
        emailVerified: true
    }
    
    let options = {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
    }

    try {
        let insertCredentials = await Credentials.createCredentials(findData, updateData, options);
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

//for login
const userLogin = async (req, res, next) => {
    let data = req.body;
    if (!data.email || !data.password) {
        return res.status(400).send(sendResponse(400, "Email and Password are required", 'userLogin', null, req.data.signature))
    }
    let user = await findUserExistence(data);
    if (user.error) {
        return res.status(400).send(sendResponse(400, user.data, 'userLogin', null, req.data.signature))
    }
    if (!user || !user.data) {
        return res.status(400).send(sendResponse(400, "User not found", 'userLogin', null, req.data.signature))
    }

    data.user = user.data;
    console.log("User ", data.user)
    data.userId = user.data._id;

    let userCredentials = await findUserCredentials(data);
    if (userCredentials.error) {
        return res.status(500).send(sendResponse(500, user.data, 'userLogin', null, req.data.signature))
    }
    if (!userCredentials || !userCredentials.data) {
        return res.status(400).send(sendResponse(400, "Credentials invalid", 'userLogin', null, req.data.signature))
    }

    data.userCredentials = userCredentials.data;

    let PasswordComparsion = comparePassword(data);
    if (PasswordComparsion.error) {
        return res.status(401).send(sendResponse(401, "Password Mismatch", 'userLogin', PasswordComparsion.data, req.data.signature))
    }

    let encryptUserData = encryptData(data);
    if (encryptUserData.error) {
        return res.status(401).send(sendResponse(401, encryptUserData.data, 'userLogin', null, req.data.signature))
    }
    return res.status(200).send(sendResponse(200, "Successfully logged in", 'userLogin', encryptUserData.data, req.data.signature))
}
exports.userLogin = userLogin;

//fetch user credentials
const findUserCredentials = async function (data) {
    try {

        let findData = {
            userId: data.userId
        };
        let userCredentials = await Auth.findUserCredentials(findData);
        return { data: userCredentials, error: false }

    } catch (error) {
        return { data: error, error: true }
    }
}

//compare password
const comparePassword = function (data) {

    console.log("comparePassword");
    let hash = null;
    let salt = null;

    try {
        hash = data.userCredentials.password;
        salt = data.userCredentials.salt;
        let comparePasswordResult = utilities.comparePassword(data.password, hash, salt);
        if (comparePasswordResult.error) {
            return { data: comparePasswordResult.data, error: true }
        }
        return { data: comparePasswordResult.data, error: false }
    } catch (error) {
        return { data: error, error: true }
    }
};


//encrypt user details
const encryptData = function (data) {

    let timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    let userData = {
        id: data.user._id,
        email: data.user.email,
        accountId: data.userCredentials.accountId,
		profileCompleted : data.user.profileCompleted,
        createdAt: timestamp,
        tokenType: "auth",
        role: data.user.role,
        provider: data.user.provider
    };

    let generateToken = utilities.encryptData(userData);
    if (generateToken.error) {
        return generateToken
    }

    let sendData = {
        user: userData,
        token: generateToken.data
    }
    return {
        data: sendData,
        error: false
    }
};

//verify generated password link/token sent to user
const verifyPasswordToken = async (req, res, next) => {

    let data = req.data;
    if (!data.token) {
        return res.status(400).send(sendResponse(400, "Params Missing", 'validateToken', null, req.data.signature))
    }

    let findPasswordToken = await findUserByPasswordToken(data);

    if (findPasswordToken.error) {
        console.log("Error in checkIfEmailExist")
        return res.status(500).send(sendResponse(500, "Error in finding user by password-token", "validateToken", null, null))
    }

    if (!findPasswordToken.data) {
		console.log("============no token data")
        return res.status(400).send(sendResponse(400, "Invalid request", 'validateToken', null, req.data.signature))
    }

	if (new Date() > new Date(findPasswordToken.data.tokenExpiration)) {
        return res.status(400).send(sendResponse(400, "Link expired, Please contact admin to resend password setup link", 'validateToken', null, req.data.signature))
    }

	let findUserCredential = {userId : findPasswordToken.data.userId}
    let credentials = await Credentials.findOneQuery(findUserCredential);
	if(credentials && credentials.userId){
        return res.status(400).send(sendResponse(400, "Password already setup", "validateToken", null, null))
	}

    return res.status(200).send(sendResponse(200, "User need to setup password", 'validateToken', {email : findPasswordToken.data.email}, null))
};
exports.verifyPasswordToken = verifyPasswordToken;

//fetch user based on password link/token
const findUserByPasswordToken = async function (data) {
    try {

        let findData = {
            token: atob(data.token)
        };
        let passwordSetupToken = await Auth.findPasswordSetupToken(findData);
        return { data: passwordSetupToken, error: false }
    } catch (error) {
        return { data: error, error: true }
    }
}

//add user credentials for password setup
const setPassword = async (req, res, next) => {
    let data = req.body;
    if (!data.email || !data.password || !data.confirmPassword) {
        return res.status(400).send(sendResponse(400, "Email and Password are required", 'setPassword', null, req.data.signature))
    }
	if (data.password != data.confirmPassword) {
        return res.status(400).send(sendResponse(400, "Password and confirm password don't match", 'setPassword', null, req.data.signature))
    }
    let user = await findUserExistence(data);
    if (user.error) {
        return res.status(400).send(sendResponse(400, user.data, 'setPassword', null, req.data.signature))
    }
    if (!user || !user.data) {
        return res.status(400).send(sendResponse(400, "User not found", 'setPassword', null, req.data.signature))
    }

	let findUserCredential = {userId : user._id}
    let credentials = await Credentials.findOneQuery(findUserCredential);
	if(credentials && credentials.userId){
        return res.status(400).send(sendResponse(400, "Password already setup", "validateToken", null, null))
	}

    let generatedHashSalt = utilities.generatePassword(data.password);
    data.generatedHashSalt = generatedHashSalt;
    let accountId = await utilities.generateAccountId();
    data.accountId = accountId;
    console.log("Password accountId => ", data.accountId);

	data.userId = user.data._id
	let insertUserCredentials = await createPayloadAndInsertCredentialsForUser(data);

    if (insertUserCredentials.error) {
        return res.status(500).send(sendResponse(500, '', 'addNewUser', "setPassword", req.data.signature))
    }
    
    
    return res.status(200).send(sendResponse(200, "Successfully password setup", 'userLogin', "setPassword", req.data.signature))
}
exports.setPassword = setPassword;

//resend password setup link to user
const resendPasswordSetupLink = async (req, res, next) => {
    let data = req.body;
	// if(![role.superadmin, role.admin, role.lead].includes(data.auth.role)){
    //     return res.status(401).send(sendResponse(401, "Not allowed to resend password setup link", 'resendPasswordSetupLink', null, req.data.signature))

	// }
    if (!data.userId) {
        return res.status(400).send(sendResponse(400, "UserId required", 'resendPasswordSetupLink', null, req.data.signature))
    }

    let user = await findUserExistenceByUserId(data);
    if (user.error) {
        return res.status(400).send(sendResponse(400, user.data, 'resendPasswordSetupLink', null, req.data.signature))
    }
    if (!user || !user.data) {
        return res.status(400).send(sendResponse(400, "User not found", 'resendPasswordSetupLink', null, req.data.signature))
    }

	
	
	let findUserCredential = {userId : data.userId}
    let credentials = await Credentials.findOneQuery(findUserCredential);
	
	if(credentials && credentials.userId){
		// return res.status(400).send(sendResponse(400, "Password already setup", "resendPasswordSetupLink", null, null))
	}
	
	let findPasswordTokens = await findUserPasswordSetupTokens(data);
	

    if (findPasswordTokens.error) {
        return res.status(500).send(sendResponse(500, '', 'resendPasswordSetupLink', null, req.data.signature))
    }

	let passwordTokens = findPasswordTokens.data
	let randomString = null;
	if(passwordTokens.length){
		randomString = passwordTokens[0].token

	}else{
		randomString = Math.random().toString(36).substring(2) + data.userId.toString().substring(15,24);
		let payload = {
			email : user.data.email,
			token : randomString,
			userId : data.userId
		}
		let addPasswordSetupToken = await Auth.addPasswordSetupToken(payload);
		if(addPasswordSetupToken.err){
			return res.status(500).send(sendResponse(500, '', 'resendPasswordSetupLink', null, req.data.signature))
		}
		
	}
	data.email = user.data.email
	data.signupToken = btoa(randomString).toString();
	data.name = user.data.name
	data.employeeId = user.data.employeeId
	data.department = user.data.department
	data.designation = user.data.designation

	let sendWelcomeEmailRes = await emailUtitlities.sendWelcomeEmail(data);
    
    return res.status(200).send(sendResponse(200, "Successfully password setup link sent", 'resendPasswordSetupLink', null, req.data.signature))
}
exports.resendPasswordSetupLink = resendPasswordSetupLink;

//fetch user pasword setup links/tokens
const findUserPasswordSetupTokens = async function (data) {
    try {

        let findData = {
            userId : data.userId,
			tokenExpiration : { $gt : new Date()}
        };
        let passwordSetupTokens = await Auth.findPasswordSetupTokens(findData);
        return { data: passwordSetupTokens, error: false }
    } catch (error) {
        return { data: error, error: true }
    }
}