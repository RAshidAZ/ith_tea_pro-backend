const mailjet = require('node-mailjet').apiConnect(process.env.MAILJET_APIKEY_PUBLIC, process.env.MAILJET_APIKEY_PRIVATE)

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
                console.log("Email send response => ", result.body)
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

    console.log("sendMailByTemplate ===>> ", from, to, subject, templateId, variables);

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
        <html xmlns="http://www.w3.org/1999/xhtml">
      
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <title>Welcome to TPro</title>
            <link href="https://fonts.googleapis.com/css?family=Rubik&display=swap" rel="stylesheet">
              <link href="https://fonts.googleapis.com/css?family=Montserrat&display=swap" rel="stylesheet">
                <style>
                  h2,
                  h3 {
                    margin: 0;
                  font-weight: 100
                      }
      
                  p {
                    font - size: 13px;
                  margin: 0;
                  line-height: 22px;
                  color: #797474
                      }
                </style>
              </head>
      
              <body style="background: #f3f3f3;font-family: 'Montserrat', sans-serif; color: #696766;">
                <p>Dear ${data.email}</p>
                <p>Welcome to Team Pro by ITH TECH. Here is your password to start ${data.password}</p>
                <p>Here are your details : </br></p>
              <table>
                <tr>
                  <td>Name</td>
                  <td>${data.name}</td>
                </tr>
                <tr>
                  <td>EmployeeId</td>
                  <td>${data.employeeId}</td>
                </tr>
                <tr>
                  <td>Department</td>
                  <td>${data.department}</td>
                </tr>
                <tr>
                  <td>Designation</td>
                  <td>${data.designation}</td>
                </tr>
      
              </table>
      
              <p><b>Thanks,</b> <br /> TPro by ITH.TECH</p>
            </body>
      
        </html>`;

        let response = await sendMail(from, to, subject, message);
        resolve(response);
    })
};
exports.sendWelcomeEmail = sendWelcomeEmail;



