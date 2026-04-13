const nodemailer = require('nodemailer');
const PROJECTS = require('../models/Project');
require('dotenv').config();

async function sendNotification(projectName, subject, message) {
    try {
        if (!message || !subject) {
            console.log(`Your request is missing a subject or message.`);
            return;
        }

        // Check if SMTP is configured
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.UPDATE_EMAIL || !process.env.PERSONAL_EMAIL) {
            console.warn('[SMTP] SMTP configuration is incomplete. Skipping email notification.');
            return;
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            from: process.env.UPDATE_EMAIL,
            to: process.env.PERSONAL_EMAIL,
            subject: subject,
            text: message
        };

        await transporter.sendMail(mailOptions);
        console.log(`Notification email sent for project ${projectName}: ${subject}`);
    } catch (err) {
         console.error(`Failed to send notification email:`, err);
    }
}

module.exports = { sendNotification };