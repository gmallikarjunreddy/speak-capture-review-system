
const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Get all active sentences
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sentences WHERE is_active = true ORDER BY created_at');
    res.json(result.rows);
  } catch (error) {
    console.error('Sentences fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new sentence
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    const result = await pool.query(
      'INSERT INTO sentences (text) VALUES ($1) RETURNING *',
      [text]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Sentence creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update sentence
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, is_active } = req.body;
    const result = await pool.query(
      'UPDATE sentences SET text = $1, is_active = $2 WHERE id = $3 RETURNING *',
      [text, is_active, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Sentence update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete sentence
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM sentences WHERE id = $1', [id]);
    res.json({ message: 'Sentence deleted successfully' });
  } catch (error) {
    console.error('Sentence deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
