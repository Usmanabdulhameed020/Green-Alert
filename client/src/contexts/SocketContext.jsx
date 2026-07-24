import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useCitizen } from './CitizenContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

const SOCKET_URL = import.meta.env.VITE_API_URL || '/';

export const SocketProvider = ({ children }) => {
  const { token, user, authInitialized } = useCitizen();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef({});

  // Initialize socket when auth is ready
  useEffect(() => {
    if (!authInitialized || !token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('🔌 Socket connected:', newSocket.id);

      // Join appropriate rooms based on role
      if (user?.role === 'admin') {
        newSocket.emit('join-admin');
      } else if (user?.role === 'agency') {
        newSocket.emit('join-agency', user.organizationId);
      }
      if (user?.id || user?._id) {
        newSocket.emit('join-user', user.id || user._id);
      }
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('🔌 Socket disconnected');
    });

    newSocket.on('connect_error', (err) => {
      console.error('🔌 Socket connection error:', err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [authInitialized, token, user]);

  // Helper to register event handlers with cleanup
  const on = React.useCallback((event, handler) => {
    if (!socket) return () => {};
    socket.on(event, handler);
    handlersRef.current[event] = handler;
    return () => {
      socket.off(event, handler);
      delete handlersRef.current[event];
    };
  }, [socket]);

  const emit = React.useCallback((event, data) => {
    socket?.emit(event, data);
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, connected, on, emit }}>
      {children}
    </SocketContext.Provider>
  );
};