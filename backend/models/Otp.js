const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
    match: /^\d{6}$/,
  },
  role: {
    type: String,
    enum: ['admin', 'employee'],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

otpSchema.index({ email: 1, role: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL - auto-delete expired

module.exports = mongoose.model('Otp', otpSchema);
