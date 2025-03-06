require('dotenv').config();

const {
  fetchContacts,
  updateDeals,
  createNewDeals,
  checkDeals,
} = require('./hubspot');
const { sendNotification } = require('./sendgrid');
const logger = require('./logger');

(async () => {
  try {
    const contacts = await fetchContacts();

    const { contactsWithoutDeals, contactsWithDeals } = await checkDeals(
      contacts
    );
    const updatedCount = await updateDeals(contactsWithDeals);
    const createdCount = await createNewDeals(contactsWithoutDeals);
    await sendNotification({
      total: contacts.length,
      updatedCount,
      createdCount,
    });
    logger.info('Process completed successfully');
  } catch (error) {
    logger.error('Error processing contacts:', error);
  }
})();
