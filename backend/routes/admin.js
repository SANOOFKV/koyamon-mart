const router = require('express').Router();
const Product  = require('../models/Product');
const Category = require('../models/Category');
const Order    = require('../models/Order');
const User     = require('../models/User');
const Notification = require('../models/Notification');
const { requireAdmin } = require('../middleware/adminGuard');

// All admin routes require admin JWT
router.use(requireAdmin);

// ════════════════════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════════════════════
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      totalUsers,
      lowStockProducts,
      revenueResult,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: { $in: ['placed', 'confirmed', 'packed'] } }),
      User.countDocuments(),
      Product.find({ 'variants.stock': { $lte: 5 }, isActive: true }).select('name variants').limit(10),
      Order.aggregate([
        { $match: { 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);
    res.json({
      success: true,
      stats: {
        totalOrders,
        todayOrders,
        pendingOrders,
        totalUsers,
        revenue: revenueResult[0]?.total || 0,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  PRODUCTS
// ════════════════════════════════════════════════════════════
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 30, category, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };
    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Product.countDocuments(filter);
    res.json({ success: true, products, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Stock update shortcut ─────────────────────────────────────────────────────
router.patch('/products/:id/stock', async (req, res) => {
  try {
    const { variantLabel, stock } = req.body;
    await Product.updateOne(
      { _id: req.params.id, 'variants.label': variantLabel },
      { $set: { 'variants.$.stock': Number(stock) } }
    );
    res.json({ success: true, message: 'Stock updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  CATEGORIES
// ════════════════════════════════════════════════════════════
router.post('/categories', async (req, res) => {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json({ success: true, category: cat });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, category: cat });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await Category.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Category deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  ORDERS
// ════════════════════════════════════════════════════════════
router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = status ? { status } : {};
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Order.countDocuments(filter);
    res.json({ success: true, orders, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product', 'name images');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status,
        $push: { statusHistory: { status, note: note || '', updatedAt: new Date() } },
      },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Assign order to Delivery Boy ──────────────────────────────────────────────
router.patch('/orders/:id/assign', async (req, res) => {
  try {
    const { deliveryBoyId } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryBoy: deliveryBoyId },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  STAFF & USERS
// ════════════════════════════════════════════════════════════
router.get('/users', async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.phone = { $regex: search, $options: 'i' };
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'delivery', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/delivery-boys', async (req, res) => {
  try {
    const users = await User.find({ role: 'delivery' }).select('name phone _id');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ════════════════════════════════════════════════════════════
router.post('/notifications', async (req, res) => {
  try {
    // In production, real SMS/Push gateway logic would trigger here based on req.body.channels
    const notif = await Notification.create(req.body);
    res.status(201).json({ success: true, notification: notif });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
