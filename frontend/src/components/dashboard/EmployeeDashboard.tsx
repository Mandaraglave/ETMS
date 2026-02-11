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
  LinearProgress,
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Pending,
  PlayArrow,
  Today,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardStats, Task } from '../../types';
import apiService from '../../services/api';

const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, tasksResponse] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getTasks({ limit: 5, sortBy: 'dueDate', sortOrder: 'asc' }),
        ]);
        setStats(statsResponse.stats);
        setMyTasks(tasksResponse.tasks);
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
      title: "Today's Tasks",
      value: stats.todayTasks || 0,
      icon: <Today />,
      color: '#1976d2',
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks || 0,
      icon: <Pending />,
      color: '#f57c00',
    },
    {
      title: 'In Progress',
      value: stats.inProgressTasks || 0,
      icon: <PlayArrow />,
      color: '#2196f3',
    },
    {
      title: 'Completed',
      value: stats.completedTasks || 0,
      icon: <CheckCircle />,
      color: '#4caf50',
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

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
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
          Employee Dashboard
        </Typography>
        <Typography variant="h6" color="textSecondary">
          Welcome, {user?.name}!
        </Typography>
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
        {/* My Tasks */}
        <Box sx={{ flex: '1 1 600px', minWidth: 300 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              My Tasks
            </Typography>
            <List>
              {myTasks.map((task) => (
                <ListItem key={task._id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" component="span">{task.title}</Typography>
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
                        {isOverdue(task.dueDate) && (
                          <Chip label="Overdue" size="small" color="error" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box component="span">
                        <Box component="span" sx={{ display: 'block', mb: 0.5 }}>
                          Assigned by: {task.assignedBy?.name || 'Unassigned'}
                        </Box>
                        <Box component="span" sx={{ display: 'block', mb: 0.5 }}>
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </Box>
                        <Box sx={{ mt: 1 }}>
                          <Box component="span" sx={{ display: 'block', mb: 0.5 }}>
                            Progress: {task.progress}%
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={task.progress}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {myTasks.length === 0 && (
                <ListItem>
                  <ListItemText primary="No tasks assigned to you" />
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
                startIcon={<Assignment />}
                onClick={() => navigate('/tasks')}
              >
                View My Tasks
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/profile')}
              >
                Update Profile
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

          {/* Task Summary */}
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Task Summary
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Total Tasks Assigned
                </Typography>
                <Typography variant="h6">
                  {(stats.todayTasks || 0) + (stats.pendingTasks || 0) + (stats.inProgressTasks || 0) + (stats.completedTasks || 0)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Completion Rate
                </Typography>
                <Typography variant="h6">
                  {stats.todayTasks || 0 > 0 
                    ? Math.round(((stats.completedTasks || 0) / ((stats.todayTasks || 0) + (stats.pendingTasks || 0) + (stats.inProgressTasks || 0) + (stats.completedTasks || 0))) * 100)
                    : 0}%
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default EmployeeDashboard;
