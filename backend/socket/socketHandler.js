const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Track online users: Map<userId, Set<socketId>>
const onlineUsers = new Map();
let ioInstance;

const initSocket = (io) => {
  ioInstance = io;
  // Socket-level auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error: no token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('Authentication error: user not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // Join the user's personal room for targeted delivery
    socket.join(userId);
    
    // Add socketId to the user's set of active connections
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    console.log(`🟢 ${socket.user.username} connected (${socket.id})`);

    // Broadcast updated online list to all clients
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));

    // Relay message to receiver's room in real time
    socket.on('sendMessage', ({ receiverId, message }) => {
      if (receiverId && message) {
        socket.to(receiverId).emit('newMessage', message);
      }
    });

    socket.on('messageDelivered', async (messageId) => {
      try {
        const message = await require('../models/Message').findByIdAndUpdate(
          messageId,
          { status: 'delivered' },
          { new: true }
        );
        if (message) {
          socket.to(message.senderId.toString()).emit('messageDelivered', message._id);
        }
      } catch (err) {
        console.error('Delivered status error:', err);
      }
    });

    socket.on('typing', ({ receiverId }) => {
      if (receiverId) {
        socket.to(receiverId).emit('typing', socket.user._id.toString());
      }
    });

    socket.on('stopTyping', ({ receiverId }) => {
      if (receiverId) {
        socket.to(receiverId).emit('stopTyping', socket.user._id.toString());
      }
    });

    socket.on('disconnect', () => {
      // Remove this specific socketId from the user's tracked connections
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        
        // If the user has no more active connections, completely remove them from the online map
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
        }
      }
      
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
      console.log(`🔴 ${socket.user.username} disconnected (${socket.id})`);
    });
  });
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized!');
  }
  return ioInstance;
};

module.exports = { initSocket, getIO };
