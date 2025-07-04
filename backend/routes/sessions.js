
const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create recording session
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { total_sentences } = req.body;
    const result = await pool.query(
      'INSERT INTO recording_sessions (user_id, total_sentences) VALUES ($1, $2) RETURNING *',
      [req.user.userId, total_sentences]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update recording session
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { completed_sentences, status, completed_at } = req.body;
    const result = await pool.query(
      'UPDATE recording_sessions SET completed_sentences = $1, status = $2, completed_at = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
      [completed_sentences, status, completed_at, id, req.user.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Session update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
