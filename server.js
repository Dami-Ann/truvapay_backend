 const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

let deals = [];

// =============================================
// HELPERS
// =============================================
function generateDealId() {
  return 'TRV-2026-' + Math.floor(10000 + Math.random() * 90000);
}

function generateHash(txnRef, amount, redirectUrl) {
  const secretKey = process.env.INTERSWITCH_SECRET_KEY;
  const merchantCode = process.env.INTERSWITCH_MERCHANT_CODE;
  const payItemId = process.env.INTERSWITCH_PAY_ITEM_ID;

  // Interswitch requires a very specific string order for the SHA512 hash
  const hashString = txnRef + merchantCode + payItemId + amount + redirectUrl + secretKey;
  return crypto.createHash('sha512').update(hashString).digest('hex');
}

// =============================================
// ROUTES
// =============================================

app.get('/', (req, res) => {
  res.json({ message: 'TruvaPay Backend is Live!', status: 'ok' });
});

// Create Deal
app.post('/api/deals', (req, res) => {
  const { title, desc, amount, seller, buyer, email } = req.body;
  if (!title || !amount || !seller) {
    return res.status(400).json({ error: 'Missing title, amount, or seller' });
  }

  const deal = {
    dealId: generateDealId(),
    title,
    desc: desc || '',
    amount: Number(amount),
    seller,
    buyer: buyer || '',
    email: email || '',
    status: 'pending',
    created: new Date().toISOString(),
    paymentRef: null,
  };

  deals.push(deal);
  res.json({ 
    success: true, 
    deal,
    dealLink: `${process.env.FRONTEND_URL}/deal.html?id=${deal.dealId}` 
  });
});

// Get a Single Deal by ID (Essential for the Deal Page to load)
app.get('/api/deals/:id', (req, res) => {
  const deal = deals.find(d => d.dealId === req.params.id);
  if (!deal) {
    return res.status(404).json({ success: false, message: 'Deal not found' });
  }
  res.json({ success: true, deal });
});

// Initialize Payment
app.post('/api/pay/initialize', (req, res) => {
  const { dealId, email } = req.body;
  const deal = deals.find(d => d.dealId === dealId);

  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  const amountInKobo = (deal.amount * 100).toString(); // Interswitch uses Kobo (string)
  const txnRef = 'TRV-PAY-' + Date.now();
  const redirectUrl = `${process.env.FRONTEND_URL}/deal.html?id=${dealId}&paid=true&ref=${txnRef}`;
  
  deal.paymentRef = txnRef;
  const hash = generateHash(txnRef, amountInKobo, redirectUrl);

  res.json({
    success: true,
    paymentUrl: `https://sandbox.interswitchng.com/collections/w/pay`,
    params: {
        merchantCode: process.env.INTERSWITCH_MERCHANT_CODE,
        payItemID: process.env.INTERSWITCH_PAY_ITEM_ID,
        amount: amountInKobo,
        transactionreference: txnRef,
        currency: '566',
        customerEmail: email || deal.email,
        hash: hash,
        redirectUrl: redirectUrl,
        mode: 'TEST'
    }
  });
});

// Release Payment (Buyer confirms delivery)
app.patch('/api/deals/:dealId/release', (req, res) => {
  const deal = deals.find(d => d.dealId === req.params.dealId);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  deal.status = 'completed';
  res.json({ success: true, message: 'Funds released to seller!', deal });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TruvaPay Backend running on port ${PORT}`));