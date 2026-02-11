// Use default import for compatibility with existing @types/socket.io-client
import io from 'socket.io-client';
import { Notification } from '../types';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  // Keep socket loosely typed to avoid version/type mismatches
  private socket: any | null = null;
  private notificationCallbacks: ((notification: Notification) => void)[] = [];

  connect(userId: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected, joining user room', userId);
      this.socket?.emit('join_room', userId);
    });

    this.socket.on('notification', (notification: Notification) => {
      this.notificationCallbacks.forEach((cb) => cb(notification));
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.off('notification');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onNotification(callback: (notification: Notification) => void) {
    this.notificationCallbacks.push(callback);
  }

  removeNotificationCallback(callback: (notification: Notification) => void) {
    const index = this.notificationCallbacks.indexOf(callback);
    if (index > -1) {
      this.notificationCallbacks.splice(index, 1);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export const socketService = new SocketService();
export default socketService;
