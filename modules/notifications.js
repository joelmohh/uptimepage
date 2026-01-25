const nodemailer = require('nodemailer');
const PROJECTS = require('../models/Project');

async function sendNotification(projectId, subject, message) {
    try {
        const project = await PROJECTS.findById(projectId);
        if (!project) {
            return;
        }

        // Check if SMTP is configured
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_FROM || !process.env.UPDATE_EMAIL) {
            console.warn('SMTP not configured, notification not sent');
            return;
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true' || false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: process.env.UPDATE_EMAIL,
            subject: subject,
            text: message
        };

        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error(`Failed to send notification email:`, err.message);
    }
}

module.exports = { sendNotification };