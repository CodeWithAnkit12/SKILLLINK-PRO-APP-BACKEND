const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // 
const users = require('../users');
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const PREMIUM_PRICE_ID = process.env.STRIPE_PRICE_ID; 

/**
 * @route POST /api/stripe/webhook
 * @desc Stripe webhook to handle checkout events
 */
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerEmail = session.customer_email;

    const user = users.find(u => u.email === customerEmail);

    if (user) {
      user.premium = true;
      console.log(`✅ Upgraded user ${customerEmail} to premium`);
    } else {
      console.log(`⚠️  User not found for email ${customerEmail}`);
    }
  }

  res.status(200).json({ received: true });
});

router.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: PREMIUM_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/cancel',
      customer_email: req.body.email, // from frontend form input
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe session error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

module.exports = router;
