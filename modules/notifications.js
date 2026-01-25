const nodemailer = require('nodemailer');
const PROJECTS = require('../models/Project');

async function sendNotification(projectId, subject, message) {
    const project = await PROJECTS.findById(projectId);
    if (!project) {
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
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

    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error(`Failed to send notification email to ${process.env.UPDATE_EMAIL}:`, err);
    }
}

module.exports = { sendNotification };