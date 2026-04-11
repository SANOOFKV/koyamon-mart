/**
 * Delivery fee calculator — Koyamon Mart
 * - First order: Free
 * - Order >= FREE_DELIVERY_ABOVE: Free
 * - Otherwise: BASE_FEE + (distance_km * RATE_PER_KM)
 */

const FREE_DELIVERY_ABOVE = parseFloat(process.env.FREE_DELIVERY_ABOVE) || 500;
const BASE_FEE            = parseFloat(process.env.DELIVERY_BASE_FEE)   || 15;
const RATE_PER_KM         = parseFloat(process.env.DELIVERY_RATE_PER_KM)|| 8;
const MAX_KM              = parseFloat(process.env.MAX_DELIVERY_KM)     || 10;

/**
 * @param {number} subtotal   - Cart subtotal in INR
 * @param {number} distanceKm - Distance from store to delivery address
 * @param {boolean} isFirstOrder - Is this the user's first order?
 * @returns {{ fee: number, reason: string }}
 */
function calculateDeliveryFee(subtotal, distanceKm, isFirstOrder = false) {
  if (distanceKm > MAX_KM) {
    return { fee: -1, reason: 'outside_delivery_zone' };
  }
  if (isFirstOrder) {
    return { fee: 0, reason: 'first_order_free' };
  }
  if (subtotal >= FREE_DELIVERY_ABOVE) {
    return { fee: 0, reason: 'free_above_threshold' };
  }
  const fee = Math.round(BASE_FEE + distanceKm * RATE_PER_KM);
  return { fee, reason: 'distance_based' };
}

/**
 * Calculate straight-line distance between two lat/lng points (Haversine)
 * @param {number} lat1 @param {number} lng1 @param {number} lat2 @param {number} lng2
 * @returns {number} distance in km
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = { calculateDeliveryFee, haversineKm, MAX_KM, FREE_DELIVERY_ABOVE };
