const mailjet = require('node-mailjet').apiConnect(process.env.MAILJET_APIKEY_PUBLIC, process.env.MAILJET_APIKEY_PRIVATE)
// let htmlTemplates = require('./../htmlTemplates');
const Handlebars = require('handlebars')

let sendMail = async function (from, to, subject, message, cb) {
	return new Promise((resolve, reject) => {
		const request = mailjet
			.post('send', { version: 'v3.1' })
			.request({
				Messages: [
					{
						From: {
							Email: from,
							Name: "TPRO TECH"
						},
						To: [
							{
								Email: to
							}
						],
						Subject: subject,
						// TextPart: "Dear passenger 1, welcome to Mailjet! May the delivery force be with you!",
						HTMLPart: message
					}
				]
			})
		request
			.then((result) => {
				resolve({
					error: false,
					data: result.body
				})

			})
			.catch((err) => {
				console.log("Email send Error ==>> ", err);
				resolve({
					error: true,
					data: err
				})
			})
	})
}

let sendMailByTemplate = function (from, to, subject, templateId, variables, cb) {

	const request = mailjet
		.post("send", { 'version': 'v3.1' })
		.request({
			"Messages": [
				{
					"From": {
						"Email": from,
					},
					"To": [
						{
							"Email": to,

						}
					],
					"TemplateID": templateId,
					"TemplateLanguage": true,
					"Subject": subject,
					"Variables": variables
				}
			]
		})
	request
		.then((result) => {

			return cb(null, result.body);

		})
		.catch((err) => {
			console.log("DETAILS ERROR -------", err)
			return cb(err, null);
		})

}


/** Email Functions */

const sendWelcomeEmail = function (data) {

	return new Promise(async (resolve, reject) => {
		let subject = `Welcome to TPro`;
		let from = process.env.EMAIL_HOST || host;
		let to = `${data.email}`;
		let message = `<!DOCTYPE html>
		<html lang="en" >
		<head>
		  <meta charset="UTF-8">
		  <title>Email</title>
		  
		
		</head>
		<body>
		<table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed;background-color:#f9f9f9" id="bodyTable">
			<tbody>
				<tr>
					<td style="padding-right:10px;padding-left:10px;" align="center" valign="top" id="bodyCell">
						<table border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapperWebview" style="max-width:600px">
							
						</table>
						<table border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapperBody" style="max-width:600px">
							<tbody>
								<tr>
									<td align="center" valign="top">
										<table border="0" cellpadding="0" cellspacing="0" width="100%" class="tableCard" style="background-color:#fff;">
											<tbody>
												<tr>
													<td style="background-color:#551a8b;font-size:1px;line-height:3px" class="topBorder" height="3">&nbsp;</td>
												</tr>
												<tr>
													<td style="padding:20px;" valign="middle" class="emailLogo">
														<a href="https://projects.ith.tech/" style="text-decoration:none" target="_blank">
														<img src='https://aio-dev.s3.ap-southeast-1.amazonaws.com/tpro/image/1679905765814.png'	alt="tea pro" width="250px">
		
															
														</a>
													
													</td>
												</tr>
											
												<tr>
													<td style="padding-bottom: 5px; padding-left: 20px; padding-right: 20px;" align="center" valign="top" class="mainTitle">
														<h2 class="text" style="color:#000;font-family:Poppins,Helvetica,Arial,sans-serif;font-size:28px;font-weight:500;font-style:normal;letter-spacing:normal;line-height:36px;text-transform:none;text-align:left;padding:0;margin:0">Dear ${data.name}</h2>
													</td>
												</tr>
											
												<tr>
													<td style="padding-left:20px;padding-right:20px" align="center" valign="top" class="containtTable ui-sortable">
														<table border="0" cellpadding="0" cellspacing="0" width="100%" class="tableDescription" style="text-align:left;">
															<tbody>
															<tr>
															 <td>
																
																<p>Welcome to Team Pro by ITH TECH. Setup your password here <br>
																${process.env.CLIENT_URL}/set-password/${data.signupToken}</p>	
		
																<p>Here are your details : </p>
															 </td>	
															</tr>	
															<tr>
																<td>Name : ${data.name}</td>
																
															  </tr>
				  
															</tbody>
														</table>
														<table border="0" cellpadding="0" cellspacing="0" width="100%" class="tableButton" style="">
															<tbody>
																<tr>
																	<td style="padding-top:20px;padding-bottom:20px" align="center" valign="top">
																		
																	</td>
																</tr>
															</tbody>
														</table>
													</td>
												</tr>
												<tr>
													<td style="font-size:1px;line-height:1px" height="20">&nbsp;</td>
												</tr>
												
											</tbody>
										</table>
										<table border="0" cellpadding="0" cellspacing="0" width="100%" class="space">
											<tbody>
												<tr>
													<td style="font-size:1px;line-height:1px" height="30">&nbsp;</td>
												</tr>
											</tbody>
										</table>
									</td>
								</tr>
							</tbody>
						</table>
						<table border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapperFooter" style="max-width:600px">
							<tbody>
								<tr>
									<td align="center" valign="top">
										<table border="0" cellpadding="0" cellspacing="0" width="100%" class="footer">
											<tbody>
												<tr>
													<td style="padding-top:10px;padding-bottom:10px;padding-left:10px;padding-right:10px" align="center" valign="top" class="socialLinks">
														<a href="#" style="display:inline-block" target="_blank" class="facebook">
															<img alt="" border="0" src="http://email.aumfusion.com/vespro/img/social/light/facebook.png" style="height:auto;width:100%;max-width:40px;margin-left:2px;margin-right:2px" width="40">
														</a>
														<a href="#" style="display: inline-block;" target="_blank" class="twitter">
															<img alt="" border="0" src="http://email.aumfusion.com/vespro/img/social/light/twitter.png" style="height:auto;width:100%;max-width:40px;margin-left:2px;margin-right:2px" width="40">
														</a>
														<a href="#" style="display: inline-block;" target="_blank" class="pintrest">
															<img alt="" border="0" src="http://email.aumfusion.com/vespro/img/social/light/pintrest.png" style="height:auto;width:100%;max-width:40px;margin-left:2px;margin-right:2px" width="40">
														</a>
														<a href="#" style="display: inline-block;" target="_blank" class="instagram">
															<img alt="" border="0" src="http://email.aumfusion.com/vespro/img/social/light/instagram.png" style="height:auto;width:100%;max-width:40px;margin-left:2px;margin-right:2px" width="40">
														</a>
														<a href="#" style="display: inline-block;" target="_blank" class="linkdin">
															<img alt="" border="0" src="http://email.aumfusion.com/vespro/img/social/light/linkdin.png" style="height:auto;width:100%;max-width:40px;margin-left:2px;margin-right:2px" width="40">
														</a>
													</td>
												</tr>
											
												<tr>
													<td style="font-size:1px;line-height:1px" height="30">&nbsp;</td>
												</tr>
											</tbody>
										</table>
									</td>
								</tr>
								<tr>
									<td style="font-size:1px;line-height:1px" height="30">&nbsp;</td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>
			</tbody>
		</table>
		<!-- partial -->
		  
		</body>
		</html>`;

		let response = await sendMail(from, to, subject, message);
		resolve(response);
	})
};
exports.sendWelcomeEmail = sendWelcomeEmail;

