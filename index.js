const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'your-mongodb-connection-string', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Leaderboard schema
const leaderboardSchema = new mongoose.Schema({
  rank: Number,
  player: String,
  country: String,
  score: String,
  date: String,
  platform: String,
});

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

// Get leaderboard data
app.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await Leaderboard.find().sort({ rank: 1 });
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save new player's score to leaderboard
app.post('/submit', async (req, res) => {
  const { player, country, score, date, platform } = req.body;
  const newPlayer = new Leaderboard({
    rank: await Leaderboard.countDocuments() + 1,
    player,
    country,
    score,
    date,
    platform,
  });

  try {
    await newPlayer.save();
    res.json({ message: 'Player score added successfully', leaderboard: await Leaderboard.find().sort({ rank: 1 }) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
