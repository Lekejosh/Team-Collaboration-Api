const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMPT_HOST,
    port: process.env.SMPT_PORT,
    service: process.env.SMPT_SERVICE,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.SMPT_MAIL,
      pass: process.env.SMPT_PASSWORD,
    },
  });
  const mailOptions = {
    from: process.env.SMPT,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
