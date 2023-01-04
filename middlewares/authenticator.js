'use strict'

const teade = require('teade'); // used to communicate with services

let usersClient = {
    create: function(users) {
        var host = users.host;
        var port = users.port;
        var client = new teade.Client(host, port);
        return client;
    }
}

module.exports = function(clients, data) {
    return function(req, res, next) {
        
        // import user client
        var users = usersClient.create(clients.users);

        res.set('x-powered-by', "Recru Core");

        if (!req.data.request) {
            console.log("Invalid Request");
            var response = {
                success: false,
                message: 'Failed to authenticate token at Lv0'
            };
            return res.status(401).send(response);
        }
        let user_request = req.data.request;
        let user_ip = user_request.ip;
        let token;
        let identifier;
        let expired_token = req.headers['x-expired-token'];
        let device_id = req.headers['x-device_id'];
        let device_session = req.headers['x-device_session'];
        
        if (req.headers['x-access-token']) {
                token = req.headers['x-access-token'] || req.headers['authorization'];
            }else if(req.headers['authorization'] && req.headers['authorization'].startsWith('Bearer ')){
                // Remove Bearer from string
                token = req.headers['authorization'].slice(7, req.headers['authorization'].length);
            }else{
                return res.status(401).send('Invalid token in header');
            }
            identifier = req.headers['x-access-user'];
        
        // console.log("auth",token, identifier, user_ip);
        if (token && identifier && user_ip) {
            // verify the token
            let payload = {
                token: token,
                identifier: identifier,
                req: req.data,
                user_ip: user_ip,
                expired_token: expired_token,
                device_id: device_id,
                device_session: device_session,
            }
            if(data.platform){
                payload.platform = data.platform;
            }
            console.log("Payload => ", payload)
            users.request('validateToken', payload, function(err, response) {
                if (err) {
                    console.log("---",err)
                    var response = {
                        success: false,
                        message: err.message.data || 'Not Authorized!!'
                    };

                    return res.status(403).send(response);
                } else {
                    if (response) {
                            res.set('Refresh-Token', payload.token);
                            res.set('X-Refresh-Token', payload.token);
                        
                    }
                    console.log("response => ",response)
                    // if everything is good, save to request for use in other routes
                    req.data.auth = response;
                    req.data.auth.token = payload.token;
                    req.data.auth.identifier = identifier;
                    next();
                }
            });
        } else {
            // if there is no token
            // return an error
            var response = {
                success: false,
                message: 'Not Authorized'
            };
            return res.status(401).send(response);
        }

    }
}