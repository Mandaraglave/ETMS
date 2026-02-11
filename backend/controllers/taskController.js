const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// Create task (Admin only)
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const {
      title,
      description,
      assignedTo,
      priority = 'medium',
      category,
      startDate,
      dueDate,
      estimatedTime
    } = req.body;

    // Verify assigned user exists and is an employee
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(404).json({ message: 'Assigned user not found' });
    }

    if (assignedUser.role !== 'employee') {
      return res.status(400).json({ message: 'Task can only be assigned to employees' });
    }

    // Create task
    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: req.user.id,
      priority,
      category,
      startDate: startDate || undefined,
      dueDate,
      estimatedTime
    });

    await task.save();

    // Populate task details for response
    await task.populate([
      { path: 'assignedTo', select: 'name email employeeId' },
      { path: 'assignedBy', select: 'name email' }
    ]);

    // Create notification for assigned employee
    const notification = new Notification({
      recipient: assignedTo,
      sender: req.user.id,
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${title}`,
      type: 'task_assigned',
      relatedTask: task._id
    });
    await notification.save();

    // Send real-time notification
    const io = req.app.get('io');
    io.to(assignedTo.toString()).emit('notification', {
      id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt
    });

    // Send email notification
    try {
      const emailTemplate = emailTemplates.taskAssigned(task, assignedUser.name);
      await sendEmail(assignedUser.email, emailTemplate.subject, emailTemplate.html);
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error creating task' });
  }
};

// Get all tasks (with filters)
const getTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      assignedTo,
      assignedBy,
      date,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    // Role-based filtering
    if (req.user.role === 'employee') {
      query.assignedTo = req.user.id;
    } else if (req.user.role === 'admin') {
      // Admin can see all tasks, but can filter by assignedBy
      if (assignedBy) {
        query.assignedBy = assignedBy;
      }
    }

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    // Date filter
    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.dueDate = {
        $gte: targetDate,
        $lt: nextDay
      };
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email employeeId')
      .populate('assignedBy', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTasks: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
};

// Get task by ID
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate('assignedTo', 'name email employeeId')
      .populate('assignedBy', 'name email')
      .populate('updates.updatedBy', 'name email')
      .populate('attachments.uploadedBy', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (req.user.role === 'employee' && task.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error fetching task' });
  }
};

// Update task status
const updateTaskStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { status, progress, comment } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (req.user.role === 'employee' && task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only employees can update to in_progress, on_hold, completed
    if (req.user.role === 'employee') {
      if (!['in_progress', 'on_hold', 'completed'].includes(status)) {
        return res.status(403).json({ message: 'Employees can only update to in_progress, on_hold, or completed' });
      }
    }

    // Only admins can approve or reject
    if (req.user.role === 'admin') {
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(403).json({ message: 'Admins can only update to approved or rejected' });
      }
    }

    // Update task
    const oldStatus = task.status;
    task.status = status;
    
    if (progress !== undefined) {
      task.progress = Math.min(100, Math.max(0, progress));
    }

    if (status === 'approved') {
      task.approvedBy = req.user.id;
    }

    if (status === 'rejected') {
      task.rejectionReason = comment || 'Task rejected by admin';
    }

    // Add update to history
    if (comment) {
      task.updates.push({
        comment,
        progress: task.progress,
        updatedBy: req.user.id
      });
    }

    await task.save();

    // Populate for response
    await task.populate([
      { path: 'assignedTo', select: 'name email employeeId' },
      { path: 'assignedBy', select: 'name email' },
      { path: 'updates.updatedBy', select: 'name email' }
    ]);

    // Create notifications
    let notificationRecipient = null;
    let notificationType = null;
    let notificationMessage = '';

    if (req.user.role === 'employee' && status === 'completed') {
      // Notify admin
      notificationRecipient = task.assignedBy;
      notificationType = 'task_completed';
      notificationMessage = `Task "${task.title}" has been completed by ${task.assignedTo.name}`;
    } else if (req.user.role === 'admin') {
      // Notify employee
      notificationRecipient = task.assignedTo;
      if (status === 'approved') {
        notificationType = 'task_approved';
        notificationMessage = `Your task "${task.title}" has been approved`;
      } else if (status === 'rejected') {
        notificationType = 'task_rejected';
        notificationMessage = `Your task "${task.title}" has been rejected. Reason: ${task.rejectionReason}`;
      }
    }

    if (notificationRecipient) {
      const notification = new Notification({
        recipient: notificationRecipient,
        sender: req.user.id,
        title: `Task ${status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Completed'}`,
        message: notificationMessage,
        type: notificationType,
        relatedTask: task._id
      });
      await notification.save();

      // Send real-time notification
      const io = req.app.get('io');
      io.to(notificationRecipient.toString()).emit('notification', {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt
      });
    }

    res.json({
      message: 'Task status updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Server error updating task status' });
  }
};

// Add task update/comment
const addTaskUpdate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { comment, progress } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (req.user.role === 'employee' && task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add update
    task.updates.push({
      comment,
      progress: Math.min(100, Math.max(0, progress)),
      updatedBy: req.user.id
    });

    // Update task progress if provided
    if (progress !== undefined) {
      task.progress = Math.min(100, Math.max(0, progress));
    }

    await task.save();

    // Populate for response
    await task.populate('updates.updatedBy', 'name email');

    res.json({
      message: 'Task update added successfully',
      update: task.updates[task.updates.length - 1],
      task
    });
  } catch (error) {
    console.error('Add task update error:', error);
    res.status(500).json({ message: 'Server error adding task update' });
  }
};

// Reassign task (Admin only)
const reassignTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
    }

    const { id } = req.params;
    const { assignedTo } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const newAssignee = await User.findById(assignedTo);
    if (!newAssignee) {
      return res.status(404).json({ message: 'Assigned user not found' });
    }
    if (newAssignee.role !== 'employee') {
      return res.status(400).json({ message: 'Task can only be assigned to employees' });
    }

    task.assignedTo = assignedTo;
    await task.save();

    await task.populate([
      { path: 'assignedTo', select: 'name email employeeId' },
      { path: 'assignedBy', select: 'name email' }
    ]);

    // Notify new assignee
    const notification = new Notification({
      recipient: assignedTo,
      sender: req.user.id,
      title: 'Task Reassigned to You',
      message: `You have been assigned the task: ${task.title}`,
      type: 'task_assigned',
      relatedTask: task._id
    });
    await notification.save();

    const io = req.app.get('io');
    io.to(assignedTo.toString()).emit('notification', {
      id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt
    });

    try {
      const emailTemplate = emailTemplates.taskAssigned(task, newAssignee.name);
      await sendEmail(newAssignee.email, emailTemplate.subject, emailTemplate.html);
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

    res.json({
      message: 'Task reassigned successfully',
      task
    });
  } catch (error) {
    console.error('Reassign task error:', error);
    res.status(500).json({ message: 'Server error reassigning task' });
  }
};

// Delete task (Admin only)
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error deleting task' });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTaskStatus,
  addTaskUpdate,
  reassignTask,
  deleteTask
};
