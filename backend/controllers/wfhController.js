const WFHRequest = require('../models/WFHRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');

// Create WFH request
exports.createWFHRequest = async (req, res) => {
  try {
    console.log('=== CREATE WFH REQUEST DEBUG ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.user.id);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { date, reason } = req.body;
    const userId = req.user.id;

    console.log('Creating WFH request with:', { userId, date, reason });

    // Check if request already exists for this date
    const existingRequest = await WFHRequest.findOne({
      user: userId,
      date: new Date(date)
    });

    if (existingRequest) {
      console.log('WFH request already exists for this date:', existingRequest);
      return res.status(400).json({
        success: false,
        message: 'WFH request already exists for this date'
      });
    }

    // Create new WFH request
    const wfhRequest = new WFHRequest({
      user: userId,
      date: new Date(date),
      reason
    });

    console.log('WFH Request object created:', wfhRequest);

    await wfhRequest.save();

    // Populate user details
    await wfhRequest.populate('user', 'name email employeeId');

    res.status(201).json({
      success: true,
      message: 'WFH request submitted successfully',
      data: wfhRequest
    });
  } catch (error) {
    console.error('Error creating WFH request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get user's WFH requests
exports.getUserWFHRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const requests = await WFHRequest.find(query)
      .populate('user', 'name email employeeId')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WFHRequest.countDocuments(query);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user WFH requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all WFH requests (for admin)
exports.getAllWFHRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, userId } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }
    if (userId) {
      query.user = userId;
    }

    const requests = await WFHRequest.find(query)
      .populate('user', 'name email employeeId designation department')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WFHRequest.countDocuments(query);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all WFH requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Approve WFH request
exports.approveWFHRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const adminId = req.user.id;

    const request = await WFHRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'WFH request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed'
      });
    }

    request.status = 'approved';
    request.approvedBy = adminId;
    request.approvedAt = new Date();

    await request.save();

    await request.populate('user', 'name email employeeId');
    await request.populate('approvedBy', 'name email');

    // Create notification for employee
    await Notification.create({
      recipient: request.user._id,
      sender: adminId,
      title: 'WFH Request Approved',
      message: `Your work from home request for ${new Date(request.date).toLocaleDateString()} has been approved by ${request.approvedBy.name}.`,
      type: 'wfh_approved',
      relatedWFHRequest: request._id
    });

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(request.user._id.toString()).emit('notification', {
        type: 'wfh_approved',
        title: 'WFH Request Approved',
        message: `Your work from home request for ${new Date(request.date).toLocaleDateString()} has been approved.`,
        data: request
      });
    }

    res.json({
      success: true,
      message: 'WFH request approved successfully',
      data: request
    });
  } catch (error) {
    console.error('Approve WFH request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reject WFH request
exports.rejectWFHRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user.id;

    const request = await WFHRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'WFH request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed'
      });
    }

    request.status = 'rejected';
    request.rejectedBy = adminId;
    request.rejectedAt = new Date();
    request.rejectionReason = rejectionReason;

    await request.save();

    await request.populate('user', 'name email employeeId');
    await request.populate('rejectedBy', 'name email');

    // Create notification for employee
    await Notification.create({
      recipient: request.user._id,
      sender: adminId,
      title: 'WFH Request Rejected',
      message: `Your work from home request for ${new Date(request.date).toLocaleDateString()} has been rejected by ${request.rejectedBy.name}. Reason: ${rejectionReason}`,
      type: 'wfh_rejected',
      relatedWFHRequest: request._id
    });

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(request.user._id.toString()).emit('notification', {
        type: 'wfh_rejected',
        title: 'WFH Request Rejected',
        message: `Your work from home request for ${new Date(request.date).toLocaleDateString()} has been rejected.`,
        data: request
      });
    }

    res.json({
      success: true,
      message: 'WFH request rejected successfully',
      data: request
    });
  } catch (error) {
    console.error('Reject WFH request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get WFH request by ID
exports.getWFHRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await WFHRequest.findById(requestId)
      .populate('user', 'name email employeeId designation department')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'WFH request not found'
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Get WFH request by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Check if user has approved WFH for today
exports.checkTodayWFHStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const request = await WFHRequest.findOne({
      user: userId,
      date: today,
      status: 'approved'
    });

    res.json({
      success: true,
      hasApprovedWFH: !!request,
      wfhRequest: request
    });
  } catch (error) {
    console.error('Check today WFH status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
