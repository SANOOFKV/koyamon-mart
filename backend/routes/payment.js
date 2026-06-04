const router = require('express').Router();
const crypto   = require('crypto');
const Order    = require('../models/Order');

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env');
  }
  const Razorpay = require('razorpay');
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}

// ── POST /api/payment/create-order ────────────────────────────────────────────
router.post('/create-order', async (req, res) => {
  try {
    const { orderId } = req.body;  // our internal orderId (KM-...)
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const razorpay = getRazorpay();
    const rzpOrder = await razorpay.orders.create({
      amount:   Math.round(order.total * 100),   // paise
      currency: 'INR',
      receipt:  order.orderId,
      notes:    { koyamon_order_id: order._id.toString() },
    });

    await Order.updateOne({ _id: order._id }, {
      'payment.razorpayOrderId': rzpOrder.id,
    });

    res.json({
      success: true,
      razorpayOrder: rzpOrder,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('rzp create-order error:', err);
    res.status(500).json({ success: false, message: 'Payment order creation failed' });
  }
});

// ── POST /api/payment/verify ──────────────────────────────────────────────────
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const result = await Order.updateOne({ orderId }, {
      'payment.status':            'paid',
      'payment.razorpayPaymentId': razorpay_payment_id,
      'payment.paidAt':            new Date(),
      status:                      'confirmed',
      $push: { statusHistory: { status: 'confirmed', note: 'Payment received' } },
    });

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (err) {
    console.error('rzp verify error:', err);
    res.status(500).json({ success: false, message: 'Payment verification error' });
  }
});

module.exports = router;
