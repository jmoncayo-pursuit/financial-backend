require('dotenv').config();
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateResetToken = () =>
  crypto.randomBytes(32).toString('hex');

// Assuming you have a user object with an email and a way to store the token
const userEmail = 'recipient@example.com'; // Replace with the actual user's email
const resetToken = generateResetToken();
const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`; // Use APP_URL from environment variables

// Define the email options
const mailOptions = {
  from: process.env.EMAIL_USER,
  to: userEmail,
  subject: 'Password Reset Request',
  text: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}`,
};

console.log('Email User:', process.env.EMAIL_USER); // Debugging line
console.log('Email Pass:', process.env.EMAIL_PASS); // Debugging line

// Send the email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending email:', error.message);
    return;
  }
  console.log('Email sent:', info.response);
});
