const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },   // snapshot at order time
  variant:    { label: String, price: Number },
  quantity:   { type: Number, required: true, min: 1 },
  unitPrice:  { type: Number, required: true },
  totalPrice: { type: Number, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId:    { type: String, unique: true },   // e.g. KM-20240411-0001

  // ── Customer ──────────────────────────────────────────────────────────────
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isGuest:    { type: Boolean, default: false },
  guestInfo: {
    name:    String,
    phone:   String,
  },
  deliveryAddress: {
    label:    String,
    line1:    String,
    line2:    String,
    landmark: String,
    pincode:  String,
    lat:      Number,
    lng:      Number,
    location: {
      type: { type: String, default: 'Point' },
      coordinates: [Number]
    }
  },
  distanceKm: { type: Number, default: 0 },

  // ── Items ─────────────────────────────────────────────────────────────────
  items:       [orderItemSchema],

  // ── Pricing ───────────────────────────────────────────────────────────────
  subtotal:    { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  discount:    { type: Number, default: 0 },
  total:       { type: Number, required: true },
  isFirstOrder: { type: Boolean, default: false },

  // ── Payment ───────────────────────────────────────────────────────────────
  payment: {
    method:         { type: String, enum: ['cod', 'upi', 'card'], default: 'cod' },
    status:         { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    paidAt:         Date,
  },
  deliveryBoy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // ── Status ────────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'placed',
  },
  statusHistory: [{
    status:    String,
    note:      String,
    updatedAt: { type: Date, default: Date.now },
  }],
  estimatedDelivery: Date,
  notes:  { type: String, default: '' },
}, { timestamps: true });

// Auto-generate readable orderId before save
orderSchema.pre('save', async function (next) {
  if (this.deliveryAddress && this.deliveryAddress.lat && this.deliveryAddress.lng) {
    this.deliveryAddress.location = {
      type: 'Point',
      coordinates: [this.deliveryAddress.lng, this.deliveryAddress.lat]
    };
  }

  if (!this.orderId) {
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
    
    // Ensure Counter is registered
    require('./Counter');
    const Counter = mongoose.model('Counter');
    
    const counter = await Counter.findByIdAndUpdate(
      { _id: `orderId_${ymd}` }, // Reset sequence daily
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    this.orderId = `KM-${ymd}-${String(counter.seq).padStart(4, '0')}`;
  }
  next();
});

orderSchema.index({ 'deliveryAddress.location': '2dsphere' });

module.exports = mongoose.model('Order', orderSchema);
