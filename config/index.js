// Fetching the environment
const env = process.env.NODE_ENV || 'development';

// Common Environment Variables
const commonVariables = {
    SERVICE_RPC_HOST: 'http://localhost',
    SERVICE_REST_PORT: 9000,
	CLIENT_URL: 'https://projects.ith.tech',
	// CLIENT_URL: 'http://localhost:3000',
    SERVICE_RPC_PORT: '8500',
    STATUS: [200, 500, 400, 401],
    ROLE: ["CONTRIBUTOR", "SUPER_ADMIN", "ADMIN", "LEAD", "GUEST"],          //contributor/GUEST ADD
	role: '{"contributor":"CONTRIBUTOR", "superadmin":"SUPER_ADMIN", "admin" : "ADMIN", "lead" : "LEAD", "guest" : "GUEST"}',
	rolePriority : '{"SUPER_ADMIN" : 10,"ADMIN" : 7,"LEAD" : 4,"CONTRIBUTOR" : 2,"GUEST" : 0}',
    TASK_STATUS: ["NOT_STARTED", "ONGOING", "COMPLETED", "CLOSED", "ONHOLD"],
	PROJECT_STATUS : ["COMPLETED", "ONGOING", "UPCOMING"],
	COMMENT_TYPE : ["TASK", "RATING"],
    TASK_PRIORITY: ["LOW", "REPEATED", "MEDIUM", "HIGH", "None"],
    ALLOWED_GROUP_BY: ['default', 'section', 'status', 'projectId', 'createdBy', 'assignedTo', 'priority'],
	ALLOWED_SORT_BY: ['default', 'due-date', 'status', 'date-created', 'date-updated', 'date-completed', 'alphabetically'],
    PAGE_LIMIT:10,
    ENCRYPT_SALT_STATIC: 'dSDFeFenyL2jaSDasdaeFenyL2jas@766sar7^^#&W^FSDBGxg7dgBGxg7dgqw3FSQ',
    ACTION_TYPE : ["TASK", "TASK_RATING", "PROJECTS","TEAM_MEMBER"],
    ACTION_TAKEN : ["TASK_RATING", "TASK_STATUS_CHANGE","TASK_DUE_DATE_CHANGE","PROJECT_NAME_CHANGED", "PROJECT_CATEGORY_CHANGED", "TEAM_MEMBER_ADDED"],
	ADMIN_ID : '601e3c6ef5eb242d4408dcc6',
    DEFAULT_SECTION:"Notes",
	adhocProjectId : '6411aa06012696d25365c862',
	ratingTimeAllowed : 48 //48 hours
}

//setting the common variables
Object.keys(commonVariables).forEach((key) => {
    process.env[key] = commonVariables[key];
})

if (env === 'development') {

    let developmentEnvConfig = require('./development');
    Object.keys(developmentEnvConfig).forEach((key) => {
        process.env[key] = developmentEnvConfig[key];
    })


} else { // PRODUCTION

    let productionEnvConfig = require('./production');
    Object.keys(productionEnvConfig).forEach((key) => {
        process.env[key] = productionEnvConfig[key];
    })
}

