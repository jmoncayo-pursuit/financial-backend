require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 5500;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const generateResetToken = () =>
  crypto.randomBytes(32).toString('hex');

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
app.use(express.urlencoded({ extended: true }));

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

// Add email validation function
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
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

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).send('Invalid email format');
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

// Add password recovery route
app.post('/api/recover', async (req, res) => {
  const { email } = req.body;

  // Validate email format
  if (!validateEmail(email)) {
    return res.status(400).send('Invalid email format');
  }

  // Clear any existing reset tokens
  await pool.query(
    'UPDATE Users SET resetToken = NULL, resetTokenExpiration = NULL WHERE email = $1',
    [email]
  );

  // Generate a reset token
  const resetToken = generateResetToken();
  console.log('Generated Reset Token:', resetToken); // Log the generated token for debugging
  const resetTokenExpiration = new Date(Date.now() + 3600000); // 1 hour expiration

  // Store the token in the database
  try {
    const result = await pool.query(
      'UPDATE Users SET resetToken = $1, resetTokenExpiration = $2 WHERE email = $3',
      [resetToken, resetTokenExpiration, email]
    );
    console.log('Database update result:', result); // Log the result of the database update
  } catch (error) {
    console.error('Error updating user with reset token:', error);
    return res
      .status(500)
      .send('Error updating user with reset token');
  }

  // Create a transporter for sending emails
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Create a reset link
  const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`; // Use APP_URL from environment variables
  console.log('Reset link sent:', resetLink); // Log the reset link for debugging

  // Send recovery email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Recovery',
    text: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('Recovery email sent');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Error sending recovery email');
  }

  console.log('Generated Reset Token:', resetToken);
  console.log('Reset link sent to:', email);
});

// Add this test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  console.log('Received Token:', token);

  // Find the user by the token and check if it is still valid
  const user = await pool.query(
    'SELECT * FROM Users WHERE resetToken = $1',
    [token]
  );

  console.log('Database Query Result:', user.rows); // Log the result of the query

  if (user.rows.length === 0) {
    console.log('No user found or token expired.');
    return res.status(400).send('Invalid or expired token.');
  }

  console.log('Current Time:', new Date());
  console.log(
    'Token Expiration Time:',
    user.rows[0].resetTokenExpiration
  );

  // Check if the token is expired
  if (new Date() > user.rows[0].resetTokenExpiration) {
    console.log('Token has expired.');
    return res.status(400).send('Invalid or expired token.');
  }

  // Update the user's password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await pool.query(
    'UPDATE Users SET passwordhash = $1, resetToken = NULL, resetTokenExpiration = NULL WHERE id = $2',
    [hashedPassword, user.rows[0].id]
  );

  res.send('Password has been reset successfully.');
});

// Add a GET route for the password reset page
app.get('/reset-password', (req, res) => {
  const { token } = req.query;

  // Check if the token is valid
  if (!token) {
    return res.status(400).send('Invalid or missing token.');
  }

  // Render a password reset form
  res.send(`
    <form action="/reset-password" method="POST">
      <input type="hidden" name="token" value="${token}" />
      <label for="newPassword">New Password:</label>
      <input type="password" name="newPassword" required />
      <button type="submit">Reset Password</button>
    </form>
  `);
});

// Export app for testing
module.exports = { app, pool };

// Only listen if not being tested
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