const sendTaskMail = function (data) {

	return new Promise(async (resolve, reject) => {
		let subject = `You're Assigned Task`;
		let from = process.env.EMAIL_HOST || host;
		let to = `${data.email}`;
		let message = `<!DOCTYPE html>
		<html lang="en" >
		<head>
		  <meta charset="UTF-8">
		  <title>Email</title>
		  
		
		</head>
		<body>
		<table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed;background-color:#f9f9f9" id="bodyTable">
			<tbody>
				<tr>
					<td style="padding-right:10px;padding-left:10px;" align="center" valign="top" id="bodyCell">
						<table border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapperWebview" style="max-width:600px">
							
						</table>
						<table border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapperBody" style="max-width:600px">
							<tbody>
								<tr>
									<td align="center" valign="top">
										<table border="0" cellpadding="0" cellspacing="0" width="100%" class="tableCard" style="background-color:#fff;border-color:#e5e5e5;border-style:solid;border-width:0 1px 1px 1px;">
											<tbody>
												<tr>
													<td style="background-color:#551a8b;font-size:1px;line-height:3px" class="topBorder" height="3">&nbsp;</td>
												</tr>
												<tr>
													<td style="padding-top:20px; padding-bottom: 20px;" align="center" valign="middle" class="emailLogo">
														<a href="https://projects.ith.tech/" style="text-decoration:none" target="_blank">
															<svg class="" fill="none" height="180" viewBox="0 0 32 32" width="180" xmlns="http://www.w3.org/2000/svg"><rect fill="var(--secondary)" height="100%" rx="16" width="100%"></rect><path clip-rule="evenodd" d="M17.6482 10.1305L15.8785 7.02583L7.02979 22.5499H10.5278L17.6482 10.1305ZM19.8798 14.0457L18.11 17.1983L19.394 19.4511H16.8453L15.1056 22.5499H24.7272L19.8798 14.0457Z" fill="currentColor" fill-rule="evenodd"></path></svg>
														</a>
													</td>
												</tr>
											
												<tr>
													<td style="padding-bottom: 5px; padding-left: 20px; padding-right: 20px;" align="center" valign="top" class="mainTitle">
														<h2 class="text" style="color:#000;font-family:Poppins,Helvetica,Arial,sans-serif;font-size:28px;font-weight:500;font-style:normal;letter-spacing:normal;line-height:36px;text-transform:none;text-align:center;padding:0;margin:0">Hi ${data.userName}</h2>
													</td>
												</tr>
											
												<tr>
													<td style="padding-left:20px;padding-right:20px" align="center" valign="top" class="containtTable ui-sortable">
														<table border="0" cellpadding="0" cellspacing="0" width="100%" class="tableDescription" style="">
															<tbody>
																<tr>
																	<td style="padding-bottom: 20px;" align="center" valign="top" class="description">
																		<p class="text" style="color:#666;font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:14px;font-weight:400;font-style:normal;letter-spacing:normal;line-height:22px;text-transform:none;text-align:center;padding:0;margin:0">You have been assigned task <span style="font-size:18px; font-weight: 600;">${data.title} </span> in Projects <span style="font-size:18px; font-weight: 600;">${data.projectName}</span>Assigned By <span style="font-size:18px; font-weight: 600;">${data.assignedBy}</span></p>
																	</td>
																</tr>
																<tr>
																	<td style="padding-bottom: 20px;" align="center" valign="top" class="description">
																		<p class="text" style="color:#666;font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:14px;font-weight:400;font-style:normal;letter-spacing:normal;line-height:22px;text-transform:none;text-align:center;padding:0;margin:0">
																			Complete the task by <span style="font-size:18px; font-weight: 600;">${data.dueDate || ''}</span> 
																		</p>
																	</td>
																</tr>
																<tr>
																	<td style="padding-bottom: 20px;" align="center" valign="top" class="description">
																		<p class="text" style="color:#666;font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:14px;font-weight:400;font-style:normal;letter-spacing:normal;line-height:22px;text-transform:none;text-align:center;padding:0;margin:0"><span style="font-size:18px; font-weight: 600;">Task Details : </span> <span style="font-size:18px; font-weight: 600;">Tittle => </span>${data.title}<span style="font-size:18px; font-weight: 600;">Description =></span>${data.description}</p>
																	</td>
																</tr>
															</tbody>
														</table>
														<table border="0" cellpadding="0" cellspacing="0" width="100%" class="tableButton" style="">
															<tbody>
																<tr>
																	<td style="padding-top:20px;padding-bottom:20px" align="center" valign="top">
																		<table border="0" cellpadding="0" cellspacing="0" align="center">
																			<tbody>
																				<tr>
																					<td style="background-color:#673AB7; padding: 12px 35px; border-radius: 50px;" align="center" class="ctaButton"> <a href=${process.env.CLIENT_URL}/task/list/${data.taskLink} style="color:#fff;font-family:Poppins,Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;font-style:normal;letter-spacing:1px;line-height:20px;text-transform:uppercase;text-decoration:none;display:block" target="_blank" class="text">View Task</a>
																					</td>
																				</tr>
																			</tbody>
																		</table>
																	</td>
																</tr>
															</tbody>
														</table>
													</td>
												</tr>
												<tr>
													<td style="font-size:1px;line-height:1px" height="20">&nbsp;</td>
												</tr>
												
											</tbody>
										</table>
										<table border="0" cellpadding="0" cellspacing="0" width="100%" class="space">
											<tbody>
												<tr>
													<td style="font-size:1px;line-height:1px" height="30">&nbsp;</td>
												</tr>
											</tbody>
										</table>
									</td>
								</tr>
							</tbody>
						</table>
						<table border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapperFooter" style="max-width:600px">
							<tbody>
								<tr>
									<td align="center" valign="top">
										<table border="0" cellpadding="0" cellspacing="0" width="100%" class="footer">
											<tbody>
												<tr>
													<td style="padding-top:10px;padding-bottom:10px;padding-left:10px;padding-right:10px" align="center" valign="top" class="socialLinks">
														<a href="#" style="display:inline-block" target="_blank" class="facebook">
															<img alt="" border="0" src="http://email.aumfusion.com/vespro/img/social/light/facebook.png" style="height:auto;width:100%;max-width:40px;margin-left:2px;margin-right:2px" width="40">
														</a>
														<a href="#" style="display: inline-block;" target="_blank" class="twitter">
															<img alt="" border="0" src="http://email.aumfusion.com/vespro/img/social/light/twitter.png" style="height:auto;width:100%;max-width:40px;margin-left:2px;margin-right:2px" width="40">
														</a>
														<a href="#" style="display: inline-block;" target="_blank" class="pintrest">
															<img alt="" border="0" src="http://email.aumfusion.com/vespro/img/social/light/pintrest.png" style="height:auto;width:100%;max-width:40px;margin-left:2px;margin-right:2px" width="40">
														</a>
														<a href="#" style="display: inline-block;" target="_blank" class="instagram">
															<img alt="" border="0" src="http://email.aumfusion.com/vespro/img/social/light/instagram.png" style="height:auto;width:100%;max-width:40px;margin-left:2px;margin-right:2px" width="40">
														</a>
														<a href="#" style="display: inline-block;" target="_blank" class="linkdin">
															<img alt="" border="0" src="http://email.aumfusion.com/vespro/img/social/light/linkdin.png" style="height:auto;width:100%;max-width:40px;margin-left:2px;margin-right:2px" width="40">
														</a>
													</td>
												</tr>
											
												<tr>
													<td style="font-size:1px;line-height:1px" height="30">&nbsp;</td>
												</tr>
											</tbody>
										</table>
									</td>
								</tr>
								<tr>
									<td style="font-size:1px;line-height:1px" height="30">&nbsp;</td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>
			</tbody>
		</table>
		<!-- partial -->
		  
		</body>
		</html>`;

		let response = await sendMail(from, to, subject, message);
		resolve(response);
	})
};
exports.sendTaskMail = sendTaskMail;

