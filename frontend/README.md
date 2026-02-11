# Employee Task Management System (ETMS) - Frontend

A comprehensive task management system frontend built with React, TypeScript, and Material-UI.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (Admin/Employee)
- **Dashboard**: Role-based dashboards with real-time statistics
- **Task Management**: Complete task lifecycle with status tracking and progress updates
- **Real-time Notifications**: Socket.io integration for instant notifications
- **Responsive Design**: Mobile-friendly interface with Material-UI components
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- **React 18** - UI library with hooks
- **TypeScript** - Type safety
- **Material-UI (MUI)** - UI component library
- **React Router** - Client-side routing
- **React Hook Form** - Form management
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend server running on port 5000

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your backend URL
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The app will open at [http://localhost:3000](http://localhost:3000).

## Environment Variables

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── auth/           # Authentication components
│   ├── common/         # Common components (Layout, ProtectedRoute)
│   └── dashboard/      # Dashboard components
├── contexts/           # React contexts (Auth, Notifications)
├── pages/              # Page components
├── services/           # API and socket services
├── types/              # TypeScript type definitions
└── App.tsx            # Main app component
```

## Features Overview

### Authentication
- Login/Register forms with validation
- JWT token management
- Role-based access control
- Protected routes

### Dashboard
- **Admin Dashboard**: Employee management, task statistics, quick actions
- **Employee Dashboard**: Personal tasks, progress tracking, notifications

### Real-time Features
- Live notifications for task updates
- Socket.io integration
- Real-time dashboard updates

### UI/UX
- Responsive design for all screen sizes
- Material-UI components
- Dark/light theme support
- Loading states and error handling

## API Integration

The frontend integrates with the backend API for:
- Authentication (login/register)
- User management
- Task CRUD operations
- Notifications
- Reports and analytics

## Development

### Adding New Pages

1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Update navigation in `src/components/common/Layout.tsx`

### Adding New Components

1. Create component in appropriate `src/components/` subfolder
2. Export and use where needed
3. Follow TypeScript best practices

### API Integration

Use the `apiService` from `src/services/api.ts` for all API calls:
```typescript
import apiService from '../services/api';

// Example
const response = await apiService.getTasks();
```

## Build and Deployment

### Production Build

```bash
npm run build
```

This creates an optimized build in the `build/` folder.

### Deployment

The build folder can be deployed to any static hosting service:
- Netlify
- Vercel
- AWS S3
- GitHub Pages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC
