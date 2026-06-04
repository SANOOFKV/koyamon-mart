const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Order = require('../models/Order');

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    const users = await User.find({});
    console.log(`Analyzing ${users.length} users for duplicates and non-normalized phone numbers...`);

    for (const oldUser of users) {
      const phone = oldUser.phone;
      
      // Check if phone number is not normalized (doesn't start with +91)
      if (phone && !phone.startsWith('+91') && phone !== '0000000000') {
        const cleanPhone = phone.replace(/\s/g, '').replace(/^\+?91/, '');
        const normalizedPhone = '+91' + cleanPhone;
        const oldId = oldUser._id;

        console.log(`\nFound non-normalized user: ID=${oldId}, Name="${oldUser.name}", Phone="${phone}", Role="${oldUser.role}"`);
        console.log(`Target normalized phone: "${normalizedPhone}"`);

        // Find if a user already exists with the normalized phone
        const newUser = await User.findOne({ phone: normalizedPhone });

        if (newUser) {
          const newId = newUser._id;
          console.log(`Corresponding normalized user EXISTS: ID=${newId}, Name="${newUser.name}", Phone="${newUser.phone}", Role="${newUser.role}"`);

          // 1. Update all Orders referencing the old user ID as customer
          const customerOrdersUpdated = await Order.updateMany(
            { user: oldId },
            { $set: { user: newId } }
          );
          console.log(`- Updated ${customerOrdersUpdated.modifiedCount} customer order references`);

          // 2. Update all Orders referencing the old user ID as delivery boy
          const deliveryOrdersUpdated = await Order.updateMany(
            { deliveryBoy: oldId },
            { $set: { deliveryBoy: newId } }
          );
          console.log(`- Updated ${deliveryOrdersUpdated.modifiedCount} delivery boy order references`);

          // 3. Merge user info into the normalized user
          newUser.name = newUser.name || oldUser.name;
          
          // Promote role if old user had higher privilege
          const rolePrivilege = { 'user': 1, 'delivery': 2, 'admin': 3 };
          if (rolePrivilege[oldUser.role] > rolePrivilege[newUser.role]) {
            newUser.role = oldUser.role;
          }

          // Merge addresses
          if (oldUser.addresses && oldUser.addresses.length > 0) {
            newUser.addresses = newUser.addresses || [];
            for (const addr of oldUser.addresses) {
              const exists = newUser.addresses.some(a => 
                (a.line1 === addr.line1 && a.pincode === addr.pincode) ||
                (a.lat === addr.lat && a.lng === addr.lng)
              );
              if (!exists) {
                newUser.addresses.push(addr);
              }
            }
          }

          // Merge order count
          newUser.orderCount = Math.max(newUser.orderCount || 0, oldUser.orderCount || 0);

          // Save the merged user
          await newUser.save();
          console.log(`- Merged and saved normalized user: ID=${newId}, Name="${newUser.name}", Role="${newUser.role}"`);

          // 4. Delete the duplicate old user
          await User.deleteOne({ _id: oldId });
          console.log(`- Deleted duplicate old user ID: ${oldId}`);

        } else {
          // If no normalized user exists, simply update the phone number of the existing user
          oldUser.phone = normalizedPhone;
          await oldUser.save();
          console.log(`- No corresponding normalized user found. Updated phone number to "${normalizedPhone}" and saved.`);
        }
      }
    }

    console.log('\n✅ Database migration & cleanup complete!');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('❌ Connection error:', err);
    process.exit(1);
  });
