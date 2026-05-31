const router = require('express').Router();
const Order   = require('../models/Order');
const User    = require('../models/User');
const Product = require('../models/Product');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { calculateDeliveryFee, haversineKm } = require('../utils/delivery');

const STORE_LAT = parseFloat(process.env.STORE_LAT) || 11.0825;
const STORE_LNG = parseFloat(process.env.STORE_LNG) || 75.9083;

// ── POST /api/orders ── Place order (logged in or guest) ──────────────────────
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { items, deliveryAddress, payment, isGuest, guestInfo, notes } = req.body;

    if (!items?.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    if (!deliveryAddress) {
      return res.status(400).json({ success: false, message: 'Delivery address is required' });
    }

    // Calculate subtotal and atomically deduct stock
    let subtotal = 0;
    const resolvedItems = [];
    
    // Track successful deductions for manual rollback
    const deductedStocks = [];
    
    const rollbackStock = async (stocks) => {
      for (const st of stocks) {
        await Product.updateOne(
          { _id: st.productId, 'variants.label': st.variantLabel },
          { $inc: { 'variants.$.stock': st.quantity } }
        );
      }
    };

    for (const item of items) {
      const productInfo = await Product.findById(item.productId).select('name isActive variants');
      if (!productInfo || !productInfo.isActive) {
        await rollbackStock(deductedStocks);
        return res.status(400).json({ success: false, message: `Product not available: ${item.productId}` });
      }
      
      const variantInfo = productInfo.variants.find(v => v.label === item.variantLabel);
      if (!variantInfo) {
        await rollbackStock(deductedStocks);
        return res.status(400).json({ success: false, message: `Variant not found: ${item.variantLabel}` });
      }
      
      // Attempt atomic deduction
      const updatedProduct = await Product.findOneAndUpdate(
        { 
          _id: item.productId, 
          'variants.label': item.variantLabel,
          'variants.stock': { $gte: item.quantity } 
        },
        { $inc: { 'variants.$.stock': -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        await rollbackStock(deductedStocks);
        return res.status(400).json({ success: false, message: `Insufficient stock for ${productInfo.name.en}` });
      }

      deductedStocks.push({ productId: item.productId, variantLabel: item.variantLabel, quantity: item.quantity });

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

    // Distance and delivery fee
    const distanceKm = deliveryAddress.lat && deliveryAddress.lng
      ? haversineKm(STORE_LAT, STORE_LNG, deliveryAddress.lat, deliveryAddress.lng)
      : 5; // default 5km if no coords

    let isFirstOrder = false;
    if (req.user) {
      const user = await User.findById(req.user.userId);
      isFirstOrder = user.orderCount === 0;
    }

    const { fee, reason } = calculateDeliveryFee(subtotal, distanceKm, isFirstOrder);
    if (fee === -1) {
      return res.status(400).json({ success: false, message: 'Delivery not available to this location (>10KM)' });
    }

    const total = subtotal + fee;

    let order;
    try {
      order = await Order.create({
        user:            req.user?.userId || null,
        isGuest:         isGuest || !req.user,
        guestInfo:       isGuest ? guestInfo : undefined,
        deliveryAddress,
        distanceKm:      Math.round(distanceKm * 10) / 10,
        items:           resolvedItems,
        subtotal,
        deliveryFee:     fee,
        total,
        isFirstOrder,
        payment: {
          method: payment?.method || 'cod',
          status: payment?.method === 'cod' ? 'pending' : 'pending',
        },
        statusHistory: [{ status: 'placed', note: 'Order placed successfully' }],
        notes,
      });
    } catch (orderErr) {
      console.error('Order creation failed:', orderErr);
      await rollbackStock(deductedStocks);
      return res.status(500).json({ success: false, message: 'Failed to create order, stock refunded.' });
    }

    // Increment user order count
    if (req.user) {
      await User.updateOne({ _id: req.user.userId }, { $inc: { orderCount: 1 } });
    }

    res.status(201).json({ success: true, order: { _id: order._id, orderId: order.orderId, total, deliveryFee: fee, status: order.status } });
  } catch (err) {
    console.error('place-order error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/orders/track/:orderId ──── Track by orderId string ───────────────
router.get('/track/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId })
      .select('-payment.razorpayOrderId -payment.razorpayPaymentId');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
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
