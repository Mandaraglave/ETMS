const mongoose = require('mongoose');
const User = require('./models/User');

async function updateAllUsersOfficeLocation() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/etms');
    console.log('✅ Connected to MongoDB');

    const officeLocation = {
      name: 'City Vista Office',
      address: 'City Vista, A 305, Downtown Rd, Ashoka Nagar, Kharadi, Pune, Maharashtra 411014, India',
      coordinates: {
        latitude: 18.560796,
        longitude: 73.944559,
        radius: 300
      },
      timezone: 'Asia/Kolkata'
    };

    const result = await User.updateMany(
      {}, // update ALL users (admin + employees)
      { $set: { officeLocation } }
    );

    console.log('✅ Updated users:', result.modifiedCount);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

updateAllUsersOfficeLocation();
