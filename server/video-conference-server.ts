import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server with Express
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store active rooms and appointments
const rooms: { 
  [key: string]: {
    participants: string[];
    metadata?: {
      type: 'appointment' | 'consultation';
      doctorId?: string;
      patientId?: string;
      startTime?: string;
      duration?: number;
      appointmentId?: string;
    }
  } 
} = {};

// REST API endpoints
app.get('/api/rooms', (req, res) => {
  // Return list of active rooms (for admin purposes)
  res.json({
    activeRooms: Object.keys(rooms).map(roomId => ({
      roomId,
      participantCount: rooms[roomId].participants.length,
      metadata: rooms[roomId].metadata
    }))
  });
});

app.post('/api/rooms', (req, res) => {
  // Create a new room with metadata
  const { roomId, metadata } = req.body;
  
  if (!roomId) {
    return res.status(400).json({ error: 'Room ID is required' });
  }
  
  // Create room if it doesn't exist
  if (!rooms[roomId]) {
    rooms[roomId] = {
      participants: [],
      metadata
    };
    
    res.status(201).json({
      roomId,
      status: 'created',
      metadata
    });
  } else {
    res.status(200).json({
      roomId,
      status: 'exists',
      participantCount: rooms[roomId].participants.length,
      metadata: rooms[roomId].metadata
    });
  }
});

app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  
  if (!rooms[roomId]) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({
    roomId,
    participantCount: rooms[roomId].participants.length,
    metadata: rooms[roomId].metadata
  });
});

app.delete('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  
  if (!rooms[roomId]) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  // Disconnect all users in the room
  rooms[roomId].participants.forEach(userId => {
    io.to(userId).emit('room-ended');
  });
  
  // Delete the room
  delete rooms[roomId];
  
  res.json({
    roomId,
    status: 'deleted'
  });
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // User profile info
  let userProfile = {
    id: socket.id,
    name: '',
    role: '',
    avatar: ''
  };

  socket.on('set-user-profile', (profile) => {
    userProfile = {...userProfile, ...profile};
    // Emit to rooms this user is in
    Object.keys(socket.rooms).forEach(roomId => {
      if (roomId !== socket.id) {
        socket.to(roomId).emit('user-profile-updated', {
          userId: socket.id,
          profile: userProfile
        });
      }
    });
  });

  socket.on('join-room', ({ roomId, userProfile: profile }) => {
    // Ensure room exists
    if (!rooms[roomId]) {
      rooms[roomId] = {
        participants: [],
        metadata: {}
      };
    }

    // Update user profile
    if (profile) {
      userProfile = {...userProfile, ...profile};
    }

    // Limit to 2 users for appointment rooms
    if (rooms[roomId].metadata?.type === 'appointment' && rooms[roomId].participants.length >= 2) {
      socket.emit('room-full');
      return;
    }

    // Join room
    socket.join(roomId);
    rooms[roomId].participants.push(socket.id);

    // Notify other users in the room
    socket.to(roomId).emit('user-connected', {
      userId: socket.id,
      profile: userProfile
    });
    
    // Send list of current participants to the new user
    const participantsInfo = rooms[roomId].participants
      .filter(id => id !== socket.id)
      .map(id => ({
        userId: id,
        profile: {} // This would be fetched from a user store in a real app
      }));
    
    socket.emit('room-participants', {
      participants: participantsInfo,
      metadata: rooms[roomId].metadata
    });
  });

  // Updated signaling for WebRTC
  socket.on('offer', (data) => {
    socket.to(data.roomId).emit('offer', {
      userId: socket.id,
      profile: userProfile,
      offer: data.offer
    });
  });

  socket.on('answer', (data) => {
    socket.to(data.roomId).emit('answer', {
      userId: socket.id,
      profile: userProfile,
      answer: data.answer
    });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.roomId).emit('ice-candidate', {
      userId: socket.id,
      candidate: data.candidate
    });
  });

  // Chat messages
  socket.on('chat-message', (data) => {
    const { roomId, message } = data;
    io.to(roomId).emit('chat-message', {
      userId: socket.id,
      profile: userProfile,
      message,
      timestamp: new Date().toISOString()
    });
  });

  // Appointment-specific events
  socket.on('start-medical-record', (data) => {
    socket.to(data.roomId).emit('medical-record-started', {
      userId: socket.id,
      appointmentId: data.appointmentId
    });
  });

  socket.on('update-medical-record', (data) => {
    socket.to(data.roomId).emit('medical-record-updated', {
      userId: socket.id,
      appointmentId: data.appointmentId,
      notes: data.notes
    });
  });

  socket.on('end-appointment', (data) => {
    const { roomId, summary, followUp } = data;
    
    // Notify all users in the room
    io.to(roomId).emit('appointment-ended', {
      userId: socket.id,
      summary,
      followUp,
      endTime: new Date().toISOString()
    });
    
    // Optionally, delete the room
    delete rooms[roomId];
  });

  // Disconnection handling
  socket.on('disconnect', () => {
    // Remove user from rooms
    Object.keys(socket.rooms).forEach(roomId => {
      if (roomId !== socket.id && rooms[roomId]) {
        rooms[roomId].participants = rooms[roomId].participants.filter(id => id !== socket.id);
        
        // Notify remaining users
        socket.to(roomId).emit('user-disconnected', {
          userId: socket.id,
          profile: userProfile
        });
        
        // Clean up empty rooms
        if (rooms[roomId].participants.length === 0) {
          delete rooms[roomId];
        }
      }
    });
    
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Video conference server running on port ${PORT}`);
}); 