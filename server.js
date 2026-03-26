 const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// 1. FIXED: This allows your GitHub site to talk to Render (Stops 401/403)
app.use(cors({ origin: '*' }));
app.use(express.json());

let deals = [];

function generateDealId() {
  return 'TRV-2026-' + Math.floor(10000 + Math.random() * 90000);
}

function generateHash(txnRef, amount, redirectUrl) {
  const secretKey = process.env.INTERSWITCH_SECRET_KEY;
  const merchantCode = process.env.INTERSWITCH_MERCHANT_CODE;
  const payItemId = process.env.INTERSWITCH_PAYABLE_ID || process.env.INTERSWITCH_PAY_ITEM_ID;

  const hashString = txnRef + merchantCode + payItemId + amount + redirectUrl + secretKey;
  return crypto.createHash('sha512').update(hashString).digest('hex');
}

app.get('/', (req, res) => {
  res.json({ message: 'TruvaPay Backend is Live!', status: 'ok', dealsCount: deals.length });
});

app.post('/api/deals', (req, res) => {
  // 2. FIXED: Catching 'deadline' from the frontend
  const { title, desc, amount, seller, buyer, email, deadline } = req.body;
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
    deadline: deadline || 'No Deadline Set', // 3. FIXED: Saves the date!
    status: 'pending',
    created: new Date().toISOString(),
    paymentRef: null,
  };

  deals.push(deal);
  
  const frontendBase = process.env.FRONTEND_URL || 'https://dami-ann.github.io/truvapay';
  
  res.json({ 
    success: true, 
    deal,
    dealLink: `${frontendBase}/deal.html?id=${deal.dealId}` 
  });
});

app.get('/api/deals/:id', (req, res) => {
  const deal = deals.find(d => d.dealId === req.params.id);
  if (!deal) {
    return res.status(404).json({ success: false, message: 'Deal not found' });
  }
  res.json({ success: true, deal });
});

app.post('/api/pay/initialize', (req, res) => {
  const { dealId, email } = req.body;
  const deal = deals.find(d => d.dealId === dealId);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  const amountInKobo = (deal.amount * 100).toString(); 
  const txnRef = 'TRV-PAY-' + Date.now();
  const frontendBase = process.env.FRONTEND_URL || 'https://dami-ann.github.io/truvapay';
  const redirectUrl = `${frontendBase}/deal.html?id=${dealId}&paid=true&ref=${txnRef}`;
  
  deal.paymentRef = txnRef;
  const hash = generateHash(txnRef, amountInKobo, redirectUrl);

  res.json({
    success: true,
    paymentUrl: `https://webpay.interswitchng.com/collections/w/pay`, 
    params: {
        merchantCode: process.env.INTERSWITCH_MERCHANT_CODE,
        payItemID: process.env.INTERSWITCH_PAYABLE_ID || process.env.INTERSWITCH_PAY_ITEM_ID,
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TruvaPay Backend running on port ${PORT}`));