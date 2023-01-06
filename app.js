// Set default node environment to development
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "development";
}

// Required Files to make default Connections
require('./config');
require('./models/db')
require('./server');



const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');
const device = require('express-device');

const app = express();

const whitelistOrigin = [
    'http://localhost:3000',
    'http://192.168.1.38:9000',
    'http://192.168.1.38:3000',
    'http://192.168.1.37:3000',
    'http://192.168.29.78:3000',
    'http://192.168.29.78:9000'

];
app.use(cors({ credentials: true, origin: whitelistOrigin, allowedHeaders: ["X-Access-User", "X-Access-Token", "Device-Type", "Accept", "Accept-Datetime", "Accept-Encoding", "Accept-Language", "Accept-Params", "Accept-Ranges", "Access-Control-Allow-Credentials", "Access-Control-Allow-Headers", "Access-Control-Allow-Methods", "Access-Control-Allow-Origin", "Access-Control-Max-Age", "Access-Control-Request-Headers", "Access-Control-Request-Method", "Access-Control-Allow-Headers", "Origin", "X-Requested-With", "Content-Type", "Accept", "X-Access-User", "X-Access-Token", "Authorization", "Age", "Allow", "Alternates", "Authentication-Info", "Authorization", "Cache-Control", "Compliance", "Connection", "Content-Base", "Content-Disposition", "Content-Encoding", "Content-ID", "Content-Language", "Content-Length", "Content-Location", "Content-MD5", "Content-Range", "Content-Script-Type", "Content-Security-Policy", "Content-Style-Type", "Content-Transfer-Encoding", "Content-Type", "Content-Version", "Cookie", "DELETE", "Date", "ETag", "Expect", "Expires", "From", "GET", "GetProfile", "HEAD", "Host", "IM", "If", "If-Match", "If-Modified-Since", "If-None-Match", "If-Range", "If-Unmodified-Since", "Keep-Alive", "OPTION", "OPTIONS", "Optional", "Origin", "Overwrite", "POST", "PUT", "Public", "Referer", "Refresh", "Set-Cookie", "Set-Cookie2", "URI", "User-Agent", "X-Powered-By", "X-Requested-With", "_xser"] }))
app.use(helmet());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(device.capture());
app.set('trust proxy', true);

const formatRequest = require('./helpers/formatRequest');
app.use(formatRequest)

const comment = require('./routes/comment')
const rating = require('./routes/rating')
const task = require('./routes/task')
const user = require('./routes/user')
const project = require('./routes/project')

app.use('/rating', rating)
app.use('/comment', comment)
app.use('/task', task)
app.use('/user', user)
app.use('/projects', project)
const auth = require('./routes/auth');


app.use('/rating', rating)
app.use('/auth', auth);



// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});


// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.send({
        success: false,
        message: res.locals.message,
        error: res.locals.error
    });
});





module.exports = app;