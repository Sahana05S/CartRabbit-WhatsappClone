import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export const useUsers = (selectedUserId) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket } = useSocket();
  const { currentUser } = useAuth();

  const selectedUserIdRef = useRef(selectedUserId);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
    if (selectedUserId) {
      setUsers((prev) => 
        prev.map((u) => 
          u._id === selectedUserId && u.unreadCount > 0
            ? { ...u, unreadCount: 0 }
            : u
        )
      );
    }
  }, [selectedUserId]);

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

        let newUnreadCount = prevUsers[userIndex].unreadCount || 0;
        
        // If message is incoming and not from the currently open chat
        if (msgSenderId !== currentUser._id && otherUserId !== selectedUserIdRef.current) {
          newUnreadCount += 1;
        }

        const updatedUser = { 
          ...prevUsers[userIndex], 
          lastMessage: message,
          unreadCount: newUnreadCount
        };
        
        const newUsers = prevUsers.filter((u) => u._id !== otherUserId);
        
        return [updatedUser, ...newUsers];
      });
    };

    // Need to handle newMessage event here as well to sync the sidebar
    socket.on('newMessage', handleNewMessage);
    
    const handleMessageDelivered = (messageId) => {
      setUsers((prev) => prev.map(u => 
        u.lastMessage?._id === messageId 
          ? { ...u, lastMessage: { ...u.lastMessage, status: 'delivered' } } 
          : u
      ));
    };

    const handleMessagesRead = ({ receiverId }) => {
      setUsers((prev) => prev.map(u => {
        if (u._id === receiverId && u.lastMessage) {
          const sender = u.lastMessage.senderId?._id || u.lastMessage.senderId;
          const isSenderMe = sender === currentUser._id;
          
          if (isSenderMe && u.lastMessage.status !== 'read') {
            return { ...u, lastMessage: { ...u.lastMessage, status: 'read' } };
          }
        }
        return u;
      }));
    };

    socket.on('messageDelivered', handleMessageDelivered);
    socket.on('messagesRead', handleMessagesRead);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageDelivered', handleMessageDelivered);
      socket.off('messagesRead', handleMessagesRead);
    };
  }, [socket, currentUser]);

  return { users, loading, error, refetch: fetchUsers };
};
