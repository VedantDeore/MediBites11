import { createServer } from 'http';
import { Server } from 'socket.io';
import { NextResponse } from 'next/server';
import type { NextApiRequest } from 'next';

// Store active rooms
const rooms = new Map();
const socketToRoom = new Map();

// Initialize Socket.IO server
const initSocket = () => {
  // Check if socket server is already initialized
  if ((global as any).io) {
    return (global as any).io;
  }

  const httpServer = createServer();
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('create-room', ({ username, consultationId }) => {
      const roomId = consultationId;
      console.log(`Creating room ${roomId} for ${username}`);

      // Check if room exists
      if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        if (room.users.length >= 2) {
          socket.emit('error', { message: 'Room is full' });
          return;
        }
        // Join existing room
        socket.join(roomId);
        room.users.push({ id: socket.id, username });
        socketToRoom.set(socket.id, roomId);
        
        // Notify others in room
        socket.to(roomId).emit('user-joined', { username });
      } else {
        // Create new room
        socket.join(roomId);
        rooms.set(roomId, {
          creator: socket.id,
          users: [{ id: socket.id, username }]
        });
        socketToRoom.set(socket.id, roomId);
      }

      socket.emit('room-created', roomId);
      console.log(`Room ${roomId}: ${username} (${socket.id}) joined`);
    });

    socket.on('start-call', ({ roomId, offer }) => {
      console.log(`Starting call in room ${roomId}`);
      socket.to(roomId).emit('incoming-call', {
        from: socket.id,
        offer
      });
    });

    socket.on('call-accepted', ({ to, answer }) => {
      console.log(`Call accepted, sending answer to ${to}`);
      socket.to(to).emit('call-accepted', {
        from: socket.id,
        answer
      });
    });

    socket.on('ice-candidate', ({ roomId, candidate }) => {
      console.log(`Broadcasting ICE candidate to room ${roomId}`);
      socket.to(roomId).emit('ice-candidate', {
        from: socket.id,
        candidate
      });
    });

    socket.on('chat-message', ({ roomId, username, text }) => {
      socket.to(roomId).emit('chat-message', {
        username,
        text
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

      const roomId = socketToRoom.get(socket.id);
      if (roomId) {
        const room = rooms.get(roomId);
        if (room) {
          const userIndex = room.users.findIndex(user => user.id === socket.id);
          if (userIndex !== -1) {
            const username = room.users[userIndex].username;
            room.users.splice(userIndex, 1);

            socket.to(roomId).emit('user-disconnected', { username });

            if (room.users.length === 0) {
              rooms.delete(roomId);
            } else if (room.creator === socket.id && room.users.length > 0) {
              room.creator = room.users[0].id;
            }
          }
        }
        socketToRoom.delete(socket.id);
      }
    });
  });

  httpServer.listen(9000);
  (global as any).io = io;

  return io;
};

// API routes
export async function GET(req: NextApiRequest) {
  const io = initSocket();
  
  const roomList = Array.from(rooms.entries()).map(([id, room]) => ({
    id,
    users: room.users.length,
    available: room.users.length < 2
  }));

  return NextResponse.json({
    status: 'ok',
    socketConnections: io.engine.clientsCount,
    rooms: roomList
  });
}

// Health check route
export async function HEAD(req: NextApiRequest) {
  const io = initSocket();
  
  return NextResponse.json({
    status: 'ok',
    socketConnections: io.engine.clientsCount,
    rooms: rooms.size
  });
} 