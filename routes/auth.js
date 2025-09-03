const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const users = require('../users');

const router = express.Router();
const JWT_SECRET = 'ankit@123';

// Register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const existing = users.find(u => u.email === email);
  if (existing) return res.status(400).json({ message: 'User already exists' });

  const hashed = await bcrypt.hash(password, 10);
  users.push({ email, password: hashed, premium: false });
  res.status(201).json({ message: 'User registered' });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(403).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax'
  });

  res.status(200).json({ message: 'Login success' });
});

// Profile (Protected)
router.get('/profile', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Not logged in' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.email === decoded.email);
    res.json({ email: user.email, premium: user.premium });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

router.post('/stripe/webhook', express.json(), (req, res) => {
  const event = req.body;

  if (event.type === 'checkout.session.completed') {
    const email = event.data.object.customer_email;
    const user = users.find(u => u.email === email);
    if (user) {
      user.premium = true;
      console.log(`User ${email} upgraded to Premium`);
    }
  }

  res.status(200).json({ received: true });
});

// Upgrade to Premium
router.post('/upgrade', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Not logged in' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.email === decoded.email);

    if (!user) return res.status(404).json({ message: 'User not found' });

    user.premium = true;
    res.json({ message: 'Upgraded to premium' });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