const sendProjectAssignedMailToUser = function (data) {

	return new Promise(async (resolve, reject) => {
		let subject = `You're Assigned Project`;
		let from = process.env.EMAIL_HOST || host;
		let to = `${data.email}`;
		let message =`<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<title>Project Assignment</title>
		</head>
		<body>
			<p>Hi ${data.userName},</p>
			<p>You are assigned a ${data.projectName} project, as ${data.assignedRole}.</p>
			<p>Please find the details below:</p>
			<ul>
				<li>Project name: ${data.projectName}</li>
				<li>Assigned as: ${data.assignedRole}</li>
			</ul>
			<p>Thank you,</p>
			<p>TPro Team</p>
		</body>
		</html>`

		let response = await sendMail(from, to, subject, message);
		resolve(response);
	})
};
exports.sendProjectAssignedMailToUser = sendProjectAssignedMailToUser;

const sendProjectsAssignedMailToUser = function (data) {

	return new Promise(async (resolve, reject) => {
		let subject = `You're Assigned Projects`;
		let from = process.env.EMAIL_HOST || host;
		let to = `${data.email}`;
		let projectList = data.projects || []
		let projectCount = projectList.length

		let html_list = ``
		if (projectCount == 0) {
			html_list = ``
		}else if (projectCount == 1) {
			let projectName = projectList[0]
			html_list = `<ol><li> ${projectName} </li></ol>`
		} else {
			html_list = `<ol>`
			for (i in projectList) {
				let projectName = projectList[i]
				html_list += `<li> ${projectName} </li>`
			}
			html_list += `</ol>`
		}

		let message = `<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<title>Projects Assignment</title>
		</head>
		<body>
			<p>Hi ${data.userName},</p>
			<p>You have been invited for the following projects, as ${data.assignedRole} by ${data.assignedBy}:</p>
			${html_list}
			<p>Thank you,</p>
			<p>TPro Team</p>
		</body>
		</html>`

		let response = await sendMail(from, to, subject, message);
		resolve(response);
	})
};
exports.sendProjectsAssignedMailToUser = sendProjectsAssignedMailToUser;

const sendOtpToUser = function (data) {

	return new Promise(async (resolve, reject) => {
		let subject = `OTP Verification`;
		let from = process.env.EMAIL_HOST || host;
		let to = `${data.email}`;

		let message = `<!DOCTYPE html>
		<html>
		  <head>
			<meta charset="utf-8">
			<title>OTP Verification</title>
		  </head>
		  <body>
			<h2>OTP Verification</h2>
			<p>Hello,</p>
			<p>Your OTP for verification is: <strong>${otp}</strong></p>
			<p>Please enter this OTP on the verification page to complete the process.</p>
			<p>Thank you,</p>
			<p>TPro Team</p>
		  </body>
		</html>`

		let response = await sendMail(from, to, subject, message);
		resolve(response);
	})
};
exports.sendOtpToUser = sendOtpToUser;
