require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 5500;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Create pool based on environment
const createPool = () => {
  if (process.env.NODE_ENV === 'test') {
    return new Pool({
      connectionString: 'postgresql://localhost:5432/financial_test',
    });
  }
  return new Pool({
    connectionString: process.env.DATABASE_URL,
  });
};

const pool = createPool();

// Middleware MUST be before routes
app.use(cors());
app.use(express.json());

// Add password validation function
const validatePassword = (password) => {
  console.log('Validating password:', password); // Debugging line
  // Length check
  if (password.length < 8) return false;

  // Character variety checks
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  console.log('Password validation results:', {
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
  }); // Debugging line

  const varietyCount = [
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
  ].filter(Boolean).length;

  // Require at least medium strength (2 character types and 8+ chars)
  return varietyCount >= 2;
};

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  let client;

  try {
    // Validate presence of email and password
    if (!email) {
      return res.status(400).send('Email is required');
    }
    if (!password) {
      return res.status(400).send('Password is required');
    }

    // Validate password strength
    const isValidPassword = validatePassword(password);
    if (!isValidPassword) {
      return res
        .status(400)
        .send(
          'Password must be at least 8 characters long and include a mix of letters, numbers, or symbols.'
        );
    }

    client = await pool.connect();
    const { rows } = await client.query(
      'SELECT * FROM Users WHERE email = $1',
      [email]
    );
    if (rows.length) {
      return res.status(409).send('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await client.query(
      'INSERT INTO Users (email, passwordhash) VALUES ($1, $2)',
      [email, hashedPassword]
    );
    res.status(201).send('User created');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  let client;
  let rows;

  try {
    client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM Users WHERE email = $1',
      [email]
    );
    rows = result.rows;

    if (rows.length === 0) {
      return res.status(401).send('Invalid credentials');
    }

    const user = rows[0];

    if (!user.passwordhash || !password) {
      return res.status(401).send('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(
      password,
      user.passwordhash
    );

    if (!validPassword) {
      return res.status(401).send('Invalid credentials');
    }

    await client.query(
      'UPDATE Users SET lastloginat = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      {
        expiresIn: '24h',
      }
    );

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error');
  } finally {
    if (client) {
      client.release();
    }
  }
});

// Add this test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Export app for testing
module.exports = { app, pool };

// Only listen if not being tested
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
