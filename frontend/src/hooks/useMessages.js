import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export const useMessages = (selectedUserId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { socket } = useSocket();
  const { currentUser } = useAuth();
  const selectedUserIdRef = useRef(selectedUserId);

  // Keep ref in sync so the socket listener always has current value
  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  const fetchMessages = useCallback(async () => {
    if (!selectedUserId) return;
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get(`/messages/${selectedUserId}`);

      const hydratedMessages = data.messages.map(m => {
        const sender = m.senderId?._id || m.senderId;
        if (sender === selectedUserId && m.status !== 'read') {
          return { ...m, status: 'read', readAt: m.readAt ?? new Date().toISOString() };
        }
        return m;
      });

      setMessages(hydratedMessages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages.');
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  // Refetch when selected user changes
  useEffect(() => {
    setMessages([]);
    fetchMessages();

    if (selectedUserId) {
      api.put(`/messages/mark-read/${selectedUserId}`).catch(console.error);
    }
  }, [fetchMessages, selectedUserId]);

  // Socket listener for incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      const msgSenderId = message.senderId?._id || message.senderId;
      const msgReceiverId = message.receiverId?._id || message.receiverId;
      const activeChatId = selectedUserIdRef.current;

      // Check if message belongs to the current open conversation
      if (activeChatId === msgSenderId || activeChatId === msgReceiverId) {
        setMessages((prev) => {
          // Prevent duplicates (in case of same tab optimistic appending)
          const isDuplicate = prev.some((m) => m._id === message._id);
          if (isDuplicate) return prev;

          return [...prev, { ...message, status: msgSenderId !== currentUser._id ? 'read' : message.status }];
        });

        if (msgSenderId === activeChatId) {
          api.put(`/messages/mark-read/${msgSenderId}`).catch(console.error);
        }
      } else {
        // Message belongs to a different chat, emit delivered
        if (msgSenderId !== currentUser._id) {
          socket.emit('messageDelivered', message._id);
        }
      }
    };

    const handleMessageDelivered = (messageId) => {
      setMessages((prev) => prev.map(m => m._id === messageId ? { ...m, status: 'delivered' } : m));
    };

    const handleMessagesRead = ({ receiverId, readAt }) => {
      if (receiverId === selectedUserIdRef.current) {
        const ts = readAt ?? new Date().toISOString();
        setMessages((prev) => prev.map(m => {
          const mReceiver = m.receiverId?._id || m.receiverId;
          return mReceiver === receiverId && m.status !== 'read'
            ? { ...m, status: 'read', readAt: m.readAt ?? ts }
            : m;
        }));
      }
    };

    const handleMessageReaction = ({ messageId, reactions }) => {
      setMessages((prev) => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
    };

    // Real-time: the sender deleted a message for everyone — replace content with placeholder
    const handleMessageDeletedForEveryone = ({ messageId }) => {
      setMessages((prev) =>
        prev.map(m => m._id === messageId ? { ...m, isDeletedForEveryone: true } : m)
      );
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messageDelivered', handleMessageDelivered);
    socket.on('messagesRead', handleMessagesRead);
    socket.on('messageReaction', handleMessageReaction);
    socket.on('messageDeletedForEveryone', handleMessageDeletedForEveryone);
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageDelivered', handleMessageDelivered);
      socket.off('messagesRead', handleMessagesRead);
      socket.off('messageReaction', handleMessageReaction);
      socket.off('messageDeletedForEveryone', handleMessageDeletedForEveryone);
    };
  }, [socket, currentUser]);

  const addMessage = (message) => {
    setMessages((prev) => {
      const isDuplicate = prev.some((m) => m._id === message._id);
      if (isDuplicate) return prev;
      return [...prev, message];
    });
  };

  // Remove a message from local state (used by delete-for-me)
  const removeMessageLocally = (messageId) => {
    setMessages((prev) => prev.filter(m => m._id !== messageId));
  };

  // Update starredBy in local state after toggle (avoids refetch)
  const updateMessageStar = (messageId, isStarred, userId) => {
    setMessages((prev) => prev.map(m => {
      if (m._id !== messageId) return m;
      const alreadyIn = (m.starredBy || []).map(id => id?.toString?.() ?? id).includes(userId);
      const starredBy = isStarred
        ? (alreadyIn ? m.starredBy : [...(m.starredBy || []), userId])
        : (m.starredBy || []).filter(id => (id?.toString?.() ?? id) !== userId);
      return { ...m, starredBy };
    }));
  };

  return { messages, loading, error, addMessage, removeMessageLocally, updateMessageStar };
};
