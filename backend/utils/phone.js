/**
 * Shared Indian mobile number helpers. Consolidates logic that used to be
 * copy-pasted across auth.js, orders.js and admin.js.
 */

const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;

/**
 * Normalize a raw phone string (with or without spaces/+91) to a validated
 * "+91XXXXXXXXXX" form.
 * @param {string} raw
 * @returns {string|null} normalized phone, or null if it isn't a valid 10-digit Indian mobile number
 */
function toIndianPhone(raw) {
  const clean = String(raw || '').replace(/\s/g, '').replace(/^\+?91/, '');
  return INDIAN_MOBILE_RE.test(clean) ? '+91' + clean : null;
}

/**
 * Reduce a phone number to its last 10 digits so "+91 98765 43210" and
 * "9876543210" compare equal. Used for loose matching (e.g. guest order
 * lookups), not validation.
 * @param {string} raw
 * @returns {string}
 */
function last10Digits(raw) {
  return raw ? String(raw).replace(/\D/g, '').slice(-10) : '';
}

module.exports = { toIndianPhone, last10Digits };
