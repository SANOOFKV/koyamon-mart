/**
 * Koyamon Mart — Product Seeder
 * Run: node backend/scripts/seedProducts.js
 * Seeds ~30 realistic grocery products across all 6 categories.
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Product  = require('../models/Product');
const Category = require('../models/Category');

const products = [
  // ── VEGETABLES ──────────────────────────────────────────────────────────────
  {
    slug: 'vegetables',
    items: [
      {
        name: { en: 'Tomato', ml: 'തക്കാളി' },
        description: { en: 'Fresh red tomatoes sourced locally from Padikkal farms.', ml: 'പടിക്കൽ കൃഷിയിടത്തിൽ നിന്നുള്ള പുതിയ ചുവന്ന തക്കാളി.' },
        variants: [{ label: '500g', price: 25, mrp: 30, stock: 150 }, { label: '1 kg', price: 45, mrp: 55, stock: 100 }],
        tags: ['fresh', 'vegetable', 'local'],
        unit: 'kg',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Onion', ml: 'ഉള്ളി' },
        description: { en: 'Fresh red onions, perfect for everyday cooking.', ml: 'ദൈനംദിന പാചകത്തിന് അനുയോജ്യമായ പുതിയ ചുവന്ന ഉള്ളി.' },
        variants: [{ label: '500g', price: 20, mrp: 25, stock: 200 }, { label: '1 kg', price: 38, mrp: 45, stock: 150 }],
        tags: ['fresh', 'vegetable', 'staple'],
        unit: 'kg',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1518977676405-d8f3e6f01e0e?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Potato', ml: 'ഉരുളക്കിഴങ്ങ്' },
        description: { en: 'Fresh potatoes for curries, fries, and more.', ml: 'കറിയ്ക്കും വഴുതനയ്ക്കും ഉത്തമമായ പുതിയ ഉരുളക്കിഴങ്ങ്.' },
        variants: [{ label: '1 kg', price: 30, mrp: 38, stock: 200 }, { label: '2 kg', price: 58, mrp: 70, stock: 100 }],
        tags: ['fresh', 'vegetable', 'staple'],
        unit: 'kg',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1518977676405-d8f3e6f01e0e?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Carrot', ml: 'കാരറ്റ്' },
        description: { en: 'Crunchy fresh carrots, great for salads and halwa.', ml: 'സാലഡിനും ഹൽവയ്ക്കും അനുയോജ്യമായ കരകരപ്പുള്ള കാരറ്റ്.' },
        variants: [{ label: '500g', price: 30, mrp: 35, stock: 120 }],
        tags: ['fresh', 'vegetable', 'healthy'],
        unit: 'kg',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Beans', ml: 'ബീൻസ്' },
        description: { en: 'Tender green beans freshly harvested.', ml: 'പുതുതായി വിളവെടുത്ത പച്ച ബീൻസ്.' },
        variants: [{ label: '250g', price: 20, mrp: 25, stock: 100 }],
        tags: ['fresh', 'vegetable'],
        unit: 'g',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Cabbage', ml: 'കാബേജ്' },
        description: { en: 'Fresh green cabbage, perfect for thoran and stir fry.', ml: 'തോരനിനും ഫ്രൈക്കും ഉത്തമമായ പുതിയ കാബേജ്.' },
        variants: [{ label: '1 piece', price: 35, mrp: 40, stock: 80 }],
        tags: ['fresh', 'vegetable'],
        unit: 'piece',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=800&auto=format&fit=crop&q=80'],
      },
    ],
  },
  // ── FRUITS ──────────────────────────────────────────────────────────────────
  {
    slug: 'fruits',
    items: [
      {
        name: { en: 'Banana', ml: 'പഴം' },
        description: { en: 'Sweet ripe Kerala bananas, rich in potassium.', ml: 'പൊട്ടാസ്യം സമൃദ്ധമായ മധുരമുള്ള കേരള പഴം.' },
        variants: [{ label: '12 pieces', price: 40, mrp: 50, stock: 100 }, { label: '6 pieces', price: 22, mrp: 28, stock: 120 }],
        tags: ['fresh', 'fruit', 'local', 'healthy'],
        unit: 'piece',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Mango', ml: 'മാമ്പഴം' },
        description: { en: 'Juicy seasonal Alphonso mangoes from Konkan.', ml: 'കൊങ്കണുനിന്നുള്ള നീരുള്ള ആൽഫോൻസോ മാമ്പഴം.' },
        variants: [{ label: '1 kg', price: 120, mrp: 150, stock: 60 }],
        tags: ['fresh', 'fruit', 'seasonal'],
        unit: 'kg',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Apple', ml: 'ആപ്പിൾ' },
        description: { en: 'Crisp Shimla apples, sweet and refreshing.', ml: 'മധുരവും ഉൾക്കൊള്ളുന്നതുമായ ഷിംലാ ആപ്പിൾ.' },
        variants: [{ label: '1 kg (3-4 pcs)', price: 130, mrp: 160, stock: 80 }],
        tags: ['fresh', 'fruit', 'healthy'],
        unit: 'kg',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Watermelon', ml: 'തണ്ണിമത്തൻ' },
        description: { en: 'Large sweet watermelons, great for summer.', ml: 'വേനൽക്കാലത്ത് ഉത്തമമായ വലിയ മധുരമുള്ള തണ്ണിമത്തൻ.' },
        variants: [{ label: '1 piece (~3kg)', price: 90, mrp: 110, stock: 30 }],
        tags: ['fresh', 'fruit', 'summer'],
        unit: 'piece',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1527325678964-54921661f888?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Grapes', ml: 'മുന്തിരി' },
        description: { en: 'Fresh green seedless grapes.', ml: 'പുതിയ പച്ച വിത്തില്ലാ മുന്തിരി.' },
        variants: [{ label: '500g', price: 80, mrp: 95, stock: 50 }],
        tags: ['fresh', 'fruit'],
        unit: 'kg',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=800&auto=format&fit=crop&q=80'],
      },
    ],
  },
  // ── DAIRY ───────────────────────────────────────────────────────────────────
  {
    slug: 'dairy',
    items: [
      {
        name: { en: 'Fresh Milk', ml: 'പശുവിൻ പാൽ' },
        description: { en: 'Fresh full-cream cow milk, pasteurised.', ml: 'പ്രത്യേക ശ്രദ്ധയോടെ പ്രോസസ്സ് ചെയ്ത ഫ്രഷ് ഫുൾ ക്രീം പശുവിൻ പാൽ.' },
        variants: [{ label: '500 ml', price: 30, mrp: 32, stock: 200 }, { label: '1 litre', price: 58, mrp: 62, stock: 200 }],
        tags: ['dairy', 'fresh', 'daily'],
        unit: 'ml',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Curd', ml: 'തൈര്' },
        description: { en: 'Thick creamy curd made with fresh milk.', ml: 'പുതിയ പാൽ ഉപയോഗിച്ച് ഉണ്ടാക്കിയ കട്ടിയായ ക്രീമി തൈര്.' },
        variants: [{ label: '200g', price: 22, mrp: 25, stock: 150 }, { label: '400g', price: 42, mrp: 48, stock: 100 }],
        tags: ['dairy', 'fresh', 'probiotic'],
        unit: 'g',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Paneer', ml: 'പനീർ' },
        description: { en: 'Soft fresh paneer, ideal for curries and snacks.', ml: 'കറിക്കും സ്നാക്കിനും ഉത്തമമായ മൃദുവായ പുതിയ പനീർ.' },
        variants: [{ label: '200g', price: 85, mrp: 100, stock: 80 }],
        tags: ['dairy', 'protein', 'vegetarian'],
        unit: 'g',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Butter', ml: 'വെണ്ണ' },
        description: { en: 'Creamy salted butter for bread and cooking.', ml: 'ബ്രഡ്ഡിനും പാചകത്തിനും ഉള്ള ക്രീമി ഉപ്പിട്ട വെണ്ണ.' },
        variants: [{ label: '100g', price: 60, mrp: 68, stock: 100 }],
        tags: ['dairy', 'spread'],
        unit: 'g',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Eggs', ml: 'മുട്ട' },
        description: { en: 'Farm-fresh country eggs, pack of 6.', ml: 'ഫാം ഫ്രഷ് നാടൻ മുട്ടകൾ, 6 എണ്ണം.' },
        variants: [{ label: '6 pieces', price: 60, mrp: 66, stock: 200 }, { label: '12 pieces', price: 115, mrp: 130, stock: 150 }],
        tags: ['protein', 'eggs', 'fresh'],
        unit: 'piece',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&auto=format&fit=crop&q=80'],
      },
    ],
  },
  // ── SNACKS ──────────────────────────────────────────────────────────────────
  {
    slug: 'snacks',
    items: [
      {
        name: { en: 'Banana Chips', ml: 'ബനാന ചിപ്സ്' },
        description: { en: 'Crispy Kerala-style banana chips fried in coconut oil.', ml: 'തേങ്ങ എണ്ണയിൽ വറുത്ത കേരള ബനാന ചിപ്സ്.' },
        variants: [{ label: '200g', price: 60, mrp: 70, stock: 100 }, { label: '500g', price: 140, mrp: 165, stock: 60 }],
        tags: ['snack', 'kerala', 'crispy'],
        unit: 'g',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Marie Biscuits', ml: 'മേരി ബിസ്ക്കറ്റ്' },
        description: { en: 'Light and crispy Marie biscuits, great with tea.', ml: 'ചായയ്ക്കൊപ്പം ഉത്തമമായ ലഘുവും കരകരക്കുന്നതുമായ മേരി ബിസ്ക്കറ്റ്.' },
        variants: [{ label: '250g', price: 30, mrp: 35, stock: 200 }],
        tags: ['snack', 'biscuit', 'tea-time'],
        unit: 'g',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Mixture', ml: 'മിക്സ്ചർ' },
        description: { en: 'Spicy Kerala mixture with sev, peanuts, and curry leaves.', ml: 'സേവ്, കടല, കറിവേപ്പില എന്നിവ ഉള്ള കേരള മിക്സ്ചർ.' },
        variants: [{ label: '200g', price: 55, mrp: 65, stock: 80 }],
        tags: ['snack', 'spicy', 'kerala'],
        unit: 'g',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Dates', ml: 'ഈത്തപ്പഴം' },
        description: { en: 'Premium Medjool dates, naturally sweet and nutritious.', ml: 'പ്രകൃതിദത്തമായ മധുരവും പോഷക സമൃദ്ധവുമായ പ്രീമിയം ഈത്തപ്പഴം.' },
        variants: [{ label: '250g', price: 90, mrp: 110, stock: 60 }],
        tags: ['snack', 'healthy', 'sweet', 'dry-fruit'],
        unit: 'g',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1609167830220-7164aa360951?w=800&auto=format&fit=crop&q=80'],
      },
    ],
  },
  // ── HOUSEHOLD ───────────────────────────────────────────────────────────────
  {
    slug: 'household',
    items: [
      {
        name: { en: 'Coconut Oil', ml: 'വെളിച്ചെണ്ണ' },
        description: { en: 'Pure cold-pressed coconut oil for cooking and hair.', ml: 'പാചകത്തിനും മുടിക്കും ഉള്ള ശുദ്ധ കോൾഡ് പ്രസ്ഡ് വെളിച്ചെണ്ണ.' },
        variants: [{ label: '500 ml', price: 110, mrp: 130, stock: 100 }, { label: '1 litre', price: 210, mrp: 245, stock: 80 }],
        tags: ['household', 'cooking', 'kerala', 'oil'],
        unit: 'ml',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Rice (Matta)', ml: 'ചുവന്ന അരി (മട്ട)' },
        description: { en: 'Traditional Kerala Matta rice, rich in fibre.', ml: 'ഫൈബർ സമൃദ്ധമായ പരമ്പരാഗത കേരള മട്ട അരി.' },
        variants: [{ label: '1 kg', price: 65, mrp: 75, stock: 200 }, { label: '5 kg', price: 310, mrp: 360, stock: 80 }],
        tags: ['household', 'staple', 'rice', 'kerala'],
        unit: 'kg',
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Wheat Flour (Atta)', ml: 'ഗോതമ്പ് മാവ്' },
        description: { en: 'Whole-wheat chakki atta for soft rotis and parathas.', ml: 'മൃദുവായ ചപ്പാത്തിക്കും പരാഠയ്ക്കും ഉള്ള ഗോതമ്പ് ആട്ട.' },
        variants: [{ label: '1 kg', price: 60, mrp: 70, stock: 150 }, { label: '5 kg', price: 280, mrp: 330, stock: 60 }],
        tags: ['household', 'staple', 'flour'],
        unit: 'kg',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Pappadam', ml: 'പപ്പടം' },
        description: { en: 'Crispy urad dal pappadams, ready to fry or microwave.', ml: 'ഫ്രൈ ചെയ്യാൻ അല്ലെങ്കിൽ മൈക്രോവേവ് ചെയ്യാൻ തയ്യാറായ ഉഴുന്ന് പപ്പടം.' },
        variants: [{ label: '200g', price: 45, mrp: 55, stock: 120 }],
        tags: ['household', 'snack', 'crispy', 'south-indian'],
        unit: 'g',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80'],
        skipIfExistsByName: true,
      },
      {
        name: { en: 'Washing Powder', ml: 'വാഷിംഗ് പൗഡർ' },
        description: { en: 'High-efficiency washing powder for bright, clean clothes.', ml: 'തിളക്കമുള്ള വൃത്തിയായ വസ്ത്രങ്ങൾക്ക് ഉള്ള വാഷിംഗ് പൗഡർ.' },
        variants: [{ label: '1 kg', price: 80, mrp: 95, stock: 100 }],
        tags: ['household', 'cleaning', 'laundry'],
        unit: 'kg',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&auto=format&fit=crop&q=80'],
      },
    ],
  },
  // ── STATIONERY ──────────────────────────────────────────────────────────────
  {
    slug: 'stationery',
    items: [
      {
        name: { en: 'Classmate Notebook', ml: 'ക്ലാസ്മേറ്റ് നോട്ട്ബുക്ക്' },
        description: { en: '200-page single-line notebook, A5 size.', ml: 'A5 സൈസ് 200 പേജ് സിംഗിൾ ലൈൻ നോട്ട്ബുക്ക്.' },
        variants: [{ label: '1 piece', price: 55, mrp: 65, stock: 200 }, { label: '5 pieces', price: 260, mrp: 310, stock: 80 }],
        tags: ['stationery', 'notebook', 'school'],
        unit: 'piece',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Ball Point Pen', ml: 'ബോൾ പോയിന്റ് പേന' },
        description: { en: 'Smooth-writing blue ball-point pen.', ml: 'സുഗമമായി എഴുതുന്ന നീല ബോൾ പോയിന്റ് പേന.' },
        variants: [{ label: '1 piece', price: 10, mrp: 12, stock: 500 }, { label: '10 pieces', price: 90, mrp: 110, stock: 100 }],
        tags: ['stationery', 'pen', 'school', 'office'],
        unit: 'piece',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Pencil', ml: 'പെൻസിൽ' },
        description: { en: 'HB graphite pencils for school and sketching.', ml: 'സ്കൂളിനും സ്കെച്ചിങ്ങിനും ഉള്ള HB ഗ്രാഫൈറ്റ് പെൻസിൽ.' },
        variants: [{ label: '10 pieces', price: 35, mrp: 40, stock: 300 }],
        tags: ['stationery', 'pencil', 'school'],
        unit: 'piece',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Eraser', ml: 'ഇറേസർ' },
        description: { en: 'Dust-free eraser for clean corrections.', ml: 'വൃത്തിയായ തിരുത്തലുകൾക്കായി ഡസ്റ്റ്-ഫ്രീ ഇറേസർ.' },
        variants: [{ label: '1 piece', price: 8, mrp: 10, stock: 500 }],
        tags: ['stationery', 'eraser', 'school'],
        unit: 'piece',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=800&auto=format&fit=crop&q=80'],
      },
      {
        name: { en: 'Stapler', ml: 'സ്റ്റേപ്ലർ' },
        description: { en: 'Compact desktop stapler with 1000 staples included.', ml: '1000 സ്റ്റേപ്ലുകൾ ഉൾക്കൊള്ളുന്ന കോംപാക്ട് ഡെസ്ക്ടോപ്പ് സ്റ്റേപ്ലർ.' },
        variants: [{ label: '1 piece', price: 120, mrp: 150, stock: 60 }],
        tags: ['stationery', 'office', 'stapler'],
        unit: 'piece',
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=800&auto=format&fit=crop&q=80'],
      },
    ],
  },
];

async function seed() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not found. Make sure backend/.env has MONGO_URI set.');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    let created = 0;
    let skipped = 0;

    for (const group of products) {
      const category = await Category.findOne({ slug: group.slug });
      if (!category) {
        console.warn(`⚠️  Category not found: ${group.slug} — run seedCategories.js first`);
        continue;
      }

      for (const item of group.items) {
        // Skip if product with same English name already exists in same category
        const exists = await Product.findOne({ 'name.en': item.name.en, category: category._id });
        if (exists) {
          console.log(`  ⏭️  Skipped (exists): ${item.name.en}`);
          skipped++;
          continue;
        }

        const { skipIfExistsByName, ...productData } = item;

        await Product.create({
          ...productData,
          category: category._id,
          isActive: true,
          sortOrder: created,
        });

        console.log(`  ✅ Created: ${item.name.en} [${group.slug}]`);
        created++;
      }
    }

    console.log(`\n🎉 Seeding complete! Created: ${created}, Skipped: ${skipped}`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();
