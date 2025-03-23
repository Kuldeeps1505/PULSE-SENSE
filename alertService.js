const twilio = require('twilio');
require('dotenv').config();

console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID);
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? "loaded" : "MISSING!");
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER);




if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN ) {
  throw new Error('Twilio Account SID or Auth Token is missing');
}



const sendSmsAlert = (phoneNumber, heartRate) => {
  const message = Alert;

  client.messages
    .create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    })
    .then((message) => console.log('SMS sent:', message.sid))
    .catch((err) => console.error('Error sending SMS:', err));
};

module.exports = sendSmsAlert;
