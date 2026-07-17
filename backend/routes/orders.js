const router = require('express').Router();
const mongoose = require('mongoose');
const Order   = require('../models/Order');
const User    = require('../models/User');
const Product = require('../models/Product');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { calculateDeliveryFee, haversineKm } = require('../utils/delivery');
const rateLimit = require('express-rate-limit');

// Signals a client-facing validation failure (bad stock, unavailable product,
// out-of-zone) from inside a transaction so it maps to a 4xx rather than a 500.
class OrderError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const STORE_LAT = parseFloat(process.env.STORE_LAT) || 11.0825;
const STORE_LNG = parseFloat(process.env.STORE_LNG) || 75.9083;

// Reduce a phone number to its last 10 digits so "+91 98765 43210" and
// "9876543210" compare equal.
const normalizePhone = (p) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');

// Throttle tracking lookups to make orderId enumeration impractical.
const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many tracking requests. Please try again later.' },
});

// ── POST /api/orders ── Place order (logged in or guest) ──────────────────────
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { items, deliveryAddress, payment, guestInfo, notes } = req.body;

    if (!items?.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    if (!deliveryAddress) {
      return res.status(400).json({ success: false, message: 'Delivery address is required' });
    }

    // Whether this is a guest order is decided by the session, not the client.
    const isGuestOrder = !req.user;
    let normalizedGuestInfo;
    if (isGuestOrder) {
      const guestName  = guestInfo?.name?.trim();
      const guestPhone = (guestInfo?.phone || '').replace(/\D/g, '').slice(-10);
      if (!guestName || !/^[6-9]\d{9}$/.test(guestPhone)) {
        return res.status(400).json({ success: false, message: 'Guest orders require a name and a valid 10-digit phone number' });
      }
      normalizedGuestInfo = { name: guestName, phone: '+91' + guestPhone };
    }

    const paymentMethod = ['cod', 'upi', 'card'].includes(payment?.method) ? payment.method : 'cod';

    // Distance and delivery fee (independent of stock, computed once)
    const distanceKm = deliveryAddress.lat && deliveryAddress.lng
      ? haversineKm(STORE_LAT, STORE_LNG, deliveryAddress.lat, deliveryAddress.lng)
      : 5; // default 5km if no coords

    let isFirstOrder = false;
    if (req.user) {
      const user = await User.findById(req.user.userId).select('orderCount');
      isFirstOrder = !!user && user.orderCount === 0;
    }

    // Stock deduction, order creation and order-count increment all run inside a
    // single transaction. Any failure (insufficient stock, crash mid-loop) aborts
    // atomically, so stock can never be deducted without a matching order.
    const session = await mongoose.startSession();
    try {
      let order;
      await session.withTransaction(async () => {
        let subtotal = 0;
        const resolvedItems = [];

        for (const item of items) {
          const productInfo = await Product.findById(item.productId)
            .select('name isActive variants')
            .session(session);
          if (!productInfo || !productInfo.isActive) {
            throw new OrderError(400, `Product not available: ${item.productId}`);
          }

          const variantInfo = productInfo.variants.find(v => v.label === item.variantLabel);
          if (!variantInfo) {
            throw new OrderError(400, `Variant not found: ${item.variantLabel}`);
          }

          const updatedProduct = await Product.findOneAndUpdate(
            {
              _id: item.productId,
              'variants.label': item.variantLabel,
              'variants.stock': { $gte: item.quantity },
            },
            { $inc: { 'variants.$.stock': -item.quantity } },
            { new: true, session }
          );
          if (!updatedProduct) {
            throw new OrderError(400, `Insufficient stock for ${productInfo.name.en}`);
          }

          const lineTotal = variantInfo.price * item.quantity;
          subtotal += lineTotal;
          resolvedItems.push({
            product:     productInfo._id,
            productName: productInfo.name.en,
            variant:     { label: variantInfo.label, price: variantInfo.price },
            quantity:    item.quantity,
            unitPrice:   variantInfo.price,
            totalPrice:  lineTotal,
          });
        }

        const { fee } = calculateDeliveryFee(subtotal, distanceKm, isFirstOrder);
        if (fee === -1) {
          throw new OrderError(400, 'Delivery not available to this location (>10KM)');
        }
        const total = subtotal + fee;

        const [created] = await Order.create([{
          user:            req.user?.userId || null,
          isGuest:         isGuestOrder,
          guestInfo:       normalizedGuestInfo,
          deliveryAddress,
          distanceKm:      Math.round(distanceKm * 10) / 10,
          items:           resolvedItems,
          subtotal,
          deliveryFee:     fee,
          total,
          isFirstOrder,
          payment: {
            method: paymentMethod,
            // Always starts unpaid: COD is collected on delivery, online payments
            // are confirmed later via /api/payment/verify.
            status: 'pending',
          },
          statusHistory: [{ status: 'placed', note: 'Order placed successfully' }],
          notes,
        }], { session });

        if (req.user) {
          await User.updateOne({ _id: req.user.userId }, { $inc: { orderCount: 1 } }, { session });
        }

        order = created;
      });

      res.status(201).json({
        success: true,
        order: { _id: order._id, orderId: order.orderId, total: order.total, deliveryFee: order.deliveryFee, status: order.status },
      });
    } catch (err) {
      if (err instanceof OrderError) {
        return res.status(err.status).json({ success: false, message: err.message });
      }
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error('place-order error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/orders/track/:orderId ──── Track by orderId string ───────────────
// orderIds are sequential and guessable, so this endpoint must not hand out
// customer PII (address, phone) to anyone who enumerates IDs. Access requires
// either an authenticated owner/staff session, or a matching phone number.
router.get('/track/:orderId', trackLimiter, optionalAuth, async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId })
      .select('-payment.razorpayOrderId -payment.razorpayPaymentId')
      .populate('user', 'phone');

    // Return an identical 404 for "not found" and "not authorized" so the
    // endpoint can't be used to probe which orderIds exist.
    const notFound = () => res.status(404).json({ success: false, message: 'Order not found' });
    if (!order) return notFound();

    const isOwner = req.user && order.user && String(order.user._id) === String(req.user.userId);
    const isStaff = req.user && (req.user.isAdmin || req.user.role === 'admin' || req.user.role === 'delivery');

    if (!isOwner && !isStaff) {
      const provided   = normalizePhone(req.query.phone);
      const orderPhone = normalizePhone(order.user?.phone || order.guestInfo?.phone);
      if (!provided || !orderPhone || provided !== orderPhone) {
        return notFound();
      }
    }

    // Collapse the populated user back to its id so the response shape is
    // unchanged and no extra user fields leak.
    const orderObj = order.toObject();
    if (orderObj.user && orderObj.user._id) orderObj.user = orderObj.user._id;

    res.json({ success: true, order: orderObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/orders/my ── User's own orders ───────────────────────────────────
router.get('/my', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .select('orderId total status createdAt items deliveryFee');
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
