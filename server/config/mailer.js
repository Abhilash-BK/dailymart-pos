
const nodemailer = require("nodemailer");

async function sendOtpEmail(email, otp) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD?.replace(/\s/g, "");

  if (!user || !pass) {
    throw new Error("SMTP_USER or SMTP_APP_PASSWORD is missing.");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from: `"DailyMart POS" <${user}>`,
    to: email,
    subject: "Your DailyMart POS verification code",

    text: `Your verification code is ${otp}.

This code expires in 10 minutes.

If you did not request this code, ignore this email.`,

    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>DailyMart POS</h2>
        <p>Your email verification code is:</p>
        <h1 style="letter-spacing: 8px;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this code, ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendOtpEmail };
