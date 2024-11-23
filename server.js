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
  const { name, country, score, platform, device_id } = req.body;

  if (!name || !country || !score || !platform || !device_id) {
    return res.status(400).json({ error: 'Name, country, score, platform, and device_id are required' });
  }

  try {
    // Check if the device has already submitted a score
    const result = await pool.query('SELECT * FROM scores WHERE device_id = $1', [device_id]);

    if (result.rows.length > 0) {
      // If the device has already submitted a score, check if it's higher
      const currentHighScore = result.rows[0].score;

      if (score > currentHighScore) {
        // If the new score is higher, update the score
        await pool.query(
          'UPDATE scores SET name = $1, country = $2, score = $3, platform = $4 WHERE device_id = $5',
          [name, country, score, platform, device_id]
        );
        res.status(200).json({ message: 'High score updated successfully' });
      } else {
        res.status(200).json({ message: 'High score not updated (current score is higher)' });
      }
    } else {
      // If the device hasn't submitted a score before, insert the score
      await pool.query(
        'INSERT INTO scores (name, country, score, platform, device_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, country, score, platform, device_id]
      );
      res.status(201).json({ message: 'High score added successfully' });
    }
  } catch (err) {
    console.error('Error adding or updating score:', err);
    res.status(500).json({ error: 'Failed to submit high score' });
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


// Check if name is already taken
app.post('/api/check-name', async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    // Check if the name already exists
    const result = await pool.query('SELECT * FROM scores WHERE name = $1', [name]);

    if (result.rows.length > 0) {
      // Name is already taken
      res.status(400).json({ error: 'This name is already taken. Please choose another one.' });
    } else {
      // Name is available
      res.status(200).json({ message: 'Name is available' });
    }
  } catch (err) {
    console.error('Error checking name:', err);
    res.status(500).json({ error: 'Failed to check name availability' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
