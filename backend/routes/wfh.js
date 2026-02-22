const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const wfhController = require('../controllers/wfhController');

const router = express.Router();

// Validation rules
const createWFHRequestValidation = [
  body('date')
    .isISO8601()
    .withMessage('Valid date is required')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('Date cannot be in the past');
      }
      return true;
    }),
  body('reason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters')
];

const rejectWFHRequestValidation = [
  body('rejectionReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Rejection reason must not exceed 500 characters')
];

// Routes
// Create WFH request (employee)
router.post('/request', auth, createWFHRequestValidation, wfhController.createWFHRequest);

// Get user's WFH requests (employee)
router.get('/my-requests', auth, wfhController.getUserWFHRequests);

// Get all WFH requests (admin)
router.get('/all-requests', auth, wfhController.getAllWFHRequests);

// Get WFH request by ID (admin/employee)
router.get('/request/:requestId', auth, wfhController.getWFHRequestById);

// Approve WFH request (admin)
router.put('/approve/:requestId', auth, wfhController.approveWFHRequest);

// Reject WFH request (admin)
router.put('/reject/:requestId', auth, rejectWFHRequestValidation, wfhController.rejectWFHRequest);

// Check today's WFH status (employee)
router.get('/today-status', auth, wfhController.checkTodayWFHStatus);

module.exports = router;
