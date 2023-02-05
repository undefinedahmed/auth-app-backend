/**
 * @desc sending mails using nodemailer & mail-gen
 */
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");

const { email, password } = require("../../config");

let nodeConfig = {
  service: "gmail",
  auth: {
    user: email,
    pass: password,
  },
};
let transporter = nodemailer.createTransport(nodeConfig);

let MailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "Mailgen",
    link: "https://mailgen.js/",
  },
});

const sendMail = async (name, userEmail, text, subject) => {
  // body of the email
  var emailObj = {
    body: {
      name,
      intro: text || "OTP Verification",
      outro: "Thanks",
    },
  };

  var emailBody = MailGenerator.generate(emailObj);

  let message = {
    from: email,
    to: userEmail,
    subject: subject || "OTP VERIFICATION",
    html: emailBody,
  };

  // send mail
  transporter
    .sendMail(message)
    .then(() => {
      console.log("Email sent");
      return true;
    })
    .catch((error) => {
      console.log("Error sending email", error);
      return false;
    });
};

module.exports = sendMail;
