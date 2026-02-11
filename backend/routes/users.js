const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const userController = require('../controllers/userController');

const router = express.Router();

// Validation rules
const createUserValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['admin', 'employee']).withMessage('Role must be admin or employee')
];

const updateUserValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['admin', 'employee']).withMessage('Role must be admin or employee'),
  body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
];

// Routes
router.get('/', auth, authorize('admin'), userController.getUsers);
router.get('/chat-users', auth, userController.getChatUsers);
router.get('/dashboard/stats', auth, userController.getDashboardStats);
router.get('/:id', auth, authorize('admin'), userController.getUserById);
router.post('/', auth, authorize('admin'), createUserValidation, userController.createUser);
router.put('/:id', auth, authorize('admin'), updateUserValidation, userController.updateUser);
router.delete('/:id', auth, authorize('admin'), userController.deleteUser);

module.exports = router;
