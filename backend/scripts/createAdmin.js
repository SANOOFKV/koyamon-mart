const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config({ path: '../.env' }); // Assuming script is run from backend dir with `node scripts/createAdmin.js`
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  dotenv.config(); // fallback if run from root or env already loaded
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/koyamon-mart';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@koyamon.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL, role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️ Admin already exists in the database.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    await User.create({
      name: 'Super Admin',
      phone: '0000000000', // Dummy phone since it's required and unique
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
    });

    console.log(`✅ Admin user created successfully: ${ADMIN_EMAIL}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to create admin:', err);
    process.exit(1);
  }
}

createAdmin();
