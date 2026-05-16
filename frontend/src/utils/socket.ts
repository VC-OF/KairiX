import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (import.meta as any).env?.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket(token: string, projectId?: string): Socket {
  const s = getSocket();

  if (!s.connected) {
    s.connect();
  }

  s.once('connect', () => {
    // Join personal room for notifications
    s.emit('join-user', token);
    // Optionally join project room
    if (projectId) {
      s.emit('join-project', projectId);
    }
  });

  // If already connected, emit immediately
  if (s.connected) {
    s.emit('join-user', token);
    if (projectId) {
      s.emit('join-project', projectId);
    }
  }

  return s;
}

export function joinProjectRoom(projectId: string) {
  const s = getSocket();
  if (s.connected) {
    s.emit('join-project', projectId);
  }
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}
