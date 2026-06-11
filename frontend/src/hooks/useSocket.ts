import { useEffect, useRef, MutableRefObject } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

/**
 * useSocket — provides a stable Socket.IO connection tied to auth state.
 *
 * Returns a MutableRefObject<Socket | null> rather than the socket instance
 * directly. This is intentional:
 *
 * - `socketRef.current` is null on the very first render (before the
 *   useEffect runs), so returning it directly would hand consumers a null
 *   value that never updates when the socket connects.
 * - By returning the ref itself, consumers read `socket.current` inside
 *   their own useEffect/event-handler, always getting the live value.
 *
 * The socket is automatically reconnected when the token or workspace
 * changes (e.g. after login or workspace switch).
 */
export const useSocket = (): MutableRefObject<Socket | null> => {
  const socketRef = useRef<Socket | null>(null);
  const { token, currentWorkspace } = useAuthStore();

  const socketUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

  useEffect(() => {
    if (!token) return;

    // Connect with JWT in the socket handshake auth payload
    socketRef.current = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('[Socket] Connected:', socketRef.current?.id);

      // Join the workspace room so we receive budgetUpdated events
      if (currentWorkspace) {
        socketRef.current?.emit('joinWorkspace', currentWorkspace.id);
        console.log('[Socket] Joined workspace:', currentWorkspace.id);
      }
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socketRef.current.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    return () => {
      if (socketRef.current) {
        if (currentWorkspace) {
          socketRef.current.emit('leaveWorkspace', currentWorkspace.id);
        }
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, currentWorkspace, socketUrl]);

  // Return the ref object — consumers access the live socket via .current
  return socketRef;
};
