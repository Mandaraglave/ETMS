const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Register user
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { name, email, password, role = 'employee', designation, department } = req.body;

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
      department
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        designation: user.designation,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    // Provide more detail to help diagnose issues during development
    res.status(500).json({
      message: 'Server error during registration',
      error: error.message || error.toString(),
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    console.log('=== LOGIN REQUEST RECEIVED ===');
    console.log('Headers:', req.headers);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request body:', req.body);
    console.log('Validation errors:', validationResult(req).array());
    console.log('Validation errors object:', validationResult(req));
    
    // Only validate email and password for login
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required'
      });
    }
    
    // Simple validation
    if (!/^[^\s@]+@[^\s]+\.[^\s]+$/.test(email)) {
      return res.status(400).json({ 
        message: 'Invalid email format'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters'
      });
    }

    // Continue with user lookup and authentication
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ message: 'Account is not active' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log(`✅ Login successful for user: ${user.name} (${user.role})`);

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        designation: user.designation,
        department: user.department,
        profilePicture: user.profilePicture,
        officeLocation: user.officeLocation,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        designation: user.designation,
        department: user.department,
        profilePicture: user.profilePicture,
        contactDetails: user.contactDetails,
        officeLocation: user.officeLocation,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Store path relative to server root (e.g. /uploads/avatars/avatar-123.jpg)
    const profilePicture = '/uploads/avatars/' + req.file.filename;
    user.profilePicture = profilePicture;
    await user.save();

    res.json({
      message: 'Profile picture updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        designation: user.designation,
        department: user.department,
        profilePicture: user.profilePicture,
        contactDetails: user.contactDetails
      }
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ message: 'Server error uploading profile picture' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { name, designation, department, contactDetails } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (designation) user.designation = designation;
    if (department) user.department = department;
    if (contactDetails) user.contactDetails = contactDetails;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        designation: user.designation,
        department: user.department,
        profilePicture: user.profilePicture,
        contactDetails: user.contactDetails
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// Request OTP for login
const requestOtp = async (req, res) => {
  try {
    console.log('=== OTP REQUEST STARTED ===');
    console.log('Request body:', { email: req.body.email, role: req.body.role });
    
    const errors = validationResult(req);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request body:', req.body);
    console.log('Validation errors:', errors.array());
    console.log('Validation errors object:', errors);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { email, role } = req.body;

    console.log('🔍 Looking for user with email:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ No user found with email:', email);
      return res.status(404).json({ message: 'No account found with this email' });
    }
    
    console.log('✅ User found:', { name: user.name, role: user.role, status: user.status });
    
    if (user.status !== 'active') {
      console.log('❌ User account not active:', user.status);
      return res.status(401).json({ message: 'Account is not active' });
    }
    
    if (user.role !== role) {
      console.log(`❌ Role mismatch: User role="${user.role}" but requested role="${role}"`);
      return res.status(400).json({ message: `No ${role} account found with this email` });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('🔢 Generated OTP:', otp);
    console.log('⏰ OTP expires at:', expiresAt);

    await Otp.deleteMany({ email, role });
    await Otp.create({ email, otp, role, expiresAt });

    console.log('📧 Attempting to send email...');
    console.log('📧 Email config:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      passExists: !!process.env.EMAIL_PASS
    });

    try {
      const template = emailTemplates.loginOtp(email, otp);
      console.log('📧 Email template created');
      const result = await sendEmail(email, template.subject, template.html);
      console.log('📧 Email send result:', result);
      
      if (!result.success) {
        console.error('❌ Email sending failed:', result.error);
        return res.status(500).json({ 
          message: 'Failed to send OTP email. Please try again.',
          error: result.error 
        });
      }
      
      console.log('✅ OTP email sent successfully to:', email);
      res.json({ message: 'OTP sent to your email' });
    } catch (emailErr) {
      console.error('❌ OTP email failed:', emailErr);
      return res.status(500).json({ 
        message: 'Failed to send OTP email. Please try again.',
        error: emailErr.message 
      });
    }
  } catch (error) {
    console.error('❌ Request OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify OTP and login
const verifyOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
    }

    const { email, otp, role } = req.body;

    const otpRecord = await Otp.findOne({ email, role }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Otp.deleteOne({ _id: otpRecord._id });

    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        designation: user.designation,
        department: user.department,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  uploadProfilePicture,
  requestOtp,
  verifyOtp,
};
