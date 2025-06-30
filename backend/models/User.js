const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  handle: { type: String, unique: true },
  ratingTimeline: [
    {
      contestId: Number,
      rating: Number,
      rank: Number,
      date: Date,
      contestName: String
    }
  ],
  tags: [String]
});
module.exports = mongoose.model('User', userSchema);
