const cron = require('node-cron');
const User = require('../models/User');
const fetchCF = require('../services/fetchCF');

function setupCronJobs() {
  cron.schedule('0 * * * *', async () => {
    const users = await User.find({});
    for (const u of users) {
      try {
        const history = await fetchCF(u.handle);
        u.codeforcesHistory = history;
        u.lastFetched = new Date();
        await u.save();
        console.log(`Updated ${u.handle}`);
      } catch (e) {
        console.error(`Failed to update ${u.handle}`, e);
      }
    }
  });
  console.log('Cron job scheduled: hourly CF updates');
}

module.exports = setupCronJobs;