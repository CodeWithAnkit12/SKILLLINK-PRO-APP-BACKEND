const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Make sure this is set in .env
const users = require('../users'); // Your in-memory user array

router.post('/checkout-session', async (req, res) => {
  try {
    const dummyEmail = 'user@example.com'; // Replace this with actual logged-in user's email

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      customer_email: dummyEmail,
      success_url: 'http://localhost:3000/dashboard?verified=true',
      cancel_url: 'http://localhost:3000/dashboard?verified=false',
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout session error:', err);
    res.status(500).json({ error: 'Something went wrong creating the checkout session' });
  }
});

module.exports = router;
