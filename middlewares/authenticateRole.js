'use strict';
module.exports = function(role, action){

    return function(req, res,next){
        if(role.length==0){
            console.log("NO ROLE PASSED")
        }
        if(role.includes(req.data.auth.role)){
            next();
        }else{
            return res.status(403).send({
                signature: req.data.signature,
                status: 401,
                message: "Not Allowed.",
                error: true
            });
        }
  
    }
}