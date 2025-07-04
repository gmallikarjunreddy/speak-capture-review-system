
const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, full_name, phone, state, mother_tongue FROM user_profiles WHERE id = $1', [req.user.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { full_name, phone, state, mother_tongue } = req.body;
    const result = await pool.query(
      'UPDATE user_profiles SET full_name = $1, phone = $2, state = $3, mother_tongue = $4, updated_at = NOW() WHERE id = $5 RETURNING id, email, full_name, phone, state, mother_tongue',
      [full_name, phone, state, mother_tongue, req.user.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
