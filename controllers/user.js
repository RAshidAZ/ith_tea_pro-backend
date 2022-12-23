const { sendResponse } = require('../helpers/sendResponse');
const queryController = require('../query')
const { User } = queryController;


const getAllUsers = async (req, res, next) => {
    let data = req.data;

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
