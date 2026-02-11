# Employee Task Management System (ETMS)

A comprehensive task management system built with the MERN stack that allows managers/admins to assign daily tasks to employees, track task progress in real time, and generate productivity reports.

## 🚀 Features

### Core Functionality
- **User Management**: Role-based access control (Admin/Employee)
- **Task Management**: Complete task lifecycle with status tracking
- **Real-time Notifications**: Instant updates via Socket.io
- **File Attachments**: Upload documents and images to tasks
- **Reports & Analytics**: Comprehensive productivity reports
- **Dashboard**: Role-based dashboards with real-time statistics

### User Roles

#### Admin/Manager
- Create and manage employees
- Assign daily tasks with priorities and deadlines
- Track task progress in real-time
- Approve/reject completed tasks
- View comprehensive reports and analytics
- Manage system settings

#### Employee
- View assigned tasks
- Update task status and progress
- Add comments and upload attachments
- Track personal task history
- Receive real-time notifications

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Multer** - File uploads
- **Nodemailer** - Email notifications
- **Bcryptjs** - Password hashing

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Material-UI (MUI)** - UI components
- **React Router** - Client-side routing
- **React Hook Form** - Form management
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and static file serving

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB 6.0+
- Docker and Docker Compose (for containerized deployment)

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ETMS
   ```

2. Start all services:
   ```bash
   docker-compose up -d
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017

### Option 2: Manual Setup

#### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

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

#### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your backend URL
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## 🔧 Configuration

### Backend Environment Variables

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
```

### Frontend Environment Variables

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## 📊 Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (admin/employee),
  employeeId: String (auto-generated for employees),
  designation: String,
  department: String,
  profilePicture: String,
  contactDetails: {
    phone: String,
    address: String
  },
  status: String (active/inactive/suspended),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Tasks Collection
```javascript
{
  title: String,
  description: String,
  assignedTo: ObjectId (ref: User),
  assignedBy: ObjectId (ref: User),
  status: String (assigned/in_progress/on_hold/completed/approved/rejected),
  priority: String (low/medium/high),
  category: String,
  startDate: Date,
  dueDate: Date,
  estimatedTime: Number,
  progress: Number (0-100),
  attachments: [AttachmentSchema],
  updates: [UpdateSchema],
  completedAt: Date,
  approvedAt: Date,
  approvedBy: ObjectId (ref: User),
  rejectionReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Notifications Collection
```javascript
{
  recipient: ObjectId (ref: User),
  sender: ObjectId (ref: User),
  title: String,
  message: String,
  type: String (task_assigned/task_updated/task_completed/etc.),
  relatedTask: ObjectId (ref: Task),
  isRead: Boolean,
  readAt: Date,
  createdAt: Date
}
```

## 🔐 Security Features

- JWT-based authentication with expiration
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- Role-based access control
- File upload validation
- CORS configuration
- Security headers (Helmet.js)

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Tasks
- `GET /api/tasks` - Get tasks (with filters)
- `POST /api/tasks` - Create task (Admin only)
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id/status` - Update task status
- `POST /api/tasks/:id/updates` - Add task update
- `POST /api/tasks/:id/attachments` - Upload attachments

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### Reports (Admin only)
- `GET /api/reports/daily` - Daily reports
- `GET /api/reports/monthly` - Monthly reports
- `GET /api/reports/employee-performance` - Employee performance

## 🐳 Docker Deployment

### Build and Run
```bash
# Build all services
docker-compose build

# Start all services in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Services
- **etms-mongodb**: MongoDB database on port 27017
- **etms-backend**: Backend API on port 5000
- **etms-frontend**: Frontend application on port 3000
- **etms-nginx**: Nginx reverse proxy on ports 80/443

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📈 Monitoring

### Health Checks
- Backend: `GET /api/health`
- Docker health checks configured for all containers

### Logs
- Application logs available via Docker logs
- Error logging implemented throughout the application

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Email: support@etms.com

## 🗺 Roadmap

- [ ] Mobile application (React Native)
- [ ] Advanced analytics dashboard
- [ ] Integration with third-party tools (Slack, Teams)
- [ ] AI-powered task recommendations
- [ ] Advanced reporting with export options
- [ ] Multi-tenant support
- [ ] Audit logging and compliance features
