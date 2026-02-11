const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const attendanceRoutes = require('./routes/attendance');
const geocodingRoutes = require('./routes/geocoding');
const chatRoutes = require('./routes/chat');
const { startDeadlineReminderJob } = require('./jobs/deadlineReminder');

const app = express();
const server = http.createServer(app);

/* ===============================
   ALLOWED ORIGINS (Frontend URLs)
================================= */
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL // production frontend
];

/* ===============================
   SOCKET.IO CONFIGURATION
================================= */
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

/* ===============================
   MIDDLEWARE
================================= */

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ===============================
   RATE LIMITING
================================= */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "15") * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
  message: 'Too many requests from this IP, please try again later.'
});

// Enable only in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
} else {
  console.log('Rate limiting is disabled in development mode.');
}

/* ===============================
   STATIC FILES
================================= */
app.use('/uploads', express.static('uploads'));

/* ===============================
   SOCKET CONNECTION HANDLING
================================= */
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible inside routes
app.set('io', io);

/* ===============================
   ROUTES
================================= */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/geocoding', geocodingRoutes);

/* ===============================
   HEALTH CHECK
================================= */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'ETMS Server is running'
  });
});

/* ===============================
   DATABASE CONNECTION
================================= */
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB');

  const PORT = process.env.PORT || 5000;

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startDeadlineReminderJob(io);
  });
})
.catch((error) => {
  console.error('Database connection error:', error);
  process.exit(1);
});

module.exports = app;
