const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['broadcast', 'service', 'promo'],
    required: true
  },
  target: {
    type: String, // 'all', 'padikkal', 'velimukku', etc.
    default: 'all'
  },
  message: {
    type: String,
    required: true
  },
  channels: {
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['sent', 'failed'],
    default: 'sent'
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
