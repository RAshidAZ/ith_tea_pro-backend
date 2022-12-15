
const { sendResponse } = require('../helpers/sendResponse')


const getUserRating = (req, res) => {
    console.log('getUserRating data : ', req.data)
    res.send(sendResponse(200, 'success', 'getUserRating', null, req.data.signature))
}
exports.getUserRating = getUserRating


