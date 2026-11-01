const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE !== "false",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_APP_PASSWORD?.replace(/\s/g, ""),
  },
});

async function sendInvitationEmail(email, invitationLink) {
  await transporter.sendMail({
    from: `"DailyMart POS" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your DailyMart employee invitation",
    text: `You have been invited to join DailyMart POS.

Create your password using this link:
${invitationLink}

This invitation expires in 24 hours.`,
  });
}

module.exports = { sendInvitationEmail };