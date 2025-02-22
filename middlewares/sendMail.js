import { createTransport } from "nodemailer";

const sendMail = async (email, subject, htmlContent) => {
  try {
    const transport = createTransport({
      host: "smtp.gmail.com",
      port: 465,
      auth: {
        user: process.env.Gmail,
        pass: process.env.Password,
      },
    });

    await transport.sendMail({
      from: `"Your Website Team" <${process.env.Gmail}>`,
      to: email,
      subject,
      html: htmlContent,
    });

    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Unable to send email");
  }
};

export default sendMail;

export const generateOtpEmail = (name, otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OTP Verification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f9f9f9;
      padding: 20px;
    }
    .container {
      max-width: 500px;
      background: #ffffff;
      margin: auto;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #5a2d82;
    }
    .otp {
      font-size: 24px;
      color: #ff5722;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>OTP Verification</h1>
    <p>Hello <strong>${name}</strong>,</p>
    <p>Your One-Time Password (OTP) for verification is:</p>
    <div class="otp">${otp}</div>
    <p>Thank you,<br>Your Website Team</p>
  </div>
</body>
</html>
`;

export const generateResetPasswordEmail = (resetLink) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3f3f3;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #5a2d82;
    }
    .button {
      background-color: #5a2d82;
      color: white;
      padding: 15px 25px;
      text-decoration: none;
      border-radius: 5px;
      display: inline-block;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Reset Your Password</h1>
    <p>Click the button below to reset your password:</p>
    <a href="${resetLink}" class="button">Reset Password</a>
    <p>If you did not request this, please ignore this email.</p>
    <p>Thank you,<br>Your Website Team</p>
  </div>
</body>
</html>
`;
