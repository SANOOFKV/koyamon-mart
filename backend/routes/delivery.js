const router = require('express').Router();
const Order = require('../models/Order');
const { requireDelivery } = require('../middleware/deliveryGuard');

// All routes require delivery (or admin) role
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
