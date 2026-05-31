const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:       { type: String, trim: true, default: '' },
  phone:      { type: String, required: true, unique: true, trim: true },
  email:      { type: String, trim: true, lowercase: true, default: '' },
  password:   { type: String, default: null },
  refreshTokens: [{ type: String }],
  addresses:  [{
    label:    { type: String, default: 'Home' },   // Home / Work / Other
    line1:    String,
    line2:    String,
    landmark: String,
    pincode:  String,
    lat:      Number,
    lng:      Number,
    isDefault: { type: Boolean, default: false },
  }],
  orderCount:  { type: Number, default: 0 },
  role:        { type: String, enum: ['user', 'delivery', 'admin'], default: 'user' },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
