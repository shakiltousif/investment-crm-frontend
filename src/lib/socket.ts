import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
  if (typeof window === 'undefined') {
    return null; // Server-side rendering
  }

  if (socket?.connected) {
    return socket;
  }

  const token = localStorage.getItem('accessToken');
  if (!token) {
    return null;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect();
  }

  // Create new socket connection with authentication
  socket = io(apiUrl, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    // Try to reconnect with fresh token
    const newToken = localStorage.getItem('accessToken');
    if (newToken && newToken !== token) {
      socket?.disconnect();
      socket = null;
      getSocket();
    }
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const reconnectSocket = (): void => {
  disconnectSocket();
  getSocket();
};

