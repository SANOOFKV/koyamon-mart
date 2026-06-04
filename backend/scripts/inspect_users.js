const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    const users = await User.find({}).select('name phone role createdAt');
    console.log('=== USERS IN DATABASE ===');
    console.log(JSON.stringify(users, null, 2));
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('❌ Connection error:', err);
    process.exit(1);
  });
