const express = require('express');
const router = express.Router();

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
const KHALTI_BASE_URL = 'https://dev.khalti.com/api/v2'; // test environment

// POST /api/khalti/initiate
// Initiates a Khalti payment and returns the payment_url to redirect the user to
router.post('/initiate', async (req, res) => {
  try {
    const {
      amount,        // in paisa (Rs × 100)
      orderId,       // unique order reference
      orderName,     // human-readable description
      customerName,
      customerEmail,
      customerPhone,
      returnUrl,     // where Khalti redirects after payment
    } = req.body;

    if (!amount || !orderId || !returnUrl) {
      return res.status(400).json({ error: 'amount, orderId, and returnUrl are required' });
    }

    const payload = {
      return_url: returnUrl,
      website_url: process.env.FRONTEND_URL || 'http://localhost:3000',
      amount: Math.round(amount), // must be integer paisa
      purchase_order_id: orderId,
      purchase_order_name: orderName || 'Appointment Booking',
      customer_info: {
        name: customerName || 'Patient',
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) ? customerEmail : '',
        phone: customerPhone || '',
      },
    };

    const response = await fetch(`${KHALTI_BASE_URL}/epayment/initiate/`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Khalti initiate error:', JSON.stringify(data, null, 2));
      // Forward the full Khalti error so the frontend can display it
      return res.status(response.status).json({
        error: 'Khalti initiation failed',
        details: data,
        khaltiError: data,
      });
    }

    // data contains: pidx, payment_url, expires_at, expires_in, user_fee
    res.json({ success: true, pidx: data.pidx, paymentUrl: data.payment_url });
  } catch (err) {
    console.error('Khalti initiate exception:', err);
    res.status(500).json({ error: 'Failed to initiate Khalti payment', message: err.message });
  }
});

// POST /api/khalti/verify
// Verifies a completed payment using the pidx returned by Khalti
router.post('/verify', async (req, res) => {
  try {
    const { pidx } = req.body;

    if (!pidx) {
      return res.status(400).json({ error: 'pidx is required' });
    }

    const response = await fetch(`${KHALTI_BASE_URL}/epayment/lookup/`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pidx }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Khalti verify error:', data);
      return res.status(response.status).json({ error: 'Khalti verification failed', details: data });
    }

    // data.status: 'Completed' | 'Pending' | 'Initiated' | 'Refunded' | 'Expired' | 'User canceled'
    const paid = data.status === 'Completed';

    res.json({
      success: true,
      paid,
      status: data.status,
      transactionId: data.transaction_id,
      amount: data.total_amount, // in paisa
      pidx: data.pidx,
    });
  } catch (err) {
    console.error('Khalti verify exception:', err);
    res.status(500).json({ error: 'Failed to verify Khalti payment', message: err.message });
  }
});

module.exports = router;
