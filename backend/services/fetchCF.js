// File: backend/services/fetchCF.js
const axios = require('axios');

// Fetch user's contest rating history
async function fetchRating(handle) {
  const res = await axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`);
  if (res.data.status !== 'OK') {
    throw new Error('Rating fetch failed');
  }

  return res.data.result.map(c => ({
    contestId: c.contestId,
    rating: c.newRating,
    rank: c.rank,
    date: new Date(c.ratingUpdateTimeSeconds * 1000),
    contestName: c.contestName || `Contest ${c.contestId}`
  }));
}

// Fetch all accepted problem tags by the user
async function fetchTags(handle) {
  const res = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}`);
  if (res.data.status !== 'OK') {
    throw new Error('Status fetch failed');
  }

  return res.data.result
    .filter(s => s.verdict === 'OK' && s.problem.tags?.length)
    .flatMap(s => s.problem.tags);
}

// Fetch all upcoming contests
async function fetchUpcomingContests() {
  const res = await fetch('https://codeforces.com/api/contest.list');
  const data = await res.json();

  const upcoming = data.result.filter(c => c.phase === 'BEFORE').map(c => ({
    name: c.name,
    startTime: new Date(c.startTimeSeconds * 1000).toISOString()
  }));

  return upcoming;
}
module.exports = {
  fetchRating,
  fetchTags,
  fetchUpcomingContests
};