const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function main() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/etms';
    console.log('Connecting to MongoDB:', uri);
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const email = 'admin@etms.com';

    let user = await User.findOne({ email });
    if (user) {
      console.log('Admin user already exists:', email);
    } else {
      user = new User({
        name: 'System Administrator',
        email,
        password: 'Admin@123', // will be hashed by User model pre-save hook
        role: 'admin',
        designation: 'Admin',
        department: 'Management',
        status: 'active',
      });

      await user.save();
      console.log('✅ Admin user created:', email);
    }

    console.log('User id:', user._id.toString());
  } catch (err) {
    console.error('Failed to create admin user:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();

