const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { run, get, all } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets from public/
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: 'SQLite (Connected)'
  });
});

// GET all registered users (passwords omitted for security)
app.get('/api/users', async (req, res) => {
  try {
    const users = await all(
      'SELECT id, fullName, email, createdAt FROM users ORDER BY id DESC'
    );
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve users from database' });
  }
});

// POST Registration endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // 1. Validation
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // 2. Check if email already exists in database
    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // 3. Hash the password securely with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Insert user into SQLite database
    const result = await run(
      'INSERT INTO users (fullName, email, password) VALUES (?, ?, ?)',
      [fullName.trim(), email.trim().toLowerCase(), hashedPassword]
    );

    // 5. Fetch the inserted user record (excluding password)
    const newUser = await get(
      'SELECT id, fullName, email, createdAt FROM users WHERE id = ?',
      [result.id]
    );

    console.log(`✅ New user registered: ${newUser.fullName} (${newUser.email}) - ID: ${newUser.id}`);

    return res.status(201).json({
      success: true,
      message: 'Account created and saved to database successfully!',
      user: newUser
    });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating account.'
    });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`
🚀 Server running at http://localhost:${PORT}
🌐 Frontend Registration Page: http://localhost:${PORT}
🔌 Registration API: http://localhost:${PORT}/api/register
📋 Users Database API: http://localhost:${PORT}/api/users
  `);
});
