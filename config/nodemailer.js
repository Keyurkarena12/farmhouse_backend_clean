import nodemailer from 'nodemailer';

// Create transporter (use your email provider)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or 'hotmail', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password if 2FA enabled
  },
});

export const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: `"FarmhouseBooking" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4; border-radius: 10px;">
        <h2 style="color: #1a73e8;">Reset Your Password</h2>
        <p>Your OTP is:</p>
        <h1 style="font-size: 32px; letter-spacing: 5px; color: #34a853;">${otp}</h1>
        <p>This OTP will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};