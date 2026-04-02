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
      setMessages(data.messages);
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
  }, [fetchMessages]);

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
          
          return [...prev, message];
        });
      } else {
        // Message belongs to a different chat, handle separately (e.g. unread count badge)
        // Future implementation goes here
      }
    };

    socket.on('newMessage', handleNewMessage);
    return () => socket.off('newMessage', handleNewMessage);
  }, [socket]);

  const addMessage = (message) => {
    setMessages((prev) => {
      const isDuplicate = prev.some((m) => m._id === message._id);
      if (isDuplicate) return prev;
      return [...prev, message];
    });
  };

  return { messages, loading, error, addMessage };
};
