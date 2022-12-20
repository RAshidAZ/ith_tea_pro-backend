// Fetching the environment
const env = process.env.NODE_ENV || 'development';

// Common Environment Variables
const commonVariables = {

    STATUS: [200, 500, 400, 401],
    ROLE: ["USER", "SUPER_ADMIN", "ADMIN", "LEAD"],
    TASK_STATUS: ["NO_PROGRESS", "ONGOING", "COMPLETED", "ONHOLD"],
    TASK_PRIORITY: ["LOW", "REPEATED", "MEDIUM", "HIGH"]
}

//setting the common variables
Object.keys(commonVariables).forEach((key) => {
    process.env[key] = commonVariables[key];
})

if (env === 'development') {

    let developmentEnvConfig = require('./development');
    Object.keys(developmentEnvConfig).forEach((key) => {
        process.env[key] = developmentEnvConfig[key];
        // console.log(key, ' => ',  developmentEnvConfig[key])
    })


} else { // PRODUCTION

    let productionEnvConfig = require('./production');
    Object.keys(productionEnvConfig).forEach((key) => {
        process.env[key] = productionEnvConfig[key];
    })
}

