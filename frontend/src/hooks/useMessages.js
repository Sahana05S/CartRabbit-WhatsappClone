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
          return { ...m, status: 'read' };
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

    const handleMessagesRead = ({ receiverId }) => {
      if (receiverId === selectedUserIdRef.current) {
        setMessages((prev) => prev.map(m => {
          const mReceiver = m.receiverId?._id || m.receiverId;
          return mReceiver === receiverId && m.status !== 'read' ? { ...m, status: 'read' } : m;
        }));
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messageDelivered', handleMessageDelivered);
    socket.on('messagesRead', handleMessagesRead);
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageDelivered', handleMessageDelivered);
      socket.off('messagesRead', handleMessagesRead);
    };
  }, [socket, currentUser]);

  const addMessage = (message) => {
    setMessages((prev) => {
      const isDuplicate = prev.some((m) => m._id === message._id);
      if (isDuplicate) return prev;
      return [...prev, message];
    });
  };

  return { messages, loading, error, addMessage };
};
