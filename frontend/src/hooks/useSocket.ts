import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { token, currentWorkspace } = useAuthStore();

  useEffect(() => {
    if (!token) return;

    // Connect to WebSocket
    socketRef.current = io('http://localhost:3000', {
      auth: {
        token,
      },
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      
      // Join workspace room
      if (currentWorkspace) {
        socketRef.current?.emit('joinWorkspace', currentWorkspace.id);
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token, currentWorkspace]);

  return socketRef.current;
};
