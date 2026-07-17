/**
 * Pre-merge smoke test for the security/correctness fixes.
 *
 * Exercises the real HTTP endpoints against a running API + a MongoDB replica set
 * (Atlas dev cluster). Verifies:
 *   #7  order placement is transactional (no partial stock deduction on failure)
 *   #8  guest orders require a name + valid phone
 *   #2  order tracking rejects lookups without the matching phone (no PII leak)
 *   #1  payment verification rejects a mismatched razorpay order
 *
 * Prereqs:
 *   1. The API server is running against your Atlas dev DB, e.g.:
 *        MONGO_URI="mongodb+srv://.../koyamon-mart-dev" npm run dev
 *   2. Run this against the SAME database + API:
 *        MONGO_URI="mongodb+srv://.../koyamon-mart-dev" \
 *        API_URL="http://localhost:5000" \
 *        node scripts/premerge-smoke.js
 *
 * It seeds a throwaway category + product and deletes them (and its test orders)
 * on the way out. Safe to run repeatedly. Use a DEV database, not production.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product  = require('../models/Product');
const Order    = require('../models/Order');

const API       = process.env.API_URL || 'http://localhost:5000';
const MONGO_URI = process.env.MONGO_URI;

let passed = 0, failed = 0;
const ok = (cond, msg) => {
  if (cond) { passed++; console.log('  ✅', msg); }
  else       { failed++; console.log('  ❌', msg); }
};

async function post(path, body) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}
async function get(path) {
  const res = await fetch(API + path);
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function main() {
  if (!MONGO_URI) throw new Error('Set MONGO_URI to your (dev) Atlas connection string.');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  let health;
  try { health = (await get('/api/health')).body; }
  catch { throw new Error(`API not reachable at ${API}. Start the server first (npm run dev).`); }
  ok(health.status === 'ok', `API reachable at ${API}`);

  // ── seed a throwaway product with 3 in stock ────────────────────────────────
  const cat = await Category.create({ name: { en: 'SmokeTest' }, slug: 'smoke-' + Date.now() });
  const prod = await Product.create({
    name: { en: 'Smoke Product' }, category: cat._id, isActive: true,
    variants: [{ label: '1kg', price: 100, mrp: 120, stock: 3 }],
  });
  const productId = prod._id.toString();
  const stock = async () => (await Product.findById(productId)).variants[0].stock;

  const guestInfo = { name: 'Smoke Guest', phone: '9876543210' };
  const deliveryAddress = { line1: 'Test address' };
  const line = (qty, label = '1kg') => ({ productId, variantLabel: label, quantity: qty });

  // ── #7 transaction ──────────────────────────────────────────────────────────
  console.log('\n[#7] Order placement is transactional');
  let r = await post('/api/orders', { items: [line(2)], deliveryAddress, payment: { method: 'cod' }, guestInfo });
  ok(r.status === 201 && r.body.success, 'qty 2 of 3 → 201 placed');
  ok((await stock()) === 1, 'stock 3 → 1 after successful order');
  const orderId = r.body.order?.orderId;

  r = await post('/api/orders', { items: [line(5)], deliveryAddress, payment: { method: 'cod' }, guestInfo });
  ok(r.status === 400, 'qty 5 (>1 left) → 400 insufficient stock');
  ok((await stock()) === 1, 'stock still 1 (no deduction on rejected order)');

  // 2nd item invalid: the 1st item must NOT stay deducted (atomic rollback)
  r = await post('/api/orders', { items: [line(1), line(1, 'NOPE')], deliveryAddress, payment: { method: 'cod' }, guestInfo });
  ok(r.status === 400, 'multi-item order with an invalid 2nd item → 400');
  ok((await stock()) === 1, 'first item NOT deducted (whole transaction rolled back)');

  // ── #8 guest validation ─────────────────────────────────────────────────────
  console.log('\n[#8] Guest order validation');
  r = await post('/api/orders', { items: [line(1)], deliveryAddress, payment: { method: 'cod' } });
  ok(r.status === 400, 'guest order with no name/phone → 400');
  r = await post('/api/orders', { items: [line(1)], deliveryAddress, payment: { method: 'cod' }, guestInfo: { name: 'X', phone: '12345' } });
  ok(r.status === 400, 'guest order with an invalid phone → 400');

  // ── #2 tracking access control ──────────────────────────────────────────────
  console.log('\n[#2] Order tracking access control');
  if (orderId) {
    ok((await get(`/api/orders/track/${orderId}`)).status === 404, 'track without phone → 404 (no PII leak)');
    const good = await get(`/api/orders/track/${orderId}?phone=9876543210`);
    ok(good.status === 200 && good.body.success, 'track with correct phone → 200');
    ok((await get(`/api/orders/track/${orderId}?phone=9999999999`)).status === 404, 'track with wrong phone → 404');
  } else {
    ok(false, 'no orderId captured from the first order (skipped tracking checks)');
  }

  // ── #1 payment binding ──────────────────────────────────────────────────────
  console.log('\n[#1] Payment verification binding');
  if (orderId) {
    r = await post('/api/payment/verify', {
      orderId,
      razorpay_order_id:   'order_FAKE',
      razorpay_payment_id: 'pay_FAKE',
      razorpay_signature:  'deadbeef',
    });
    ok(r.status === 400, 'verify with a razorpay order that does not match → 400 (no forced "paid")');
  }

  // ── cleanup ─────────────────────────────────────────────────────────────────
  await Order.deleteMany({ 'guestInfo.name': 'Smoke Guest' });
  await Product.findByIdAndDelete(productId);
  await Category.findByIdAndDelete(cat._id);
  console.log('\nCleaned up test data.');

  console.log(`\n${failed === 0 ? '✅ ALL PASSED' : '❌ FAILURES'} — ${passed} passed, ${failed} failed`);
  await mongoose.disconnect();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(async (e) => {
  console.error('\nERROR:', e.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
