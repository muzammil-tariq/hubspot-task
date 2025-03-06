const Hubspot = require('@hubspot/api-client');
const logger = require('./logger');

const hubspotClient = new Hubspot.Client({
  accessToken: process.env.HUBSPOT_API_KEY,
});

async function fetchContacts() {
  try {
    const startDate = new Date('2025-01-01').getTime();
    const endDate = new Date('2025-02-01').getTime();
    let contacts = [];
    let after;
    const limit = 100;

    do {
      const response = await hubspotClient.crm.contacts.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'createdate',
                operator: 'BETWEEN',
                value: startDate,
                highValue: endDate,
              },
            ],
          },
        ],
        limit,
        after,
      });
      contacts = contacts.concat(response.results);
      after = response.paging ? response.paging.next.after : undefined;
    } while (after);

    return contacts;
  } catch (error) {
    logger.error('Error fetching contacts:', error);
    throw error;
  }
}

async function checkDeals(contacts) {
  try {
    const contactsWithDeals = [];
    const contactsWithoutDeals = [];
    for (const contact of contacts) {
      const deals = await hubspotClient.crm.deals.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'associations.contact',
                operator: 'EQ',
                value: contact.id,
              },
            ],
          },
        ],
      });

      if (deals.results.length > 0) {
        contactsWithDeals.push({
          ...contact,
          deals: deals.results,
        });
      } else {
        contactsWithoutDeals.push(contact);
      }
    }

    return { contactsWithDeals, contactsWithoutDeals };
  } catch (error) {
    logger.error('Error checking deals:', error);
    throw error;
  }
}
async function updateDeals(contacts) {
  try {
    let updatedCount = 0;
    const batchUpdates = [];
    for (const contact of contacts) {
      contact.deals.forEach((deal) => {
        batchUpdates.push({
          id: deal.id,
          properties: { follow_up_status: 'pending_review' },
        });
      });
    }

    if (batchUpdates.length > 0) {
      await hubspotClient.crm.deals.batchApi.update({ inputs: batchUpdates });
      updatedCount = batchUpdates.length;
    }

    return updatedCount;
  } catch (error) {
    logger.error('Error updating deals:', error);
    throw error;
  }
}

async function createNewDeals(contacts) {
  try {
    let createdCount = 0;
    const batchCreates = [];

    contacts.forEach((contact) => {
      batchCreates.push({
        properties: {
          dealname: `New Deal for ${contact.properties.firstname}`,
          pipeline: 'default',
          dealstage: 'appointmentscheduled',
          amount: 1000,
        },
        associations: [
          {
            to: { id: contact.id, type: 'contacts' },
          },
        ],
      });
    });

    if (batchCreates.length > 0) {
      await hubspotClient.crm.deals.batchApi.create({
        inputs: batchCreates,
      });
      createdCount = batchCreates.length;
    }

    return createdCount;
  } catch (error) {
    logger.error('Error creating deals:', error);
    throw error;
  }
}

module.exports = {
  fetchContacts,
  updateDeals,
  createNewDeals,
  checkDeals,
};
