
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Upload recording
router.post('/', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    const { sentence_id, status, attempt_number } = req.body;
    const audio_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!audio_url) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const recordingId = `${req.user.userId}_${sentence_id}_${Date.now()}`;

    const result = await pool.query(
      'INSERT INTO recordings (id, user_id, sentence_id, audio_url, status, attempt_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [recordingId, req.user.userId, sentence_id, audio_url, status, attempt_number]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Recording save error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user recordings
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(`
      SELECT r.*, s.text as sentence_text 
      FROM recordings r
      LEFT JOIN sentences s ON r.sentence_id = s.id
      WHERE r.user_id = $1
      ORDER BY r.recorded_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('User recordings fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
