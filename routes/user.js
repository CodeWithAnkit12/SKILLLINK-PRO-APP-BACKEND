// backend/routes/user.js

const express = require('express');
const router = express.Router();
const users = require('../users');

// GET /api/user/:email
router.get('/:email', (req, res) => {
  const user = users.find(u => u.email === req.params.email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ premium: user.premium });
});

module.exports = router;
