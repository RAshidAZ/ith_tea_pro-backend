
const mongoose = require('mongoose');
const moment = require('moment');
const { sendResponse } = require('../helpers/sendResponse')
const queryController = require('../query')
const { Rating, User, Project } = queryController;

const commentController = require('./comment');

const actionLogController = require("../controllers/actionLogs");

const getUserRating = async (req, res, next) => {
	let data = req.data;

	if (!data.userId || !data.date || !data.month || !data.year) {
		return res.status(400).send(sendResponse(400, "Params Missing", 'getUserRating', null, req.data.signature))
	}

	let userRating = await findUserRatingGivenDate(data)
	if (userRating.error) {
		return res.status(500).send(sendResponse(500, "", 'getUserRating', null, req.data.signature))
	}
	if (!userRating.data) {
		return res.status(400).send(sendResponse(400, "Rating Not Given", 'getUserRating', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, 'Rating Fetched', 'getUserRating', userRating.data, req.data.signature))
}
exports.getUserRating = getUserRating


const insertUserRating = async (req, res, next) => {
	let data = req.data;

	if (!data.rating || !data.userId || !data.date || !data.month || !data.year) {
		return res.status(400).send(sendResponse(400, "Params Missing", 'insertUserRating', null, req.data.signature))
	}
	//TODO: Change after auth is updated
	data.givenBy = data.auth.id
	// data.givenBy = "601e3c6ef5eb242d4408dcc8"

	let checkRes = await findUserRatingGivenDate(data)
	if (checkRes.error) {
		return res.status(500).send(sendResponse(500, '', 'insertUserRating', null, req.data.signature))
	}
	if (checkRes.data) {
		return res.status(400).send(sendResponse(400, "Rating Already Given", 'insertUserRating', null, req.data.signature))
	}

	if (data.comment) {
		let commentRes = await commentController.createPayloadAndInsertComment(data)
		if (commentRes.error || !commentRes.data) {
			return res.status(500).send(sendResponse(500, '', 'insertUserRating', null, req.data.signature))
		}
		data.commentId = commentRes.data._id
	}

	let ratingRes = await createPayloadAndInsertRating(data)
	if (ratingRes.error || !ratingRes.data) {
		return res.status(500).send(sendResponse(500, '', 'insertUserRating', null, req.data.signature))
	}

	let actionLogData = {
		actionTaken: 'RATE_TASK',
		actionBy: data.auth.id,
		userId : data.userId,
		ratingId : ratingRes.data._id
	}
	data.actionLogData = actionLogData;
	let addActionLogRes = await actionLogController.addRatingLog(data);

	if (addActionLogRes.error) {
		return res.status(500).send(sendResponse(500, '', 'insertUserTask', null, req.data.signature))
	}

	return res.status(200).send(sendResponse(200, 'Rating Inserted', 'insertUserRating', null, req.data.signature))
}
exports.insertUserRating = insertUserRating

const updateUserRating = async (req, res, next) => {
	let data = req.data;

	if (!data.hasOwnProperty('rating') || !data.ratingId) {
		return res.status(400).send(sendResponse(400, "Params Missing", 'updateUserRating', null, req.data.signature))
	}

	let updateRes = await createPayloadAndUpdateRating(data)
	if (updateRes.error) {
		return res.status(500).send(sendResponse(500, '', 'updateUserRating', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, 'Rating Updated', 'updateUserRating', null, req.data.signature))
}
exports.updateUserRating = updateUserRating

const getMonthAllUserRating = async (req, res, next) => {
	let data = req.data;

	console.log("=============month and year", data.month, data.year)
	if (!data.month || !data.year) {
		return res.status(400).send(sendResponse(400, "Params Missing", 'getMonthAllUserRating', null, req.data.signature))
	}

	let ratingRes = await getAllUsersRatingForMonth(data)
	if (ratingRes.error) {
		return res.status(500).send(sendResponse(500, '', 'getMonthAllUserRating', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, 'Ratings Fetched', 'getMonthAllUserRating', ratingRes.data, req.data.signature))
}
exports.getMonthAllUserRating = getMonthAllUserRating

const createPayloadAndInsertRating = async function (data) {
	try {
		let payload = {
			userId: data.userId,
			givenBy: data.givenBy,
			rating: data.rating,
			comments: [data.commentId],
			date: data.date,
			month: data.month,
			year: data.year,
		}
		let insertRes = await Rating.insertUserRating(payload)
		return { data: insertRes, error: false }
	} catch (error) {
		console.log("createPayloadAndInsertRating Error : ", error)
		return { data: error, error: true }
	}
}
const createPayloadAndUpdateRating = async function (data) {
	try {
		let payload = {
			_id: data.ratingId,
		}
		let updatePayload = {
			rating: data.rating
		}
		let updateRes = await Rating.ratingFindOneAndUpdate(payload, updatePayload)
		return { data: updateRes, error: false }
	} catch (error) {
		console.log("createPayloadAndUpdateRating Error : ", error)
		return { data: error, error: true }
	}
}

const findUserRatingGivenDate = async function (data) {
	try {
		let payload = {
			userId: data.userId,
			date: data.date,
			month: data.month,
			year: data.year,
		}
		let projections = {
			_id: 0,
			rating: 1
		}
		let insertRes = await Rating.ratingFindOne(payload, projections)
		return { data: insertRes, error: false }
	} catch (error) {
		console.log("findUserRatingGivenDate Error : ", error)
		return { data: error, error: true }
	}
}

const addCommnetIdInRatingById = async function (data) {
	try {
		let payload = {
			_id: data.ratingId,
		}
		let updatePayload = {
			$addToSet: { comments: data.commentId }
		}
		let insertRes = await Rating.addCommnetIdInRatingById(payload, updatePayload)
		return { data: insertRes, error: false }
	} catch (error) {
		console.log("addCommnetIdInRatingById Error : ", error)
		return { data: error, error: true }
	}
}
exports.addCommnetIdInRatingById = addCommnetIdInRatingById;

const getAllUsersRatingForMonth = async function (data) {
	try {
		let roleFilter = ["SUPER_ADMIN"]
		let findData = { }
		if(data.auth.role == 'CONTRIBUTOR'){
			findData.isDeleted  = false
			roleFilter.push('LEAD')
			roleFilter.push('ADMIN')
		}
		if(data.auth.role == 'LEAD'){
			findData.isDeleted  = false
			roleFilter.push('ADMIN')
		}
		findData.role  = { $nin: roleFilter }
		if(data.userRating){
			findData._id = mongoose.Types.ObjectId(data.auth.id)
		}
		if (!data.userRating && ['LEAD', 'CONTRIBUTOR', 'ADMIN'].includes(data.auth.role) && data.filteredProjects) {
			let allProjectUsers = await filteredProjectsUsers(data)
			if (allProjectUsers && allProjectUsers.data) {
				findData._id = { $in: (allProjectUsers.data).map((el) => mongoose.Types.ObjectId(el)) }
			}
		}

		console.log("================find filter in month rating=============", roleFilter)
		let payload = [

			{
				$match: findData
			},
			{
				$lookup: {
					from: "ratings",
					localField: "_id",
					foreignField: "userId",
					as: "ratings"
				}
			},


			{ $unwind: { path: "$ratings", "preserveNullAndEmptyArrays": true } },
			{
				$match: {
					$or: [
						{ ratings: { $exists: false } },
						{
							$and: [
								{ "ratings.month": parseInt(data.month) },
								{ "ratings.year": parseInt(data.year) }
							]
						}
					]
				}
			},

			{
				$group: {
					_id: "$_id",
					name: { $first: "$name" },
					email: { $first: "$email" },
					ratings: { $push: "$ratings" }
				}
			},
			{ $sort: { "name": 1, "ratings.date": 1 } },
			{

				$project: {

					name: 1,
					email: 1,
					"ratings.rating": 1,
					"ratings.dueDate": 1,
					"ratings.date": 1,
					"ratings.month": 1,
					"ratings.year": 1,
					"ratings.taskIds": 1,
					monthlyAverage: {
						$avg: {
							$map: {
								input: "$ratings.rating",
								as: "rating",
								in: "$$rating"
							}
						}
					}

				}

			}
		]

		// let ratingRes = await Rating.getAllUsersRatingForMonth(payload)
		let ratingRes = await User.getAllUsersRatingForMonth(payload)

		return { data: ratingRes, error: false }
	} catch (error) {
		console.log("getAllUsersRatingForMonth Error : ", error)
		return { data: error, error: true }
	}
}
exports.getAllUsersRatingForMonth = getAllUsersRatingForMonth;


const createPayloadAndGetComments = async function (data) {
	try {
		let payload = [
			{
				$match: { "_id": mongoose.Types.ObjectId(data.ratingId) }
			},
			{
				$lookup: {
					from: "comments",
					localField: "comments",
					foreignField: "_id",
					as: "comments"
				}
			},
			{ $unwind: "$comments" },
			{
				$lookup: {
					from: "users",
					localField: "comments.commentedBy",
					foreignField: "_id",
					as: "comments.commentedBy"
				}
			},
			{ $sort: { "comments.createdAt": -1 } },
			{ $project: { _id: 0, 'rating': "$rating", "comments.comment": 1, "comments._id": 1, "comments.createdAt": 1, "comments.commentedBy.name": 1, } }
		]
		let ratingRes = await Rating.applyAggregateOnRating(payload)
		return { data: ratingRes, error: false }
	} catch (error) {
		console.log("createPayloadAndGetComments Error : ", error)
		return { data: error, error: true }
	}
}
exports.createPayloadAndGetComments = createPayloadAndGetComments

const getWeekRating = async (req, res, next) => {
	let data = req.data;

	let ratingRes = await createPayloadAndGetWeekRating(data)
	if (ratingRes.error) {
		return res.status(500).send(sendResponse(500, '', 'getMonthAllUserRating', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, 'Weekly Ratings Fetched', 'getMonthAllUserRating', ratingRes.data, req.data.signature))
}
exports.getWeekRating = getWeekRating

const createPayloadAndGetWeekRating = async function (data) {
	try {
		let payload = {
			userId: data.auth.id,
		}
		let sortCriteria = {
			date: 1
		}

		const currentDate = moment();

		let weekCount = (data.previousWeek && data.weekCount) ? parseInt(data.weekCount) : 0;

		const monday = currentDate.clone().startOf('week').subtract(weekCount, 'weeks')

		const startDate = monday.format('DD');
		const startMonth = monday.format('MM');
		const startYear = monday.format('YY');

		const fullEndDate = monday.clone().add(6, 'days')
		const endDate = monday.clone().add(6, 'days').format('DD');
		const endMonth = monday.clone().add(6, 'days').format('MM');
		const endYear = monday.clone().add(6, 'days').format('YY');

		console.log("Start date of the week: ", startDate, startMonth, startYear);
		console.log("End date of the week: ", endDate, endMonth, endYear);

		const datesBetween = []
		if (parseInt(endDate) < parseInt(startDate)) {
			while (monday.isSameOrBefore(fullEndDate)) {

				datesBetween.push(parseInt(monday.format('DD')));
				monday.add(1, 'days');
			}
			payload.date = { $in: datesBetween }
			payload.month = { $in: [parseInt(startMonth), parseInt(endMonth)] }
		} else {

			payload.date = { $gte: parseInt(startDate), $lte: parseInt(endDate) }
			payload.month = { $gte: parseInt(startMonth), $lte: parseInt(endMonth) }
		}
		payload.year = { $gte: parseInt(startYear), $lte: parseInt(endYear) }

		let weeklyRating = await Rating.getUserRating(payload, {}, sortCriteria)

		return { data: weeklyRating, error: false }
	} catch (error) {
		console.log("createPayloadAndGetWeekRating Error : ", error)
		return { data: error, error: true }
	}
}
exports.createPayloadAndGetWeekRating = createPayloadAndGetWeekRating;

const getRatingByDate = async (req, res, next) => {
	let data = req.data;

	let ratingRes = await createPayloadAndGetDayRating(data)
	console.log(ratingRes)
	if (ratingRes.error) {
		return res.status(500).send(sendResponse(500, '', 'getRatingByDate', null, req.data.signature))
	}
	return res.status(200).send(sendResponse(200, 'Day Ratings Fetched', 'getMonthAllUserRating', ratingRes.data, req.data.signature))
}
exports.getRatingByDate = getRatingByDate

const createPayloadAndGetDayRating = async function (data) {
	try {
		const day = data.date;
		const month = data.month; 
		const year = data.year;
		
		let payload = {
			userId: data.userId,
			date: day,
			month: month, 
			year: year
		}

		let populate = "comments taskIds"

		let dayRating = await Rating.findUserRatingAndPopulate(payload, {}, populate)
		return { data: dayRating, error: false }
	} catch (error) {
		console.log("createPayloadAndGetWeekRating Error : ", error)
		return { data: error, error: true }
	}
}

const filteredDistinctProjectsUsers = async function (data) {
	try {


		let field = 'accessibleBy'
		let payload = {
			_id: { $in: data.filteredProjects || [] }
		}

		let projectsUsers = await Project.distinctProjects(field, payload)
		let allUsers = projectsUsers || []
		allUsers.push(data.auth.id)
		console.log("======================all users======", allUsers)
		return { data: allUsers, error: false }
	} catch (err) {
		console.log("createPayloadAndEditUserDetails Error : ", err)
		return { data: err, error: true }
	}

}
exports.filteredDistinctProjectsUsers = filteredDistinctProjectsUsers

const filteredProjectsUsers = async function (data) {
	try {

		let pipeline = [
			{
				$group: {
				  _id: null,
				  users: { $push: { $concatArrays: ["$managedBy", "$accessibleBy"] } }
				}
			},
			{
				$project: {
				  _id: 0,
				  users: { $reduce: {
					input: "$users",
					initialValue: [],
					in: { $setUnion: ["$$value", "$$this"] }
				  } }
				}
			}
		  ]
		let projectsUsers = await Project.projectAggregate(pipeline)
		let allUsers = (projectsUsers && projectsUsers.length && projectsUsers[0].users) || []
		allUsers.push(data.auth.id)
		return { data: allUsers, error: false }
	} catch (err) {
		console.log("filteredProjectsUsers Error : ", err)
		return { data: err, error: true }
	}

}