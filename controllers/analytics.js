const { sendResponse } = require('../helpers/sendResponse')
const rating = require('../controllers/rating')

const getAllUsersRatingByRatingDuration = async (req, res, next) => {
	let data = req.data

	if (data.ratingDuration == "Yearly") {
		if (!data.year) {
			return res.status(400).send(sendResponse(400, "Params Missing", 'getAllUsersRatingByRatingDuration', null, req.data.signature))
		}
		let ratingRes = await rating.getAllUsersRatingForYear(data)
		if (ratingRes.error) {
			return res.status(500).send(sendResponse(500, '', 'getAllUsersRatingByRatingDuration', null, req.data.signature))
		}
		return res.status(200).send(sendResponse(200, 'Ratings Fetched', 'getAllUsersRatingByRatingDuration', ratingRes.data, req.data.signature))

	} else if (data.ratingDuration == "Monthly") {

		if (!data.month || !data.year) {
			return res.status(400).send(sendResponse(400, "Params Missing", 'getAllUsersRatingByRatingDuration', null, req.data.signature))
		}
		let ratingRes = await rating.getAllUsersRatingForMonth(data)
		if (ratingRes.error) {
			return res.status(500).send(sendResponse(500, '', 'getAllUsersRatingByRatingDuration', null, req.data.signature))
		}
		return res.status(200).send(sendResponse(200, 'Ratings Fetched', 'getAllUsersRatingByRatingDuration', ratingRes.data, req.data.signature))

	} else {
		if (!data.date || !data.month || !data.year) {
            console.log(data.date,data.month,data.year)
			return res.status(400).send(sendResponse(400, 'Missing params', 'getRatingByDate', null, req.data.signature))
		}
		let ratingRes = await rating.createPayloadAndGetDayRating(data)
		if (ratingRes.error) {
			return res.status(500).send(sendResponse(500, '', 'getAllUsersRatingByRatingDuration', null, req.data.signature))
		}
		return res.status(200).send(sendResponse(200, 'Ratings Fetched', 'getAllUsersRatingByRatingDuration', ratingRes.data, req.data.signature))
	}
}
exports.getAllUsersRatingByRatingDuration = getAllUsersRatingByRatingDuration;