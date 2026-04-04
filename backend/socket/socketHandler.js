const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');

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

    // Join all group rooms the user belongs to
    Group.find({ members: userId }).select('_id')
      .then(groups => {
        groups.forEach(g => socket.join(g._id.toString()));
      })
      .catch(err => console.error('Error joining group rooms:', err));
    
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

    socket.on('joinGroup', (groupId) => {
      socket.join(groupId);
    });

    socket.on('leaveGroupRoom', (groupId) => {
      socket.leave(groupId);
    });

    socket.on('messageDelivered', async (messageId) => {
      try {
        const message = await Message.findByIdAndUpdate(
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

    socket.on('typing', ({ receiverId, isGroup }) => {
      if (receiverId) {
        // If it's a group, broadcast to the group room, else to the user's room
        socket.to(receiverId).emit('typing', {
          chatId: receiverId,
          userId: socket.user._id.toString(),
          username: socket.user.username,
          isGroup: !!isGroup
        });
      }
    });

    socket.on('stopTyping', ({ receiverId, isGroup }) => {
      if (receiverId) {
        socket.to(receiverId).emit('stopTyping', {
          chatId: receiverId,
          userId: socket.user._id.toString(),
          isGroup: !!isGroup
        });
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
          
          // Update last seen in DB and emit to clients
          const now = new Date();
          User.findByIdAndUpdate(userId, { lastSeen: now }).catch(console.error);
          io.emit('userOffline', { userId, lastSeen: now });
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
