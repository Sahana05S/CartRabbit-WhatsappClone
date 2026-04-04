import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { playSubtleBeep, requestNotificationPermission, showBrowserNotification } from '../utils/notifications';

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
      
      const [usersRes, groupsRes] = await Promise.all([
        api.get('/users'),
        api.get('/groups')
      ]);
      
      const allChats = [...usersRes.data.users, ...groupsRes.data.groups];
      
      // Sort unified list
      allChats.sort((a, b) => {
        const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
        if (dateA !== dateB) return dateB - dateA;
        return (a.username || a.name || '').localeCompare(b.username || b.name || '');
      });

      setUsers(allChats);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load chats.');
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

        const isGroupMsg = message.chatType === 'group';
        const otherChatId = isGroupMsg ? message.groupId : (msgSenderId === currentUser._id ? msgReceiverId : msgSenderId);

        const chatIndex = prevUsers.findIndex((u) => u._id === otherChatId);
        if (chatIndex === -1) return prevUsers; 

        let newUnreadCount = prevUsers[chatIndex].unreadCount || 0;
        
        const isIncoming = msgSenderId !== currentUser._id;
        const isNotActiveChat = otherChatId !== selectedUserIdRef.current;
        const isTabHidden = document.hidden;
        
        if (isIncoming && (isNotActiveChat || isTabHidden)) {
          newUnreadCount += 1;
          
          playSubtleBeep();
          showBrowserNotification(message, prevUsers[chatIndex].username);
        }

        const updatedUser = { 
          ...prevUsers[chatIndex], 
          lastMessage: message,
          unreadCount: newUnreadCount
        };
        
        const newUsers = prevUsers.filter((u) => u._id !== otherChatId);
        
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

    const handleUserOffline = ({ userId, lastSeen }) => {
      setUsers((prev) => prev.map(u => u._id === userId ? { ...u, lastSeen } : u));
    };

    socket.on('messageDelivered', handleMessageDelivered);
    socket.on('messagesRead', handleMessagesRead);
    socket.on('userOffline', handleUserOffline);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageDelivered', handleMessageDelivered);
      socket.off('messagesRead', handleMessagesRead);
      socket.off('userOffline', handleUserOffline);
    };
  }, [socket, currentUser]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Update tab title based on total unreads
  useEffect(() => {
    const totalUnreads = users.reduce((sum, u) => sum + (u.unreadCount || 0), 0);
    if (totalUnreads > 0) {
      document.title = `(${totalUnreads}) New messages - NexTalk`;
    } else {
      document.title = 'NexTalk';
    }
  }, [users]);

  // Handle tab visibility change to clear unreads for active chat
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && selectedUserIdRef.current) {
        setUsers((prev) => 
          prev.map((u) => 
            u._id === selectedUserIdRef.current && u.unreadCount > 0
              ? { ...u, unreadCount: 0 }
              : u
          )
        );
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Pin/Unpin chat
  const togglePinChat = useCallback(async (userId) => {
    // Optimistic update
    setUsers((prev) => prev.map(u => 
      u._id === userId ? { ...u, isPinned: !u.isPinned } : u
    ));
    try {
      await api.post(`/users/${userId}/pin`);
    } catch (err) {
      console.error('Failed to pin chat', err);
      // Revert on failure
      setUsers((prev) => prev.map(u => 
        u._id === userId ? { ...u, isPinned: !u.isPinned } : u
      ));
    }
  }, []);

  // Archive/Unarchive chat
  const toggleArchiveChat = useCallback(async (userId) => {
    // Optimistic update
    setUsers((prev) => prev.map(u => 
      u._id === userId ? { ...u, isArchived: !u.isArchived } : u
    ));
    try {
      await api.post(`/users/${userId}/archive`);
    } catch (err) {
      console.error('Failed to archive chat', err);
      // Revert on failure
      setUsers((prev) => prev.map(u => 
        u._id === userId ? { ...u, isArchived: !u.isArchived } : u
      ));
    }
  }, []);

  return { users, loading, error, refetch: fetchUsers, togglePinChat, toggleArchiveChat };
};
