import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Badge,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  MarkEmailRead,
  Delete,
  DoneAll,
  FilterList,
  Notifications,
  Assignment,
  CheckCircle,
  Warning,
  Info,
  HomeWork,
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationsPage: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadNotifications = useCallback(() => {
    fetchNotifications(1, 50);
  }, [fetchNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [filter, searchTerm, loadNotifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned': return <Assignment />;
      case 'task_completed': return <CheckCircle />;
      case 'task_updated': return <Info />;
      case 'deadline_reminder': return <Warning />;
      case 'task_approved': return <CheckCircle />;
      case 'task_rejected': return <Warning />;
      case 'wfh_approved': return <HomeWork />;
      case 'wfh_rejected': return <Warning />;
      default: return <Notifications />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task_assigned': return 'primary';
      case 'task_completed': return 'success';
      case 'task_updated': return 'info';
      case 'deadline_reminder': return 'warning';
      case 'task_approved': return 'success';
      case 'task_rejected': return 'error';
      case 'wfh_approved': return 'success';
      case 'wfh_rejected': return 'error';
      default: return 'default';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notif.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
                          (filter === 'read' && notif.isRead) ||
                          (filter === 'unread' && !notif.isRead);
    return matchesSearch && matchesFilter;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Notifications
          <Badge badgeContent={unreadCount} color="error" sx={{ ml: 2 }}>
            <Notifications />
          </Badge>
        </Typography>
        <Button
          variant="contained"
          startIcon={<DoneAll />}
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
        >
          Mark All as Read
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Search notifications..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: <FilterList sx={{ mr: 1 }} />
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filter}
              label="Filter"
              onChange={(e) => setFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="unread">Unread</MenuItem>
              <MenuItem value="read">Read</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Notifications List */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          <List>
            {filteredNotifications.length === 0 ? (
              <ListItem>
                <ListItemText 
                  primary="No notifications found" 
                  secondary="You're all caught up!"
                />
              </ListItem>
            ) : (
              filteredNotifications.map((notif) => (
                <React.Fragment key={notif._id}>
                  <ListItem
                    sx={{
                      backgroundColor: notif.isRead ? 'transparent' : 'action.hover',
                      '&:hover': { backgroundColor: 'action.selected' }
                    }}
                  >
                    <ListItemIcon>
                      <Box color={getNotificationColor(notif.type) as any}>
                        {getNotificationIcon(notif.type)}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box 
                            component="span"
                            sx={{ 
                              fontWeight: notif.isRead ? 'normal' : 'bold',
                              fontSize: '0.875rem'
                            }}
                          >
                            {notif.title}
                          </Box>
                          {!notif.isRead && (
                            <Chip label="New" size="small" color="primary" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Box 
                            component="span"
                            sx={{ 
                              fontSize: '0.75rem', 
                              lineHeight: 1.2, 
                              display: 'block',
                              color: 'text.secondary'
                            }}
                          >
                            {notif.message}
                          </Box>
                          <Box 
                            component="span"
                            sx={{ 
                              fontSize: '0.7rem', 
                              display: 'block',
                              color: 'text.secondary'
                            }}
                          >
                            {new Date(notif.createdAt).toLocaleString()}
                          </Box>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {!notif.isRead && (
                        <IconButton
                          size="small"
                          onClick={() => markAsRead(notif._id)}
                          title="Mark as read"
                        >
                          <MarkEmailRead />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => deleteNotification(notif._id)}
                        title="Delete"
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))
            )}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default NotificationsPage;
