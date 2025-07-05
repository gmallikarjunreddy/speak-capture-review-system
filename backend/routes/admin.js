
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Admin authentication
router.post('/auth', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query('SELECT id, username, password_hash FROM admin_users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: admin.id, username: admin.username, isAdmin: true }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ admin: { id: admin.id, username: admin.username }, token });
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all sentences (admin)
router.get('/sentences', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sentences ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Admin sentences fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (admin)
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, full_name, phone, state, mother_tongue, created_at FROM user_profiles ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Admin users fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all recordings (admin)
router.get('/recordings', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, u.full_name, u.email, s.text as sentence_text,
             jsonb_build_object('full_name', u.full_name, 'email', u.email) as user_profiles,
             jsonb_build_object('text', s.text) as sentences
      FROM recordings r
      LEFT JOIN user_profiles u ON r.user_id = u.id
      LEFT JOIN sentences s ON r.sentence_id = s.id
      ORDER BY r.recorded_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Admin recordings fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
