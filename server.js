const teade = require('teade');
const auth = require('./helpers/security');

let server = new teade.Server();
server.addService({
    'validateToken': validateToken,
});

server.bind(process.env.SERVICE_RPC_PORT);
console.log(`TPRO RPC Server started at port: ${process.env.SERVICE_RPC_PORT}`);
server.start();

function validateToken(call, callback) {

    auth.validateToken(call, function (err, response) {
        if (err) {
            let error = new Error();
            error.message = err;
            error.code = err.status;
            callback(error);
        } else {
            callback(null, response);
        }
    });


}

module.exports = server;