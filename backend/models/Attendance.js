const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  checkIn: {
    time: {
      type: Date,
      required: true
    },
    location: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      },
      accuracy: {
        type: Number, // GPS accuracy in meters
        required: true
      },
      address: {
        type: String, // Human readable address
        required: true
      },
      browser: {
        type: String, // Browser info
        required: true
      },
      ip: {
        type: String, // IP address for verification
        required: true
      }
    },
    isWithinOffice: {
      type: Boolean,
      required: true
    },
    distanceFromOffice: {
      type: Number, // Distance in meters
      required: true
    }
  },
  checkOut: {
    time: {
      type: Date
    },
    location: {
      latitude: {
        type: Number
      },
      longitude: {
        type: Number
      },
      accuracy: {
        type: Number
      },
      address: {
        type: String
      },
      browser: {
        type: String
      },
      ip: {
        type: String
      }
    },
    isWithinOffice: {
      type: Boolean
    },
    distanceFromOffice: {
      type: Number
    }
  },
  totalHours: {
    type: Number, // Total hours worked that day
    min: 0
  },
  overtime: {
    type: Number, // Overtime hours
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'early_leave', 'half_day', 'wfh'],
    default: 'present'
  },
  wfhRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WFHRequest'
  },
  notes: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
attendanceSchema.index({ user: 1, date: -1 });
attendanceSchema.index({ date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

