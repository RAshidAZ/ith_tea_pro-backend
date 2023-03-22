const express = require('express');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const uuid = require('uuid');

const router = express.Router();


/* Controllers */
const users = require('../controllers/user');

/* Middlewares */
const formatRequest = require('../helpers/formatRequest');
router.use(formatRequest);
const authenticateRole = require('../middlewares/authenticateRole');
const role = JSON.parse(process.env.role);

const clients = {
    users: {
        host: process.env.SERVICE_RPC_HOST,
        port: process.env.SERVICE_RPC_PORT
    }
};

const data = {};
const authenticator = require('../middlewares/authenticator')(clients, data);

const s3 = new AWS.S3({
    accessKeyId:  `${process.env.AWS_ACCESS_KEY_ID}`,
    secretAccessKey: `${process.env.AWS_ACCESS_KEY_SECRET}`,
    region: `${process.env.AWS_REGION}`
});

var uploadFile = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET,
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        // serverSideEncryption: 'AES256',
        metadata: function (req, file, cb) {
            cb(null, {
                fieldName: file.fieldname
            });
        },
        key: function (req, file, cb) {
			const folder = `tpro/image`;
            const filename_new = folder + "/" +Date.now() + "." + file.originalname.split(".")[file.originalname.split(".").length - 1];
            cb(null, filename_new);
        }
    })
})

// const uploadFile = multer({
//     storage: multerS3({
      
//       s3: s3,
//       bucket: `${process.env.AWS_BUCKET}`,
//       acl: "public-read",
//       contentType: multerS3.AUTO_CONTENT_TYPE,
//       metadata: function (req, file, cb) {
//         cb(null, {
//           fieldName: file.fieldname,
//         });
//       },
//       key: function (req, file, cb) {
//         const folder = `socialCollider/image`;
//          console.log("reQ", file);
//         const filename_new =
//           folder +
//           "/" +
//           uuid.v1() +
//           "." +
//           file.originalname.split(".")[file.originalname.split(".").length - 1];
//           console.log("filename_new", filename_new,"file",file);
//         cb(null, filename_new);
//       },
//     }),
//     limits: { fieldSize: 20 * 1024 * 1024 }
// });
router.put('/v1/upload/file', 
[uploadFile.single('file')],function (req, res, next) {
    let data = req.body;
    data.req = req.data;

    let response = {
        url: req.file.location
    }
    let status = 200;
     
    return res.status(status).send(response);

    
});

router.put('/v1/user/file', [authenticator, authenticateRole([role.user]),uploadFile.single('file')],function (req, res, next) {
    let data = req.body;
    data.req = req.data;

    let response = {
        url: req.file.location
    }
    let status = 200;
     
    return res.status(status).send(response);

    
});


router.put('/v1/user/profilepicture', [authenticator, authenticateRole([role.admin,role.superadmin,role.user]),uploadFile.single('file')],function (req, res, next) {
    let data = req.body;
    data.req = req.data;
    data.url =  req.file.location
	console.log("profile url===",data.url)
    users.updateUserProfilePicture(data, function(err, response) {
        let status = 0;
        if (err) {
            status = err.status;
            return res.status(status).send(err);
        }
        status = response.status;
        return res.status(status).send(response);
    });
});

router.put('/v1/test', uploadFile.single('file'),function (req, res, next) {
    let data = req.body;
    data.req = req.data;
    data.url =  req.file.location
    return res.status(200).send({url:data.url});

    users.updateUserProfilePicture(data, function(err, response) {
        let status = 0;
        if (err) {
            status = err.status;
            return res.status(status).send(err);
        }
        status = response.status;
        return res.status(status).send(response);
    });
});

module.exports = router;
