
const { sendResponse } = require('../helpers/sendResponse')
const queryController = require('../query')
const { Rating } = queryController;

const commentController = require('./comment');

const getUserRating = async (req, res, next) => {
    let data = req.data;
    console.log('getUserRating data : ', req.data);

    if (!data.userId || !data.date || !data.month || !data.year) {
        return res.status(400).send(sendResponse(400, "Params Missing", 'getUserRating', null, req.data.signature))
    }
    //TODO: Change after auth is updated
    // data.givenBy = data.auth.id 
    data.givenBy = "601e3c6ef5eb242d4408dcc8"

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
    console.log('insertUserRating data : ', req.data);

    if (!data.rating || !data.userId || !data.date || !data.month || !data.year) {
        return res.status(400).send(sendResponse(400, "Params Missing", 'insertUserRating', null, req.data.signature))
    }
    //TODO: Change after auth is updated
    // data.givenBy = data.auth.id 
    data.givenBy = "601e3c6ef5eb242d4408dcc8"

    let checkRes = await findUserRatingGivenDate(data)
    if (checkRes.error) {
        return res.status(500).send(sendResponse(500, '', 'insertUserRating', null, req.data.signature))
    }
    if (checkRes.data) {
        return res.status(400).send(sendResponse(400, "Rating Already Given", 'insertUserRating', null, req.data.signature))
    }

    if (data.comment) {
        let commentRes = await commentController.createPayloadAndInsertComment(data)
        console.log('commentRes : ', commentRes)
        if (commentRes.error || !commentRes.data) {
            return res.status(500).send(sendResponse(500, '', 'insertUserRating', null, req.data.signature))
        }
        data.commentId = commentRes.data._id
    }

    let ratingRes = await createPayloadAndInsertRating(data)
    console.log('ratingRes : ', ratingRes);
    if (ratingRes.error || !ratingRes.data) {
        return res.status(500).send(sendResponse(500, '', 'insertUserRating', null, req.data.signature))
    }
    return res.status(200).send(sendResponse(200, 'Rating Inserted', 'insertUserRating', null, req.data.signature))
}
exports.insertUserRating = insertUserRating

const getMonthAllUserRating = async (req, res, next) => {
    let data = req.data;
    console.log('getMonthAllUserRating data : ', req.data);

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
        let insertRes = await Rating.findUserRatingGivenDate(payload, projections)
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
        console.log("insertRes---------------------------", insertRes)
        return { data: insertRes, error: false }
    } catch (error) {
        console.log("addCommnetIdInRatingById Error : ", error)
        return { data: error, error: true }
    }
}
exports.addCommnetIdInRatingById = addCommnetIdInRatingById;

const getAllUsersRatingForMonth = async function (data) {
    try {
        let payload = [
            {
                $match: { "month": parseInt(data.month), "year": parseInt(data.year) }
            },
            {
                $lookup: {
                    from: "comments",
                    localField: "comments",
                    foreignField: "_id",
                    as: "comments"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "comments.commentedBy",

                    foreignField: "_id",
                    as: "commentedByArray"
                }
            },
            {
                $group: {
                    _id: "$userId",
                    ratingsAndComment: { $addToSet: { ratingId: "$_id", rating: "$rating", date: "$date", month: "$month", year: "$year", comments: "$comments", commentedByArray: "$commentedByArray" } }
                }
            },
            {
                $project: {
                    "ratingsAndComment.rating": 1,
                    "ratingsAndComment.ratingId": 1,
                    "ratingsAndComment.date": 1,
                    "ratingsAndComment.month": 1,
                    "ratingsAndComment.year": 1,
                    "ratingsAndComment.comments.comment": 1,
                    "ratingsAndComment.comments._id": 1,
                    "ratingsAndComment.comments.createdAt": 1,
                    // "ratingsAndComment.comments.commentedBy": 1,
                    "ratingsAndComment.commentedByArray.name": 1
                }
            },
        ]
        let ratingRes = await Rating.getAllUsersRatingForMonth(payload)
        return { data: ratingRes, error: false }
    } catch (error) {
        console.log("getAllUsersRatingForMonth Error : ", error)
        return { data: error, error: true }
    }
}
exports.getAllUsersRatingForMonth = getAllUsersRatingForMonth;

