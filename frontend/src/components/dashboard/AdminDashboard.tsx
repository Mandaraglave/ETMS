import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
} from '@mui/material';
import {
  People,
  Assignment,
  CheckCircle,
  Pending,
  Warning,
  Add,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DashboardStats, Task } from '../../types';
import apiService from '../../services/api';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({});
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, tasksResponse] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getTasks({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        ]);
        setStats(statsResponse.stats);
        setRecentTasks(tasksResponse.tasks);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees || 0,
      icon: <People />,
      color: '#1976d2',
    },
    {
      title: 'Tasks Assigned Today',
      value: stats.tasksAssignedToday || 0,
      icon: <Assignment />,
      color: '#388e3c',
    },
    {
      title: 'Tasks Completed',
      value: stats.tasksCompleted || 0,
      icon: <CheckCircle />,
      color: '#2e7d32',
    },
    {
      title: 'Tasks Pending',
      value: stats.tasksPending || 0,
      icon: <Pending />,
      color: '#f57c00',
    },
    {
      title: 'Overdue Tasks',
      value: stats.overdueTasks || 0,
      icon: <Warning />,
      color: '#d32f2f',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'assigned':
        return 'warning';
      case 'on_hold':
        return 'error';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Admin Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/tasks/create')}
        >
          Create Task
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        {statCards.map((card, index) => (
          <Box key={index} sx={{ flex: '1 1 200px', minWidth: 200 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ color: card.color, mr: 1 }}>{card.icon}</Box>
                  <Typography variant="h6" component="div">
                    {card.value}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Recent Tasks */}
        <Box sx={{ flex: '1 1 600px', minWidth: 300 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Tasks
            </Typography>
            <List>
              {recentTasks && recentTasks.map((task) => (
                <ListItem key={task._id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">{task.title}</Typography>
                        <Chip
                          label={task.priority}
                          size="small"
                          color={getPriorityColor(task.priority) as any}
                        />
                        <Chip
                          label={task.status.replace('_', ' ')}
                          size="small"
                          color={getStatusColor(task.status) as any}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Assigned to: {task.assignedTo.name} ({task.assignedTo.employeeId})
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Progress: {task.progress}%
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {recentTasks && recentTasks.length === 0 && (
                <ListItem>
                  <ListItemText primary="No recent tasks found" />
                </ListItem>
              )}
            </List>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button variant="outlined" onClick={() => navigate('/tasks')}>
                View All Tasks
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ flex: '1 1 300px', minWidth: 250 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/tasks/create')}
              >
                Create New Task
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/users')}
              >
                Manage Users
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/reports')}
              >
                View Reports
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/notifications')}
              >
                Notifications
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
