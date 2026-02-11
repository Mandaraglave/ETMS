import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SocketProvider } from './contexts/SocketContext';
import { ChatProvider } from './contexts/ChatContext';
import Layout from './components/common/Layout';
import Login from './components/auth/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import CreateTask from './pages/CreateTask';
import CreateEmployee from './pages/CreateEmployee';
import Users from './pages/Users';
import Reports from './pages/Reports';
import NotificationsPage from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Attendance from './pages/Attendance';
import Chat from './pages/Chat';
import ProtectedRoute from './components/common/ProtectedRoute';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <ChatProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/tasks" element={<Tasks />} />
                            <Route path="/tasks/:id" element={<TaskDetail />} />
                            <Route path="/tasks/create" element={<CreateTask />} />
                            <Route path="/employees/create" element={<CreateEmployee />} />
                            <Route path="/users" element={<Users />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/notifications" element={<NotificationsPage />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/attendance" element={<Attendance />} />
                            <Route path="/chat" element={<Chat />} />
                            <Route path="/settings" element={<Settings />} />
                          </Routes>
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Router>
            </ChatProvider>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
