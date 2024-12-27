const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

console.log('JWT Secret:', process.env.JWT_SECRET);

const jwtSecret = process.env.JWT_SECRET;

router.post('/signup', async (req, res) => {
  console.log('Received data:', req.body);
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(409).send('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await User.create({
      username,
      email,
      passwordHash: hashedPassword,
    });
    res.status(201).send('User created');
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).send('User not found');
  }

  if (await bcrypt.compare(password, user.passwordHash)) {
    const token = jwt.sign({ id: user.id }, jwtSecret, {
      expiresIn: '1h',
    });
    res.json({ token });
  } else {
    res.status(401).send('Invalid credentials');
  }
});

module.exports = router;
