
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'voice_capture',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
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

// Auth middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.sendStatus(403);
  }
};

// Routes

// Authentication routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, full_name, phone, state, mother_tongue } = req.body;
    
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM user_profiles WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const result = await pool.query(
      'INSERT INTO user_profiles (email, password_hash, full_name, phone, state, mother_tongue) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, full_name',
      [email, hashedPassword, full_name, phone, state, mother_tongue]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ user, token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await pool.query('SELECT id, email, password_hash, full_name FROM user_profiles WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      user: { id: user.id, email: user.email, full_name: user.full_name }, 
      token 
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User profile routes
app.get('/api/profile', authenticateToken, async (req, res) => {
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

app.put('/api/profile', authenticateToken, async (req, res) => {
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

// Sentences routes
app.get('/api/sentences', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sentences WHERE is_active = true ORDER BY created_at');
    res.json(result.rows);
  } catch (error) {
    console.error('Sentences fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Recording sessions routes
app.post('/api/recording-sessions', authenticateToken, async (req, res) => {
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

app.put('/api/recording-sessions/:id', authenticateToken, async (req, res) => {
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

// Recordings routes
app.post('/api/recordings', authenticateToken, upload.single('audio'), async (req, res) => {
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

// Admin routes
app.post('/api/admin/auth', async (req, res) => {
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

// Admin data routes (protected)
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.sendStatus(403);
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.sendStatus(403);
  }
};

app.get('/api/admin/sentences', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sentences ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Admin sentences fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, full_name, phone, state, mother_tongue, created_at FROM user_profiles ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Admin users fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/recordings', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, u.full_name, u.email, s.text as sentence_text 
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
