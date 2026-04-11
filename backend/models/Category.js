const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true, trim: true },
    ml: { type: String, trim: true, default: '' },
  },
  slug:      { type: String, required: true, unique: true, lowercase: true },
  icon:      { type: String, default: '' },   // emoji or image URL
  image:     { type: String, default: '' },   // Cloudinary URL
  sortOrder: { type: Number, default: 0 },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
