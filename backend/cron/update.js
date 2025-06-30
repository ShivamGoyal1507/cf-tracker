const cron = require('node-cron');
const User = require('../models/User');
const { fetchRating } = require('../services/fetchCF'); // ✅ FIXED

function setupCronJobs() {
  cron.schedule('0 * * * *', async () => {
    const users = await User.find({});
    for (const u of users) {
      try {
        const history = await fetchRating(u.handle); // ✅ use fetchRating
        u.ratingTimeline = history; // assuming your schema field is ratingTimeline
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