const vendorBookingNotificationTemplate = (vendorName, bookingData) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Appointment Notification</title>
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
        <div class="title">NEW APPOINTMENT NOTIFICATION</div>
        <div class="greeting">Hi ${vendorName},</div>
        <div class="message">You have received a new appointment with the following details:</div>
        <div class="details-container">
            <div class="detail-item"><strong>Booking ID:</strong> ${bookingData.bookingId}</div>
            <div class="detail-item"><strong>Client Name:</strong> ${bookingData.clientName}</div>
            <div class="detail-item"><strong>Date of Appointment:</strong> ${bookingData.appointmentDate}</div>
            <div class="detail-item"><strong>Time Slot of Choice:</strong> ${bookingData.appointmentSlot}</div>
            <div class="detail-item"><strong>Staff Preference:</strong> ${bookingData.staffName}</div>
            <div class="detail-item"><strong>Service Name:</strong> ${bookingData.serviceName}</div>
            <div class="detail-item"><strong>Price:</strong> Rs.${bookingData.servicePrice}</div>
        </div>
        <div class="message">Please go to Rayy app in your phone to confirm/cancel the appointment  </div>
        <div class="footer">
            <img src="https://rayy.s3.ap-south-1.amazonaws.com/Others/Logo.png" alt="Ray Salon Logo">
            <p>Copyright © 2025 Ray Salon</p>
        </div>
    </div>
</body>
</html>`;

module.exports = vendorBookingNotificationTemplate;