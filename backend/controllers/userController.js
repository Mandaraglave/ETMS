const { validationResult } = require('express-validator');
const User = require('../models/User');
const Task = require('../models/Task');

// Get all users (Admin only)
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      status,
      department,
      search
    } = req.query;

    // Build query
    const query = {};

    // Apply filters
    if (role) query.role = role;
    if (status) query.status = status;
    if (department) query.department = new RegExp(department, 'i');

    // Search functionality
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { employeeId: new RegExp(search, 'i') }
      ];
    }

    // Execute query
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
};

// Create user (Admin only)
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const {
      name,
      email,
      password,
      role = 'employee',
      designation,
      department,
      contactDetails
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      designation,
      department,
      contactDetails
    });

    try {
      await user.save();
      
      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          designation: user.designation,
          department: user.department,
          status: user.status,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error('❌ User creation error:', error);
      
      // Handle validation errors specifically
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.errors
        });
      }
      
      res.status(500).json({
        message: 'Server error creating user',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error creating user' });
  }
};

// Update user (Admin only)
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const {
      name,
      email,
      role,
      designation,
      department,
      contactDetails,
      status
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      user.email = email;
    }

    // Update fields
    if (name) user.name = name;
    if (role) user.role = role;
    if (designation) user.designation = designation;
    if (department) user.department = department;
    if (contactDetails) user.contactDetails = contactDetails;
    if (status) user.status = status;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        designation: user.designation,
        department: user.department,
        status: user.status,
        contactDetails: user.contactDetails
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has assigned tasks
    const activeTasks = await Task.countDocuments({ 
      assignedTo: id, 
      status: { $in: ['assigned', 'in_progress', 'on_hold'] }
    });

    if (activeTasks > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user with active tasks. Please reassign or complete tasks first.' 
      });
    }

    await User.findByIdAndDelete(id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let stats = {};

    if (userRole === 'admin') {
      // Admin stats
      const totalEmployees = await User.countDocuments({ role: 'employee', status: 'active' });
      const tasksAssignedToday = await Task.countDocuments({
        assignedBy: userId,
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      });
      const tasksCompleted = await Task.countDocuments({ status: 'completed' });
      const tasksPending = await Task.countDocuments({ 
        status: { $in: ['assigned', 'in_progress', 'on_hold'] }
      });
      const overdueTasks = await Task.countDocuments({
        status: { $in: ['assigned', 'in_progress', 'on_hold'] },
        dueDate: { $lt: new Date() }
      });

      stats = {
        totalEmployees,
        tasksAssignedToday,
        tasksCompleted,
        tasksPending,
        overdueTasks
      };
    } else {
      // Employee stats
      const todayTasks = await Task.countDocuments({
        assignedTo: userId,
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      });
      const pendingTasks = await Task.countDocuments({
        assignedTo: userId,
        status: 'assigned'
      });
      const inProgressTasks = await Task.countDocuments({
        assignedTo: userId,
        status: 'in_progress'
      });
      const completedTasks = await Task.countDocuments({
        assignedTo: userId,
        status: 'completed'
      });

      stats = {
        todayTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks
      };
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
};

// Get users for chat (all users except current user)
const getChatUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    // Get all users except current user
    const users = await User.find({ 
      _id: { $ne: currentUserId }
    })
    .select('name email role profilePicture status')
    .sort({ name: 1 });

    res.json({ users });
  } catch (error) {
    console.error('Get chat users error:', error);
    res.status(500).json({ message: 'Server error fetching chat users' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getDashboardStats,
  getChatUsers
};
