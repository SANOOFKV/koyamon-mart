/**
 * Koyamon Mart — API Configuration
 * Central config for all frontend JS files
 */
const KM_CONFIG = {
  // In production the frontend is served from the API's own origin, so the API
  // is reached via a same-origin relative path. This keeps the auth cookies
  // sameSite=strict (no cross-site exposure). Dev still points at the local API.
  API_BASE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api',
  STORE_NAME: 'Koyamon Mart',
  CURRENCY: '₹',
  FREE_DELIVERY_ABOVE: 500,
};
