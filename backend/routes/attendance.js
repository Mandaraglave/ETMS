const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

const router = express.Router();

// Distance calculation function (Haversine formula)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

// Validation rules for location-based attendance
const checkInValidation = [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  body('accuracy').isFloat({ min: 0 }).withMessage('GPS accuracy is required'),
  body('address').optional().isString().withMessage('Address must be a string')
];

const checkOutValidation = [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  body('accuracy').isFloat({ min: 0 }).withMessage('GPS accuracy is required'),
  body('address').optional().isString().withMessage('Address must be a string')
];

// Routes
router.post('/check-in', auth, checkInValidation, attendanceController.checkIn);
router.post('/check-out', auth, checkOutValidation, attendanceController.checkOut);
router.get('/today', auth, attendanceController.getTodayAttendance);
router.get('/', auth, attendanceController.getAttendance);

module.exports = router;

