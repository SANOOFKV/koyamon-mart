const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  label:    { type: String, required: true },   // "500g", "1kg", "piece", etc.
  price:    { type: Number, required: true },
  mrp:      { type: Number, required: true },
  stock:    { type: Number, default: 0 },
  sku:      { type: String },
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true, trim: true },
    ml: { type: String, trim: true, default: '' },   // Malayalam name
  },
  description: {
    en: { type: String, default: '' },
    ml: { type: String, default: '' },
  },
  category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  images:      [{ type: String }],   // Cloudinary URLs
  variants:    [variantSchema],
  tags:        [{ type: String }],
  unit:        { type: String, default: '' },   // "kg", "piece", "pack"
  isFeatured:  { type: Boolean, default: false },
  isActive:    { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },
}, { timestamps: true });

productSchema.index({ 'name.en': 'text', 'name.ml': 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
