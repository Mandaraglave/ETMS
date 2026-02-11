# Employee Task Management System (ETMS) - Backend

A comprehensive task management system backend built with Node.js, Express, and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (Admin/Employee)
- **User Management**: Complete CRUD operations for users with role management
- **Task Management**: Full task lifecycle with status tracking, progress updates, and file attachments
- **Real-time Notifications**: Socket.io integration for instant notifications
- **Reports & Analytics**: Daily, monthly, and employee performance reports
- **File Upload**: Support for task attachments with validation
- **Email Notifications**: Automated email alerts for task events
- **Deadline Reminders**: Cron job sends in-app + email reminders for tasks due within 24 hours
- **Security**: Rate limiting, input validation, and secure password hashing

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication tokens
- **Socket.io** - Real-time communication
- **Multer** - File upload handling
- **Nodemailer** - Email sending
- **Bcryptjs** - Password hashing
- **Express Validator** - Input validation

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start MongoDB server

5. Run the application:
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/etms
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development

# Email configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# File upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Rate limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Deadline reminders (optional)
DEADLINE_REMINDER_HOURS=24    # Notify for tasks due within N hours
DEADLINE_REMINDER_CRON=0 * * * *   # Cron: every hour (default)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/otp/request` - Request OTP for login (body: `{ email, role }`)
- `POST /api/auth/otp/verify` - Verify OTP and login (body: `{ email, otp, role }`)
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/dashboard/stats` - Get dashboard stats

### Tasks
- `GET /api/tasks` - Get tasks (with filters)
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create task (Admin only)
- `PUT /api/tasks/:id/status` - Update task status
- `POST /api/tasks/:id/updates` - Add task update/comment
- `POST /api/tasks/:id/attachments` - Upload task attachments
- `DELETE /api/tasks/:id` - Delete task (Admin only)

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread/count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read/all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Reports (Admin only)
- `GET /api/reports/daily` - Get daily reports
- `GET /api/reports/monthly` - Get monthly reports
- `GET /api/reports/employee-performance` - Get employee performance
- `GET /api/reports/export` - Export data

## Database Schema

### Users
- name, email, password, role (admin/employee)
- employeeId, designation, department
- profilePicture, contactDetails, status

### Tasks
- title, description, assignedTo, assignedBy
- status, priority, category, dueDate, estimatedTime
- progress, attachments, updates, timestamps

### Notifications
- recipient, sender, title, message, type
- relatedTask, isRead, timestamps

## Socket.io Events

- `join_room` - Join user's notification room
- `notification` - Real-time notification updates

## Security Features

- JWT authentication with expiration
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- Role-based access control
- File upload validation
- CORS configuration
- Helmet security headers

## Error Handling

- Consistent error response format
- Validation error handling
- Database error handling
- Authentication error handling

## Development

The project follows a modular structure:
- `models/` - Mongoose models
- `controllers/` - Route controllers
- `routes/` - API routes
- `middleware/` - Custom middleware
- `utils/` - Utility functions

## Testing

To run tests (when implemented):
```bash
npm test
```

## License

ISC
