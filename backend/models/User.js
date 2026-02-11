const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: ['admin', 'employee'],
    default: 'employee'
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  designation: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  contactDetails: {
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  officeLocation: {
    name: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        required: false  // Make optional
      },
      longitude: {
        type: Number,
        required: false  // Make optional
      },
      radius: {
        type: Number,
        default: 100 // 100 meters radius
      }
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate employee ID if not provided
userSchema.pre('save', function () {
  if (this.isNew && this.role === 'employee' && !this.employeeId) {
    this.employeeId = 'EMP' + Date.now().toString().slice(-6);
  }
});



module.exports = mongoose.model('User', userSchema);
