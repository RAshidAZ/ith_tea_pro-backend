// const mute = require('immutable');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { Auth, Credentials } = require('../query');

// Data Encryption and Decryption 
const encryptData = function (data) {

    try {
        var signOptions = {
            issuer: "Authorization",
            subject: "teapro@ith.tech",
            audience: "teapro",
            // expiresIn: "30d", // 30 days validity
            expiresIn: "1d", // 30 days validity
            algorithm: "HS256"
        };
        let encryptedData = jwt.sign(data, process.env.ENCRYPT_SALT_STATIC, signOptions);

        return {
            data: encryptedData,
            error: false
        }
    } catch (e) {

        return {
            data: e,
            error: true
        }
    }

}
exports.encryptData = encryptData;

const decryptData = async function (encryptedData) {

    // console.log("decryptData1")
    try {
        let verifyOptions = {
            issuer: "Authorization",
            subject: "teapro@ith.tech",
            audience: "teapro",
            // expiresIn: "1d", // 30 days validity
            expiresIn: "1d", // 30 days validity
            algorithm: "HS256"
        };
        let decryptedData = jwt.verify(encryptedData.token, process.env.ENCRYPT_SALT_STATIC, verifyOptions);
        // console.log("decryptedData", decryptedData)
        // console.log("decryptData2")

        if (decryptedData.id == encryptedData.user.userId._id) {
            // console.log("decryptData3")

            return {
                data: decryptedData,
                error: false
            }
        }
        else {
            return {
                data: "Not Allowed",
                error: true
            }
        }
    } catch (e) {
        return {
            data: e,
            error: true
        }
    }
}
exports.decryptData = decryptData;

const generatePassword = function (plaintext) {

    const salt = crypto.randomBytes(16).toString('base64')
    const randomSalt = Buffer(salt, 'base64');
    const hash = crypto.pbkdf2Sync(plaintext, randomSalt, 10000, 64, 'sha1').toString('base64');

    return {
        hash: hash,
        salt: salt
    }
};
exports.generatePassword = generatePassword;

const comparePassword = function (plaintextInput, hash, salt) {

    const userSalt = Buffer(salt, 'base64');
    const hashResult = crypto.pbkdf2Sync(plaintextInput, userSalt, 10000, 64, 'sha1').toString('base64')
    console.log("HGGGGGGGGGGGGGGGGG=>", hashResult == hash,);
    if (hashResult === hash) {
        return {
            data: true,
            error: false
        }
    } else {
        return {
            data: "Password does not match",
            error: true
        }
    }
};
exports.comparePassword = comparePassword;

exports.generateAccountId = async function (data) {
    try {
        console.log("In Generate AccountId function......")
        let usedAccountIds = await Credentials.findDistinctQuery("accountId")
        console.log(usedAccountIds)
        let x = true;
        let accountId = 0;
        while (x) {
            accountId = Math.floor(Math.random() * (99999999 - 11111111) + 11111111);
            if (usedAccountIds.indexOf(accountId) < 0) {
                x = false;
            }
        }
        console.log("AccountId:", accountId);
        return accountId
    } catch (error) {
        return
    }
}


// Input Validators
const validateEmail = function (email) {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};
exports.validateEmail = validateEmail;

const validatePassword = function (password) {
    if (password.length < 8 || password.length > 50) {
        return false;
    } else {
        return true;
    }
};
exports.validatePassword = validatePassword;

const validatePhone = function (phone) {
    if (phone.length < 10 || phone.length > 13) {
        return false;
    } else {
        return true;
    }
};
exports.validatePhone = validatePhone;

const readUserByEmail = async function (data) {

    let findData = {};

    //third priority
    if (data.id) {
        findData = {
            _id: data.id,
        }
    }
    //second priority
    if (data.email) {
        findData = {
            email: data.email,
        }
    }
    try {

        let user = await Auth.findUser(findData);
        if (!user) {
            return {
                data: "User Not found",
                error: true
            }
        }
        return {
            data: user,
            error: false
        }
    } catch (error) {
        return {
            data: error,
            error: true
        }
    }
};

exports.readUserByEmail = readUserByEmail;

const readUserByCredentials = async function (data) {

    let findData = {};

    if (data.identifier) {
        findData = {
            accountId: data.identifier
        }
    }

    if (data.userId) {
        findData = {
            userId: data.userId
        }
    }
    try {

        let userCredentials = await Auth.findUserCredentials(findData)

        if (!userCredentials || userCredentials.userId.length == 0) {

            return {
                data: "User/credentials not found, contact admin to send password setup link",
                error: true
            }
        }

		if (userCredentials.userId.isDeleted) {

            return {
                data: "User Deleted",
                error: true
            }
        }

        if (userCredentials.isBlocked || !userCredentials.isActive) {
            return {
                data: "User is Blocked or Not active",
                error: true
            }
        }
        if (userCredentials.emailVerified == false) {
            return {
                data: "User email is not verified",
                error: true
            }
        }
        if (data.login && (userCredentials.userId.provider != 'email') && data.password) {
            return {
                data: "Incorrect platform used for login",
                error: true
            }
        }
        return {
            data: userCredentials,
            error: false
        }
    } catch (error) {
        console.log("error in credentials find", error)
        return {
            data: error,
            error: true
        }
    }
};
exports.readUserByCredentials = readUserByCredentials;

exports.validateToken = async function (data, cb) {


    // data.token = null;
    if (!data.token || !data.identifier) {
        console.log("ERRROR IS THEER")
        return cb({
            data: null,
            error: true
        })
    }

    let getUserCredentials = await readUserByCredentials(data);
    if (getUserCredentials.error) {
        return cb(getUserCredentials);
    }
    data.user = getUserCredentials.data;

    let decryptDataResponse = await decryptData(data);
    if (decryptDataResponse.error) {
        console.log("decryptDataResponse", decryptDataResponse)
        return cb(decryptDataResponse);
    }

    return cb(null, getUserCredentials.data);
} 

const fetchRolePriority = function (role) {

	if(!role){
		return { priority: null, error: true} 
	}
	const rolePriority = JSON.parse(process.env.rolePriority)

  return { data: rolePriority[role], error: false} 
};
exports.fetchRolePriority = fetchRolePriority;