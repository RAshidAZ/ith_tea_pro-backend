// Fetching the environment
const env = process.env.NODE_ENV || 'development';

// Common Environment Variables
const commonVariables = {
    SERVICE_RPC_HOST: 'http://localhost',
    SERVICE_REST_PORT: 9000,
    SERVICE_RPC_PORT: '8500',
    STATUS: [200, 500, 400, 401],
    ROLE: ["USER", "SUPER_ADMIN", "ADMIN", "LEAD"],
    TASK_STATUS: ["NO_PROGRESS", "ONGOING", "COMPLETED", "ONHOLD"],
    TASK_PRIORITY: ["LOW", "REPEATED", "MEDIUM", "HIGH", "None"],
    ALLOWED_GROUP_BY: ['category', 'status', "projectId", "createdBy", "assignedTo", "priority"],

    ENCRYPT_SALT_STATIC: 'dSDFeFenyL2jaSDasdaeFenyL2jas@766sar7^^#&W^FSDBGxg7dgBGxg7dgqw3FSQ'
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

