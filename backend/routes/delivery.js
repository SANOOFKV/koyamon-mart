const router = require('express').Router();
const { calculateDeliveryFee, haversineKm, MAX_KM, FREE_DELIVERY_ABOVE } = require('../utils/delivery');

const STORE_LAT = parseFloat(process.env.STORE_LAT) || 11.1234;
const STORE_LNG = parseFloat(process.env.STORE_LNG) || 76.1234;

// ── POST /api/delivery/fee ─────────────────────────────────────────────────────
// Used by frontend cart page to show real-time delivery fee
router.post('/fee', (req, res) => {
  try {
    const { lat, lng, subtotal, isFirstOrder } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Location coordinates required' });
    }
    const distanceKm = haversineKm(STORE_LAT, STORE_LNG, parseFloat(lat), parseFloat(lng));
    const result     = calculateDeliveryFee(Number(subtotal), distanceKm, !!isFirstOrder);
    res.json({
      success: true,
      ...result,
      distanceKm:          Math.round(distanceKm * 10) / 10,
      maxDeliveryKm:       MAX_KM,
      freeDeliveryAbove:   FREE_DELIVERY_ABOVE,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
