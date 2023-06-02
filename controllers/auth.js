const mongoose = require('mongoose');
const moment = require("moment");
const atob = require("atob");
const btoa = require('btoa')

// Helpers Functions
const utilities = require('../helpers/security');
const emailUtitlities = require("../helpers/email");

const { sendResponse } = require('../helpers/sendResponse')
const { Auth, Credentials, User } = require('../query');

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

    if (data.password !== data.confirmPassword) {
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

//Login
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

	if (user.data.isDeleted) {
        return res.status(401).send(sendResponse(401, "User deleted", 'userLogin', null, req.data.signature))
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

    let PasswordComparsion = await comparePassword(data);
    if (PasswordComparsion.error) {
        return res.status(400).send(sendResponse(400, "Wrong password", 'userLogin', PasswordComparsion.data, req.data.signature))
    }

    let encryptUserData = encryptData(data);
    if (encryptUserData.error) {
        return res.status(401).send(sendResponse(401, encryptUserData.data, 'userLogin', null, req.data.signature))
    }
    return res.status(200).send(sendResponse(200, "Successfully logged in", 'userLogin', encryptUserData.data, req.data.signature))
}
exports.userLogin = userLogin;

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

const comparePassword = async function (data) {

    console.log("comparePassword");
    let hash = null;
    let salt = null;

    try {
        hash = data.userCredentials.password;
        salt = data.userCredentials.salt;

		if (data.oldPassword) {
			data.password = data.oldPassword;
		}

        let comparePasswordResult = utilities.comparePassword(data.password, hash, salt);
        if (comparePasswordResult.error) {
            return { data: comparePasswordResult.data, error: true }
        }
        return { data: comparePasswordResult.data, error: false }
    } catch (error) {
        return { data: error, error: true }
    }
};

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

const resendPasswordSetupLink = async (req, res, next) => {
    let data = req.body;
	// if(!["SUPER_ADMIN", "ADMIN", "LEAD"].includes(data.auth.role)){
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

		console.log("================token found in log")
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

const resetPassword = async (req, res, next) => {

    let data = req.data;
    if (!data.newPassword || !data.confirmPassword || !data.oldPassword) {
        return res.status(400).send(sendResponse(400, "Params Missing", 'resetPassword', null, req.data.signature))
    }

	if (data.newPassword != data.confirmPassword) {
        return res.status(400).send(sendResponse(400, "New/Confirm password do not match", 'resetPassword', null, req.data.signature))
	}

	data.userId = mongoose.Types.ObjectId(data.auth.id)

	//step 1
	let userCredentials = await utilities.readUserByCredentials(data)
	
	if(userCredentials.error){
		return res.status(400).send(sendResponse(400, userCredentials.data, 'resetPassword', null, req.data.signature))
	}
	
	if(!userCredentials.data){
		return res.status(400).send(sendResponse(400, "User Not Found", 'resetPassword', null, req.data.signature))
	}
	data.userCredentials = userCredentials.data

	
	//step 2
	let PasswordComparsion = await comparePassword(data);
    if (PasswordComparsion.error) {
		return res.status(401).send(sendResponse(401, "Password Mismatch", 'resetPassword', PasswordComparsion.data, req.data.signature))
    }

	//reset password log

	data.device = req.device.type
	data.ip = req.ip
	// data.browser = parser(req.headers["user-agent"]).browser.name
	let resetPasswordLog = await createResetPasswordRequest(data);
	if(resetPasswordLog.err){
		return res.status(500).send(sendResponse(500, '', 'resetPassword', null, req.data.signature))
	}

	//step 3
	let generatedHashSalt = utilities.generatePassword(data.newPassword);
    data.generatedHashSalt = generatedHashSalt;
	
	//step 4

	let updateUserPassword = await updatePassword(data);
	if(updateUserPassword.err){
		return res.status(500).send(sendResponse(500, '', 'resetPassword', null, req.data.signature))
	}

    return res.status(200).send(sendResponse(200, "Password changed successfully", 'resetPassword', null, null))
};
exports.resetPassword = resetPassword;

const updatePassword = async function (data) {
    let { hash, salt } = data.generatedHashSalt;
    if (!hash || !salt) {
        return cb(responseUtilities.responseStruct(500, "no hash/salt", "updatePassword", null, data.req.signature));
    }
    let findData = {
        userId: data.userId
    }
    let updateData = {
        password: hash,
        salt: salt
    }

    try {
        let updateCredentials = await Credentials.updateCredentials(findData, updateData);
        return {
            data: updateCredentials,
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

const createResetPasswordRequest = async function (data) {
    let userCredentials = data.userCredentials
    if (!userCredentials || !userCredentials.userId) {
        return cb(responseUtilities.responseStruct(400, "User not found", "createResetPasswordRequest", null, data.req.signature));
    }

    let payload = {
        email: userCredentials.userId.email,
		device : data.device,
		ip : data.ip,
		browser : data.browser
    }

    try {
        let createResetPasword = await Auth.createResetPaswordRequest(payload);
        return {
            data: createResetPasword,
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

const forgotPassword = async (req, res, next) => {

    let data = req.data;
	if (!data.email) {
        return res.status(400).send(sendResponse(400, "Email required", 'forgotPassword', null, req.data.signature))
    }
	data.purpose = 'Forgot-Password'
    
	//find user
	let findUser = { email : data.email}
	let userRes = await User.userfindOneQuery(findUser);
    console.log(userRes)
	if(!userRes){
        return res.status(400).send(sendResponse(400, "User not found", 'forgotPassword', null, req.data.signature))
	}
    
	data.userId = mongoose.Types.ObjectId(userRes._id)
    console.log(data.userId)
	//check user details
	let userCredentials = await utilities.readUserByCredentials(data)
    console.log(userCredentials)
	
	if(userCredentials.error){
		return res.status(400).send(sendResponse(400, userCredentials.data, 'forgotPassword', null, req.data.signature))
	}
	
	if(!userCredentials.data){
		return res.status(400).send(sendResponse(400, "User Not Found", 'forgotPassword', null, req.data.signature))
	}
	data.userCredentials = userCredentials.data

	
	//step 2
	let generatedOtpData = await generateOTP(data);
    if (generatedOtpData.error) {
		return res.status(500).send(sendResponse(500, '', 'forgotPassword', null, req.data.signature))
    }

	let sendForgotPasswordOtp = emailUtitlities.sendOtpToUser(data)

    return res.status(200).send(sendResponse(200, "Otp sent on email successfully", 'forgotPassword', null, null))
};
exports.forgotPassword = forgotPassword;

const generateOTP = async function (data) {
    if (!data.email) {
        return cb(responseUtilities.responseStruct(400, "User not found", "generateOTP", null, data.req.signature));
    }

    let findOtpLog = {
        email: data.email,
		isUsed: false,
        isExpired: false,
        purpose: data.purpose || 'Signup'
    }

    try {
        let otpLogRes = await Auth.findOtpLog(findOtpLog);
		if(otpLogRes){
			let payload = {_id : otpLogRes._id}
			let updatePayload = {isUsed : true}
			let updatedOtpLogRes = await Auth.findAndUpdateOtpLog(payload, updatePayload)
		}

		let generatedOTP
        if (process.env.DEV == 'true' || process.env.DEV == true) {
            generatedOTP = process.env.OTP_FIXED;
        } else {
			generatedOTP = Math.floor(1000 + Math.random() * 9000);
		}
		data.generatedOTP = generatedOTP
        let insertData = {
            email: data.email,
            otp: generatedOTP,
            otpExpiration: (new Date().getTime() + 1000 * 60 * 30),
            purpose: data.purpose || "Signup"

        }

		let createOtpLog = await Auth.createOtpLog(insertData)
        return {
            data: createOtpLog,
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

const otpVerify = async (req, res, next) => {

    let data = req.data;
	if (!data.email || !data.otp) {
        return res.status(400).send(sendResponse(400, "Email/otp required", 'otpVerify', null, req.data.signature))
    }
	data.purpose = 'Forgot-Password'
    
	//find otp
	let find_data = {
        email: data.email,
        otp: data.otp,
        isUsed: false,
        isExpired: false,
		purpose : data.purpose || "Signup"
    }

	let otpLogRes = await Auth.findOtpLog(find_data);

	if(!otpLogRes){
        return res.status(400).send(sendResponse(400, "Wrong OTP/email or OTP already used!", 'otpVerify', null, req.data.signature))
	}
	

	if (new Date().getTime() > otpLogRes.otpExpiration) {
		let find_data = { _id : otpLogRes._id}
		let updateOtpLog = { isExpired: true }
		let updatedOtpLogRes = await Auth.findAndUpdateOtpLog(find_data, updateOtpLog);
        return res.status(400).send(sendResponse(400, "OTP expired!", 'otpVerify', null, req.data.signature))
	}


	find_data = {
		_id : otpLogRes._id,
		email: data.email
	}
	let update_data = {
		isUsed: true
	}

	let updatedOtpLogRes = await Auth.findAndUpdateOtpLog(find_data, update_data);

	let sendData = {
		emailVerified: true
	}
	if(data.purpose == 'Forgot-Password'){
		sendData["otpLogId"] =  btoa(otpLogRes._id.toString());
	}

    return res.status(200).send(sendResponse(200, "Otp verified", 'forgotPassword', sendData, null))
};
exports.otpVerify = otpVerify;

const forgotChangePassword = async (req, res, next) => {

    let data = req.data;
	if (!data.password || !data.repeat || !data.otpLogId) {
        return res.status(400).send(sendResponse(400, "Missing params", 'forgotChangePassword', null, req.data.signature))
    }

	if (data.password != data.repeat) {
        return res.status(400).send(sendResponse(400, "Password and repeat password do not match", 'forgotChangePassword', null, req.data.signature))
    }

	data.otpLogId = atob(data.otpLogId);

	if (!mongoose.isValidObjectId(data.otpLogId)) {
        return res.status(400).send(sendResponse(400, "Invalid request", 'forgotChangePassword', null, req.data.signature))
	}

	let findData = {
		_id : data.otpLogId,
		purpose : "Forgot-Password",
		isUsed : true,
		isExpired : false,
		tokenVerified : false
	}

	let otpLogRes = await Auth.findOtpLog(findData);

	if(!otpLogRes){
        return res.status(400).send(sendResponse(400, "Invalid request", 'forgotChangePassword', null, req.data.signature))
	}

	data.email = otpLogRes.email

	let findUser = {email : otpLogRes.email}
	let userRes = await User.userfindOneQuery(findUser);
	if(!userRes){
        return res.status(400).send(sendResponse(400, "User not found", 'forgotPassword', null, req.data.signature))
	}

	data.userId = mongoose.Types.ObjectId(userRes._id)
	
	//check user details
	let userCredentials = await utilities.readUserByCredentials(data)
	
	if(userCredentials.error){
		return res.status(400).send(sendResponse(400, userCredentials.data, 'forgotPassword', null, req.data.signature))
	}

	if(!userCredentials.data){
		return res.status(400).send(sendResponse(400, "User Not Found", 'forgotPassword', null, req.data.signature))
	}
	data.userCredentials = userCredentials.data

	let generatedHashSalt = utilities.generatePassword(data.repeat);
    data.generatedHashSalt = generatedHashSalt;

	let updateUserPassword = await updatePassword(data);
	if(updateUserPassword.err){
		return res.status(500).send(sendResponse(500, '', 'resetPassword', null, req.data.signature))
	}

	let otpPyload = {
		_id : data.otpLogId
	}
	let updatePayload = { tokenVerified : true }
	let updatedOtpLog = await Auth.findAndUpdateOtpLog(otpPyload, updatePayload);

	if(updatedOtpLog.err){
		return res.status(500).send(sendResponse(500, '', 'resetPassword', null, req.data.signature))
	}
    return res.status(200).send(sendResponse(200, "Password changed successfully", 'forgotPassword', null, null))

}
exports.forgotChangePassword = forgotChangePassword;