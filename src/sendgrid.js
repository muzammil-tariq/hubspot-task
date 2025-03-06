const sgMail = require('@sendgrid/mail');
const logger = require('./logger');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendNotification({ total, updatedCount, createdCount }) {
  try {
    const msg = {
      to: process.env.ADMIN_EMAIL,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'HubSpot Automation Report',
      text: `Total: ${total}, Updated Deals: ${updatedCount}, New Deals: ${createdCount}`,
    };

    await sgMail.send(msg);
  } catch (error) {
    logger.error('Error sending email:', error);
  }
}

module.exports = { sendNotification };
