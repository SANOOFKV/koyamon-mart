const router = require('express').Router();
const mongoose = require('mongoose');
const Product  = require('../models/Product');
const Category = require('../models/Category');

// ── GET /api/products ─────────────────────────────────────────────────────────
// Query params: category, search, sort, minPrice, maxPrice, page, limit
router.get('/', async (req, res) => {
  try {
    const { category, search, sort, minPrice, maxPrice, page = 1, limit = 20, inStock } = req.query;
    const filter = { isActive: true };

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.category = category;
      } else {
        const cat = await Category.findOne({ slug: category.toLowerCase() });
        if (cat) filter.category = cat._id;
        else console.warn(`Category slug not found: ${category}`);
      }
    }


    if (inStock === 'true') filter['variants.stock'] = { $gt: 0 };

    if (search && search.trim() !== '') {
      filter.$text = { $search: search };
    }


    if (minPrice || maxPrice) {
      filter['variants.price'] = {};
      if (minPrice) filter['variants.price'].$gte = Number(minPrice);
      if (maxPrice) filter['variants.price'].$lte = Number(maxPrice);
    }

    const sortMap = {
      'price_asc':  { 'variants.0.price': 1 },
      'price_desc': { 'variants.0.price': -1 },
      'newest':     { createdAt: -1 },
      'default':    { sortOrder: 1, isFeatured: -1 },
    };
    const sortQuery = sortMap[sort] || sortMap['default'];

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category', 'name slug icon')
      .sort(sortQuery)
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/products/featured ────────────────────────────────────────────────
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('category', 'name slug icon')
      .sort({ sortOrder: 1 })
      .limit(12);
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/products/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug icon');
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
