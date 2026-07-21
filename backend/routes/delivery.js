const router = require('express').Router();
const Order = require('../models/Order');
const User = require('../models/User');
const { requireDelivery } = require('../middleware/deliveryGuard');
const { optionalAuth } = require('../middleware/auth');
const { calculateDeliveryFee, haversineKm } = require('../utils/delivery');

const STORE_LAT = parseFloat(process.env.STORE_LAT) || 11.0825;
const STORE_LNG = parseFloat(process.env.STORE_LNG) || 75.9083;

/**
 * POST /api/delivery/fee  (public — preview only)
 * Returns the delivery fee for a given location + subtotal so the cart/checkout
 * can show it live. The authoritative fee is still recomputed at order creation.
 * Declared BEFORE the requireDelivery guard below so it stays public.
 */
router.post('/fee', optionalAuth, async (req, res) => {
  try {
    const { lat, lng, subtotal } = req.body;
    const sub = Number(subtotal) || 0;
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) {
      return res.status(400).json({ success: false, message: 'A valid location (lat/lng) is required for a delivery fee quote' });
    }
    const distanceKm = haversineKm(STORE_LAT, STORE_LNG, numLat, numLng);

    let isFirstOrder = false;
    if (req.user) {
      const user = await User.findById(req.user.userId).select('orderCount');
      isFirstOrder = !!user && user.orderCount === 0;
    }

    const { fee, reason } = calculateDeliveryFee(sub, distanceKm, isFirstOrder);
    if (fee === -1) {
      return res.status(400).json({ success: false, message: 'Delivery not available to this location (>10KM)', reason });
    }
    res.json({ success: true, fee, reason, distanceKm: Math.round(distanceKm * 10) / 10 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// All routes below require delivery (or admin) role
router.use(requireDelivery);

/**
 * GET /api/delivery/orders/my
 * Returns orders assigned to the logged-in driver that are not yet delivered
 */
router.get('/orders/my', async (req, res) => {
  try {
    const orders = await Order.find({
      deliveryBoy: req.user.userId,
      status: { $in: ['packed', 'out_for_delivery'] }
    }).sort({ updatedAt: -1 });

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/delivery/orders/:id/pickup
 * Marks an order as out for delivery
 */
router.patch('/orders/:id/pickup', async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, deliveryBoy: req.user.userId, status: 'packed' },
      {
        status: 'out_for_delivery',
        $push: { statusHistory: { status: 'out_for_delivery', note: 'Driver started delivery trip', updatedAt: new Date() } }
      },
      { new: true }
    );

    if (!order) return res.status(404).json({ success: false, message: 'Order not found or not eligible for pickup' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/delivery/orders/:id/deliver
 * Marks an order as delivered
 */
router.patch('/orders/:id/deliver', async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, deliveryBoy: req.user.userId, status: 'out_for_delivery' },
      {
        status: 'delivered',
        $push: { statusHistory: { status: 'delivered', note: 'Delivered by rider', updatedAt: new Date() } }
      },
      { new: true }
    );

    if (!order) return res.status(404).json({ success: false, message: 'Order not found or not currently out for delivery' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
