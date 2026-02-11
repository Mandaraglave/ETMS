import React, { createContext, useContext, useEffect, useState } from 'react';

// Import socket.io-client dynamically to avoid TypeScript issues
const { io } = require('socket.io-client');

interface SocketContextType {
  socket: any;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = (): any => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context.socket;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const newSocket = io('http://localhost:5000', {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
        
        // Join user room for private messaging
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.id) {
          newSocket.emit('join_room', userData.id);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
