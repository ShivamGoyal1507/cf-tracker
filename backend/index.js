require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const userRoutes = require('./routes/user');
const setupCron = require('./cron/update');
const User = require('./models/User');
const { trie, insertIntoTrie } = require('./services/trie');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/user', userRoutes);
app.use(express.static(path.join(__dirname, '../frontend/public')));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('✅ MongoDB connected');

 

  setupCron();

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
}).catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
});