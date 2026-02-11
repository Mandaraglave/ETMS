const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');
const taskController = require('../controllers/taskController');
const Task = require('../models/Task');

const router = express.Router();

// Validation rules
const createTaskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('description').trim().notEmpty().withMessage('Task description is required'),
  body('assignedTo').isMongoId().withMessage('Valid assigned user ID is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('estimatedTime').isNumeric().withMessage('Estimated time must be a number')
];

const updateStatusValidation = [
  body('status').isIn(['assigned', 'in_progress', 'on_hold', 'completed', 'approved', 'rejected']).withMessage('Invalid status'),
  body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
  body('comment').optional().trim().notEmpty().withMessage('Comment cannot be empty')
];

const addUpdateValidation = [
  body('comment').trim().notEmpty().withMessage('Comment is required'),
  body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100')
];

const reassignValidation = [
  body('assignedTo').isMongoId().withMessage('Valid assigned user ID is required')
];

// Routes
router.post('/', auth, authorize('admin'), createTaskValidation, taskController.createTask);
router.get('/', auth, taskController.getTasks);
router.get('/:id', auth, taskController.getTaskById);
router.put('/:id/status', auth, updateStatusValidation, taskController.updateTaskStatus);
router.post('/:id/updates', auth, addUpdateValidation, taskController.addTaskUpdate);
router.put('/:id/reassign', auth, authorize('admin'), reassignValidation, taskController.reassignTask);
router.delete('/:id', auth, authorize('admin'), taskController.deleteTask);

// File upload route
router.post('/:id/attachments', auth, uploadMultiple('attachments', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (req.user.role === 'employee' && task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add uploaded files to task
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        task.attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          size: file.size,
          uploadedBy: req.user.id
        });
      });

      await task.save();
    }

    res.json({
      message: 'Files uploaded successfully',
      attachments: task.attachments
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error uploading files' });
  }
});

module.exports = router;
