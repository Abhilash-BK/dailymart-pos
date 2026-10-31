
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE !== "false",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_APP_PASSWORD,
  },
});

async function sendInvitationEmail(email, invitationLink) {
  await transporter.sendMail({
    from: `"DailyMart POS" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your DailyMart employee invitation",
    text: `You have been invited to join DailyMart POS.

Open this link to create your password:
${invitationLink}

This invitation expires in 24 hours and can only be used once.

If you were not expecting this invitation, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#26332b">
        <h2>Welcome to DailyMart POS</h2>
        <p>You have been invited to join DailyMart as an employee.</p>
        <p>Click below to accept your invitation and create your password.</p>
        <p style="margin:28px 0">
          <a href="${invitationLink}"
             style="background:#176b4c;color:white;padding:13px 22px;text-decoration:none;border-radius:7px">
            Accept Invitation
          </a>
        </p>
        <p>This invitation expires in 24 hours and can only be used once.</p>
        <p>If you were not expecting this invitation, ignore this email.</p>
      </div>
    `,
  });
}

module.exports = {
  sendInvitationEmail,
};
