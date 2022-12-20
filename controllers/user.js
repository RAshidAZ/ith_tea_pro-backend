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
