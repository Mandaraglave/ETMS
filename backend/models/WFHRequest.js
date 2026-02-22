const mongoose = require('mongoose');

const wfhRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    maxlength: 500
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

// Index for efficient queries
wfhRequestSchema.index({ user: 1, date: 1 });
wfhRequestSchema.index({ status: 1 });
wfhRequestSchema.index({ date: 1 });

// Update the updatedAt field on save
wfhRequestSchema.pre('save', function() {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('WFHRequest', wfhRequestSchema);
