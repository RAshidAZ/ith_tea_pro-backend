/**
 * Database config and initialization
 */
require('../config')
const mongoose = require('mongoose');

const opt = {
    // useUnifiedTopology: true,
    // useFindAndModify: false,
    // useNewUrlParser: true,
    // useCreateIndex: true

};
// mongoose.set('debug', true);
mongoose.set('strictQuery', false);

const connstring = process.env.mongoConnectionString;

console.log("connstring:", connstring);

const connectWithRetry = function () {
    return mongoose.connect(connstring, opt, function (err) {
        if (err) {
            console.error('Failed to connect to mongo on startup - retrying in 5 sec', err.message);
            setTimeout(connectWithRetry, 5000);
        } else {
            console.log("Mongodb Connection Established");
        }
    });
};
connectWithRetry();

module.exports = mongoose;
