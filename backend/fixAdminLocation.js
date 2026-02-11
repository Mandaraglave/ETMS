const mongoose = require('mongoose');
const User = require('./models/User');

async function fixAdminOfficeLocation() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/etms');
    console.log('✅ Connected to MongoDB');
    
    console.log('🔧 Finding admin user...');
    const admin = await User.findOne({ email: 'admin@etms.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:', admin.email);
    
    // Set office location for admin
    admin.officeLocation = {
    name: 'City Vista Office',
    address: 'City Vista, A 305, Downtown Rd, Ashoka Nagar, Kharadi, Pune, Maharashtra 411014, India',
    coordinates: {
    latitude: 8.5592,
    longitude: 105.9455,
    radius: 300  
  },
  timezone: 'Asia/Kolkata'
};

    
    console.log('🔧 Saving admin with office location...');
    await admin.save();
    
    console.log('✅ Admin office location updated successfully');
    console.log('📍 Admin Office Location:', {
      name: admin.officeLocation.name,
      address: admin.officeLocation.address,
      latitude: admin.officeLocation.coordinates.latitude,
      longitude: admin.officeLocation.coordinates.longitude,
      radius: admin.officeLocation.coordinates.radius,
      timezone: admin.officeLocation.timezone
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixAdminOfficeLocation();
