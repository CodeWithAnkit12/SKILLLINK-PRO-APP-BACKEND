require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const stripeWebhook = require('./routes/stripeWebhook');
const stripeRoutes = require('./routes/stripe');
const stripeCheckoutRoutes = require('./routes/stripeCheckout');

const app = express();
app.use(express.json());
const PORT = 5000;

app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/stripe', stripeCheckoutRoutes);

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});
