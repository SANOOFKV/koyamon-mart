/**
 * Koyamon Mart — API Configuration
 * Central config for all frontend JS files
 */
const KM_CONFIG = {
  API_BASE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api' 
    : 'https://koyamon-mart-api.onrender.com/api', // (Change this once Render gives you your URL)
  STORE_NAME: 'Koyamon Mart',
  CURRENCY: '₹',
  FREE_DELIVERY_ABOVE: 500,
};
