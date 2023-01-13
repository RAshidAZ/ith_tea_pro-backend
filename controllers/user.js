const { sendResponse } = require('../helpers/sendResponse');
const queryController = require('../query')
const { User, Auth, Credentials } = queryController;
const utilities = require('../helpers/security');



const getAllUsers = async (req, res, next) => {
    let data = req.data;

    console.log("-------------------", data.auth)
    let userRes = await findAllUser(data)
    console.log('userRes : ', userRes)
    if (userRes.error) {
        return res.status(500).send(sendResponse(500, '', 'getAllUsers', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Users Fetched', 'getAllUsers', userRes.data, req.data.signature))
}
exports.getAllUsers = getAllUsers


const findAllUser = async function (data) {
    try {
        let payload = {
            role: 'USER'
        }
        let projection = {

        }
        let userRes = await User.getAllUsers(payload, projection)
        return { data: userRes, error: false }
    } catch (err) {
        console.log("findAllUser Error : ", err)
        return { data: err, error: true }
    }
}
exports.findAllUser = findAllUser


const editUserDetails = async (req, res, next) => {
    let data = req.data;

    if (!data.userId) {
        return res.status(400).send(sendResponse(400, "", 'editUserDetails', null, req.data.signature))
    }
    let userRes = await createPayloadAndEditUserDetails(data)
    console.log('userRes : ', userRes)
    if (userRes.error) {
        return res.status(500).send(sendResponse(500, '', 'editUserDetails', null, req.data.signature))
    }

    return res.status(200).send(sendResponse(200, 'Users Fetched', 'editUserDetails', userRes.data, req.data.signature))
}
exports.editUserDetails = editUserDetails


const createPayloadAndEditUserDetails = async function (data) {
    try {
        let payload = {
            _id: data.userId,
        }
        let updatePayload = {
            name: data.name,
            email: data.email,
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
    if (!data.name || !data.email || !data.employeeId || !data.department || !data.wings || !data.designation || !data.role || !data.password) {
        return res.status(400).send(sendResponse(400, "", 'addNewUser', null, req.data.signature))
    }
    let emailRes = await checkEmailExists(data);
    console.log('emailRes : ', emailRes)
    if (emailRes.error) {
        return res.status(500).send(sendResponse(500, '', 'addNewUser', null, req.data.signature))
    }
    if (emailRes.data) {
        return res.status(400).send(sendResponse(400, 'Email Already Exists', 'addNewUser', null, req.data.signature))
    }
    let employeeIdRes = await checkEmployeeIdExists(data);
    console.log('employeeIdRes : ', employeeIdRes)
    if (employeeIdRes.error) {
        return res.status(500).send(sendResponse(500, '', 'addNewUser', null, req.data.signature))
    }
    if (employeeIdRes.data) {
        return res.status(400).send(sendResponse(400, 'Employee Id Already Exists', 'addNewUser', null, req.data.signature))
    }
    let generatedHashSalt = utilities.generatePassword(data.password);
    data.generatedHashSalt = generatedHashSalt;
    let accountId = await utilities.generateAccountId();
    data.accountId = accountId;
    console.log("Password accountId => ", data.accountId);

    let registerUser = await createPayloadAndRegisterUser(data);
    data.registerUser = registerUser.data;
    console.log('registerUser ---------------: ', registerUser)
    let insertUserCredentials = await createPayloadAndInsertCredentials(data);
    console.log('insertUserCredentials : ', insertUserCredentials)

    if (insertUserCredentials.error) {
        return res.status(500).send(sendResponse(500, '', 'addNewUser', null, req.data.signature))
    }
    return res.status(200).send(sendResponse(200, 'Users Created', 'addNewUser', null, req.data.signature))
}
exports.addNewUser = addNewUser

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
        let userRes = await Credentials.findOneQuery(payload, projection)
        return { data: userRes, error: false }
    } catch (err) {
        console.log("createPayloadAndEditUserDetails Error : ", err)
        return { data: err, error: true }
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
        provider: 'email',
        department: data.department,
        designation: data.designation,
        name: data.name,
        role: data.role,
        wings: data.wings
    }
    let options = {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
    }
    try {
        let registerUser = await Auth.findAndUpdateUser(findData, updateData, options);
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
        accountId: data.accountId
    }
    if (data.employeeId) {
        updateData.employeeId = data.employeeId
    }
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