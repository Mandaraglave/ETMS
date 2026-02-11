const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { uploadAvatarMiddleware } = require('../middleware/upload');
const authController = require('../controllers/authController');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['admin', 'employee']).withMessage('Role must be admin or employee')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const otpRequestValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('role').isIn(['admin', 'employee']).withMessage('Role must be admin or employee')
];

const otpVerifyValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('otp').matches(/^\d{6}$/).withMessage('OTP must be 6 digits'),
  body('role').isIn(['admin', 'employee']).withMessage('Role must be admin or employee')
];

const updateProfileValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('designation').optional().trim().notEmpty().withMessage('Designation cannot be empty'),
  body('department').optional().trim().notEmpty().withMessage('Department cannot be empty')
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/otp/request', otpRequestValidation, authController.requestOtp);
router.post('/otp/verify', otpVerifyValidation, authController.verifyOtp);
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, updateProfileValidation, authController.updateProfile);
router.post('/profile/avatar', auth, uploadAvatarMiddleware, authController.uploadProfilePicture);

module.exports = router;
