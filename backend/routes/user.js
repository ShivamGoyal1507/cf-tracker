const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { fetchRating, fetchTags, fetchUpcomingContests } = require('../services/fetchCF');
const { insertIntoTrie } = require('../services/trie');

router.post('/', async (req, res) => {
  const { handle } = req.body;
  try {
    const ratingTimeline = await fetchRating(handle);
    const tags = await fetchTags(handle);
    let user = await User.findOne({ handle });
    const isNew = !user;

    if (!user) user = new User({ handle });
    user.ratingTimeline = ratingTimeline;
    user.tags = tags;
    await user.save();

    if (isNew && global.handleTrie) {
      insertIntoTrie(handle);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Example in Express (server.js or routes.js)
router.get('/search', (req, res) => {
  const prefix = req.query.prefix || '';
  if (!prefix || !global.handleTrie) return res.json([]);
  const matches = global.handleTrie.search(prefix.toLowerCase());
  res.json(matches.slice(0, 10)); // Return top 10 matches
});
router.get('/:handle/stats', async (req, res) => {
  try {
    const user = await User.findOne({ handle: req.params.handle });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ ratingTimeline: user.ratingTimeline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:handle/tags', async (req, res) => {
  try {
    const user = await User.findOne({ handle: req.params.handle });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ tags: user.tags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/compare', async (req, res) => {
  const { u1, u2, u3 } = req.query;
  try {
    const results = await Promise.all([u1, u2, u3].filter(Boolean).map(h => User.findOne({ handle: h })));
    if (results.includes(null)) return res.status(404).json({ error: 'One or more users not found' });
    const timelines = results.map(u => ({ handle: u.handle, ratingTimeline: u.ratingTimeline, tags: u.tags }));
    res.json({ timelines });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/contests/upcoming', async (req, res) => {
  try {
    const contests = await fetchUpcomingContests();
    res.json({ contests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find();
    const leaderboard = users.map(u => ({
      handle: u.handle,
      contests: u.ratingTimeline.length,
      maxRating: Math.max(...u.ratingTimeline.map(r => r.rating))
    })).sort((a, b) => b.maxRating - a.maxRating);
    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/profile/:handle', async (req, res) => {
  try {
    const user = await User.findOne({ handle: req.params.handle });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
