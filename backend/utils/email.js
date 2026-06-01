const nodemailer = require('nodemailer');

/**
 * Sends a real email using Nodemailer and Gmail SMTP (or falls back to console log if credentials are missing)
 * @param {Object} options - Email parameters: { to, subject, text, html }
 */
const sendEmail = async (options) => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // Fallback to console simulation if environment variables are not set
  if (!smtpUser || !smtpPass) {
    console.log(`\n--- EMAIL SIMULATION (SMTP credentials not configured) ---`);
    console.log(`To:      ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body:\n${options.text || options.html}`);
    console.log(`---------------------------------------------------------\n`);
    return { simulated: true };
  }

  // Configure Nodemailer transporter for Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const mailOptions = {
    from: `"NexTalk Security" <${smtpUser}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📨 Email successfully sent to ${options.to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${options.to}:`, error);
    throw error;
  }
};

module.exports = sendEmail;
