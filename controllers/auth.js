const mongoose = require('mongoose');
const moment = require("moment");

// Helpers Functions
const utilities = require('../helpers/security');

const { sendResponse } = require('../helpers/sendResponse')
const { Auth, Credentials } = require('../query');


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
        console.log("User Find => ", user);
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
        console.log("Register User Response => ", registerUser)
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
        console.log("Create Credentials User Response => ", registerUser)
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

const findUserCredentials = async function (data) {
    try {

        let findData = {
            userId: data.userId
        };
        let userCredentials = await Auth.findUserCredentials(findData);
        console.log("User Credentials Find => ", userCredentials)
        return { data: userCredentials, error: false }

    } catch (error) {
        return { data: error, error: true }
    }
}

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

const encryptData = function (data) {

    let timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    let userData = {
        id: data.user._id,
        email: data.user.email,
        accountId: data.userCredentials.accountId,
        createdAt: timestamp,
        tokenType: "auth",
        role: data.user.role,
        provider: data.user.provider
    };

    let generateToken = utilities.encryptData(userData);
    console.log("generateToken", generateToken)
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