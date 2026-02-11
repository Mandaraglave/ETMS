const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

const router = express.Router();

// All report routes require admin access
router.use(auth, authorize('admin'));

// Routes
router.get('/daily', reportController.getDailyReports);
router.get('/monthly', reportController.getMonthlyReports);
router.get('/employee-performance', reportController.getEmployeePerformance);
router.get('/attendance-monthly', reportController.getAttendanceMonthlyReport);
router.get('/export', reportController.exportData);

module.exports = router;
