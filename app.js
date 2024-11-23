const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

// Initialize app and middleware
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});


// Routes

// Health check
app.get('/', (req, res) => {
  res.send('Flappy Bird Scoreboard API is running!');
});

// Get top 10 scores
app.get('/api/scores', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM scores ORDER BY score DESC LIMIT 10');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching scores:', err);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

// Add a new score
app.post('/api/scores', async (req, res) => {
  const { name, country, score, platform } = req.body;

  if (!name || !country || !score || !platform) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO scores (name, country, score, platform) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, country, score, platform]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding score:', err);
    res.status(500).json({ error: 'Failed to add score' });
  }
});

// Delete all scores (admin use)
app.delete('/api/scores', async (req, res) => {
  try {
    await pool.query('DELETE FROM scores');
    res.json({ message: 'All scores deleted successfully' });
  } catch (err) {
    console.error('Error deleting scores:', err);
    res.status(500).json({ error: 'Failed to delete scores' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
