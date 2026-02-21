const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/etms').then(async () => {
  const result = await User.updateOne(
    { email: 'admin@etms.com' },
    { 
      $set: { 
        'officeLocation.coordinates.latitude': 18.560796,
        'officeLocation.coordinates.longitude': 73.944559,
        'officeLocation.name': 'City Vista Office',
        'officeLocation.address': 'City Vista, A 305, Downtown Rd, Ashoka Nagar, Kharadi, Pune, Maharashtra 411014, India'
      }
    }
  );
  console.log('Updated user office location:', result.modifiedCount);
  
  const user = await User.findOne({ email: 'admin@etms.com' });
  console.log('Updated officeLocation:', JSON.stringify(user.officeLocation, null, 2));
  mongoose.disconnect();
}).catch(console.error);
