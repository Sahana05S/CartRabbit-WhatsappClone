import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket } = useSocket();
  const { currentUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/users');
      setUsers(data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleNewMessage = (message) => {
      setUsers((prevUsers) => {
        const msgSenderId = message.senderId?._id || message.senderId;
        const msgReceiverId = message.receiverId?._id || message.receiverId;

        const otherUserId = msgSenderId === currentUser._id ? msgReceiverId : msgSenderId;

        const userIndex = prevUsers.findIndex((u) => u._id === otherUserId);
        if (userIndex === -1) return prevUsers; 

        const updatedUser = { ...prevUsers[userIndex], lastMessage: message };
        const newUsers = prevUsers.filter((u) => u._id !== otherUserId);
        
        return [updatedUser, ...newUsers];
      });
    };

    // Need to handle newMessage event here as well to sync the sidebar
    socket.on('newMessage', handleNewMessage);
    return () => socket.off('newMessage', handleNewMessage);
  }, [socket, currentUser]);

  return { users, loading, error, refetch: fetchUsers };
};
