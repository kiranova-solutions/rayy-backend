const request = require("request");

const bookingCancelledSMS = ({ recipientNumber, var1, var2, var3, var4 }) => {
  return new Promise((resolve, reject) => {
    const options = {
      url: "https://api.enablex.io/sms/v1/messages/",
      json: true,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${process.env.ENABLEX_AUTH_TOKEN}`,
      },
      body: {
        type: "sms",
        data_coding: "auto",
        campaign_id: "31312845",
        recipient: [
          {
            to: recipientNumber,
            var1: String(var1),
            var2,
            var3,
            var4,
          },
        ],
        from: "RAYYAP",
        template_id: "14983671",
      },
    };

    request.post(options, (err, res, body) => {
      if (err) {
        reject(err);
        return;
      }
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve(body);
      } else {
        reject(
          new Error(
            `Failed with status code: ${res.statusCode}, Body: ${JSON.stringify(
              body
            )}`
          )
        );
      }
    });
  });
};

module.exports = {
  bookingCancelledSMS,
};
