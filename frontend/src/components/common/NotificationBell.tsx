import React, { useState } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
} from '@mui/material';
import {
  Notifications,
  MarkEmailRead,
  Delete,
  DoneAll,
  Assignment,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const NotificationBell: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned': return <Assignment />;
      case 'task_completed': return <CheckCircle />;
      case 'task_updated': return <Info />;
      case 'deadline_reminder': return <Warning />;
      case 'task_approved': return <CheckCircle />;
      case 'task_rejected': return <Warning />;
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
      default: return 'default';
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    // Navigate to related task if available
    if (notification.relatedTask) {
      const taskId = typeof notification.relatedTask === 'object' 
        ? notification.relatedTask._id || notification.relatedTask.id 
        : notification.relatedTask;
      navigate(`/tasks/${taskId}`);
    }
    
    handleClose();
  };

  const displayNotifications = notifications.slice(0, 5); // Show only 5 most recent

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ mr: 2 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <Notifications />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
            overflow: 'auto',
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAll />}
              onClick={() => {
                markAllAsRead();
                handleClose();
              }}
              sx={{ mb: 1 }}
            >
              Mark All as Read
            </Button>
          )}
        </Box>

        {displayNotifications.length === 0 ? (
          [<MenuItem key="no-notifications" disabled>
            <Typography variant="body2" color="textSecondary">
              No notifications
            </Typography>
          </MenuItem>]
        ) : [
          ...displayNotifications.map((notification) => (
            <MenuItem
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                '&:hover': { backgroundColor: 'action.selected' },
                py: 1.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Box color={getNotificationColor(notification.type) as any}>
                  {getNotificationIcon(notification.type)}
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: notification.isRead ? 'normal' : 'bold',
                        fontSize: '0.875rem'
                      }}
                    >
                      {notification.title}
                    </Typography>
                    {!notification.isRead && (
                      <Chip label="New" size="small" color="primary" sx={{ height: 20 }} />
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
                      {notification.message}
                    </Box>
                    <Box 
                      component="span"
                      sx={{ 
                        fontSize: '0.7rem', 
                        display: 'block',
                        color: 'text.secondary'
                      }}
                    >
                      {new Date(notification.createdAt).toLocaleString()}
                    </Box>
                  </Box>
                }
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {!notification.isRead && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification._id);
                    }}
                    title="Mark as read"
                  >
                    <MarkEmailRead sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification._id);
                  }}
                  title="Delete"
                  color="error"
                >
                  <Delete sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            </MenuItem>
          )),
          ...(displayNotifications.length > 0 ? [
            <Divider key="divider" />,
            <MenuItem 
              key="view-all"
              onClick={() => {
                navigate('/notifications');
                handleClose();
              }}
            >
              <Typography variant="body2" color="primary" sx={{ textAlign: 'center', width: '100%' }}>
                View All Notifications
              </Typography>
            </MenuItem>
          ] : [])
        ]}
      </Menu>
    </>
  );
};

export default NotificationBell;
