const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });
const Category = require('../models/Category');

const categories = [
  {
    name: { en: 'Fresh Vegetables', ml: 'പച്ചക്കറികൾ' },
    slug: 'vegetables',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
    sortOrder: 1
  },
  {
    name: { en: 'Seasonal Fruits', ml: 'പഴങ്ങൾ' },
    slug: 'fruits',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
    sortOrder: 2
  },
  {
    name: { en: 'Daily Dairy', ml: 'പാൽ ഉൽപ്പന്നങ്ങൾ' },
    slug: 'dairy',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80',
    sortOrder: 3
  },
  {
    name: { en: 'Snacks & Drinks', ml: 'ലഘുഭക്ഷണങ്ങൾ' },
    slug: 'snacks',
    image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&auto=format&fit=crop&q=80',
    sortOrder: 4
  },
  {
    name: { en: 'Household', ml: 'ഗാർഹികം' },
    slug: 'household',
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&auto=format&fit=crop&q=80',
    sortOrder: 5
  },
  {
    name: { en: 'Stationery', ml: 'സ്റ്റേഷനറി' },
    slug: 'stationery',
    image: 'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=800&auto=format&fit=crop&q=80',
    sortOrder: 6
  }
];

async function seed() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not found in backend/.env');
    }
    
    await mongoose.connect(process.env.MONGO_URI);

    console.log('Connected to MongoDB.');

    for (const cat of categories) {
      await Category.findOneAndUpdate(
        { slug: cat.slug },
        cat,
        { upsert: true, new: true }
      );
      console.log(`Synced category: ${cat.name.en}`);
    }

    console.log('Category seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
