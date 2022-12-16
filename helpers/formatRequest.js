const randomstring = require("randomstring");


module.exports = function (req, res, next) {

    let reqData = { ...req.params, ...req.query, ...req.body };
    req.data = reqData;
    req.data.signature = generateSignature();
    req.data.request = {
        method: req.method,
        baseUrl: req.baseUrl,
        // cookies: req.cookies,
        // signedCookies: req.signedCookies,
        fresh: req.fresh,
        ip: req.ip,
        ips: req.ips,
        secure: req.secure,
        subdomains: req.subdomains,
        xhr: req.xhr,
        hostname: req.hostname,
        protocol: req.protocol,
        originalUrl: req.originalUrl,
        // route: req.route,
        headers: req.headers
    };
    next();
}


const generateSignature = function () {
    let signature = Date.now() + '.';
    signature += randomstring.generate({
        length: 13
    });
    return signature;
}