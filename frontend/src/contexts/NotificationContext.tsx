import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Notification } from '../types';
import apiService from '../services/api';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
}

interface NotificationContextType extends NotificationState {
  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
}

type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_NOTIFICATIONS'; payload: { notifications: Notification[]; unreadCount: number } }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'DELETE_NOTIFICATION'; payload: string };

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
};

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload.notifications,
        unreadCount: action.payload.unreadCount,
        isLoading: false,
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification._id === action.payload
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
        unreadCount: 0,
      };
    case 'DELETE_NOTIFICATION':
      const deletedNotification = state.notifications.find(n => n._id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(notification => notification._id !== action.payload),
        unreadCount: deletedNotification && !deletedNotification.isRead 
          ? state.unreadCount - 1 
          : state.unreadCount,
      };
    default:
      return state;
  }
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { isAuthenticated, user } = useAuth();
  
  const fetchNotifications = async (page = 1, limit = 10) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiService.getNotifications(page, limit);
      dispatch({
        type: 'SET_NOTIFICATIONS',
        payload: {
          notifications: response.notifications,
          unreadCount: response.pagination.unreadCount,
        },
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  useEffect(() => {
    // Only set up notifications when user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    // Initial load for bell icon / notifications page
    fetchNotifications().catch((err) =>
      console.error('Initial notifications fetch failed:', err)
    );

    // Ensure socket is connected for this user
    if (!socketService.isConnected()) {
      socketService.connect(user.id);
    }

    // Set up socket listener for real-time notifications
    const handleNotification = (notification: Notification) => {
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    };

    socketService.onNotification(handleNotification);

    return () => {
      socketService.removeNotificationCallback(handleNotification);
    };
  }, [isAuthenticated, user]);

  const markAsRead = async (id: string) => {
    try {
      await apiService.markNotificationAsRead(id);
      dispatch({ type: 'MARK_AS_READ', payload: id });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      dispatch({ type: 'MARK_ALL_AS_READ' });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiService.deleteNotification(id);
      dispatch({ type: 'DELETE_NOTIFICATION', payload: id });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const addNotification = (notification: Notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  const value: NotificationContextType = {
    ...state,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
