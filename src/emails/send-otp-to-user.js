const otpTemplate = (name, otp) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Verification Code</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            max-width: 600px;
            margin: 0 auto;
            width: 100%;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            padding: 20px;
        }
        .header {
            padding-bottom: 20px;
            border-bottom: 1px solid #ddd;
        }
        .header img {
            width: 150px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
        }
        .greeting, .message {
            margin: 20px 0;
            line-height: 1.5;
        }
        .code-container {
            display: flex;
            justify-content: center;
            margin: 20px 0;
        }
        .code-box {
            font-size: 32px;
            border: 2px solid #ddd;
            border-radius: 8px;
            padding: 10px 20px;
            margin: 0 5px;
            background-color: #f9f9f9;
        }
        .footer {
            border-top: 1px solid #ddd;
            padding-top: 20px;
            margin-top: 20px;
            text-align: center;
        }
        .footer img {
            width: 150px;
            margin-bottom: 5px;
        }
        .social-icons img {
            width: 24px;
            margin: 0 10px;
        }
        .footer p {
            font-size: 12px;
            color: #999;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://rayy.s3.ap-south-1.amazonaws.com/Others/Logo.png" alt="Logo">
        </div>
        <div class="title">VERIFICATION EMAIL</div>
        <div class="greeting">Hi ${name || "User"},</div>
        <div class="message">Thanks for signing up! We're excited to have you join our community.</div>
        <div class="message">To get started, please verify your email address by using the code below:</div>
        <div class="code-container">
            ${otp
              .split("")
              .map((num) => `<div class="code-box">${num}</div>`)
              .join("")}
        </div>
        <div class="message">Once verified, you'll have full access to our amazing features.</div>
        <div class="message">OTP is only valid for 2 minutes.</div>
        <div class="footer">
            <img src="https://rayy.s3.ap-south-1.amazonaws.com/Others/Logo.png" alt="Logo">
           
            <p>Copyright © 2025</p>
        </div>
    </div>
</body>
</html>`;

module.exports = otpTemplate;
