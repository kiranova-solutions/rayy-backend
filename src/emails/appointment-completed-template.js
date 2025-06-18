const appointmentCompletedTemplate = (name, appointmentData) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Completed</title>
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
        .details-container {
            margin: 20px 0;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        .detail-item {
            margin: 10px 0;
            display: flex;
            justify-content: space-between;
        }
        .detail-label {
            font-weight: bold;
        }
        .detail-value {
            color: #555;
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
            <img src="https://rayy.s3.ap-south-1.amazonaws.com/Others/Logo.png" alt="Ray Salon Logo">
        </div>
        <div class="title">APPOINTMENT COMPLETED</div>
        <div class="greeting">Hi ${name},</div>
        <div class="message">Your appointment has been successfully completed.</div>
        <div class="details-container">
            <div class="detail-item">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">${appointmentData.bookingId}</span>
            </div>
           
            <div class="detail-item">
                <span class="detail-label">Date of Appointment:</span>
                <span class="detail-value">${appointmentData.appointmentDate}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Time Slot of Choice:</span>
                <span class="detail-value">${appointmentData.appointmentSlot}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Staff Preference:</span>
                <span class="detail-value">${appointmentData.staffName}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Service Name:</span>
                <span class="detail-value">${appointmentData.serviceName}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Price:</span>
                <span class="detail-value">Rs.${appointmentData.servicePrice}</span>
            </div>
           
        </div>
        <div class="message">We hope you had a great experience. Feel free to book again!</div>
        <div class="footer">
            <img src="https://rayy.s3.ap-south-1.amazonaws.com/Others/Logo.png" alt="Ray Salon Logo">
            <p>Copyright © 2025 Ray Salon</p>
        </div>
    </div>
</body>
</html>`;

module.exports = appointmentCompletedTemplate;