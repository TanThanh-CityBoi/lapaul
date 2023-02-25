const nodeMailer = require("nodemailer");

const transporter = nodeMailer.createTransport({
  service: "gmail",
  auth: {
    user: "lapaul.system@gmail.com",
    pass: "webnangcao1",
  },
});

module.exports = transporter;
