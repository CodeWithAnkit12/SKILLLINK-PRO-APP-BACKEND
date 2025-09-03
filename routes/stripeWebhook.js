const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const users = require('../users'); // your in-memory array
const router = express.Router();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;


router.post('/', (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_email;

    const user = users.find(u => u.email === email);
    if (user) {
      user.premium = true;
      console.log(`✅ ${email} upgraded to premium`);
    } else {
      console.warn(`⚠️ No user found for ${email}`);
    }
  }

  res.json({ received: true });
});

module.exports = router;
