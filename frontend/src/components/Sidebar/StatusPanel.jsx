import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { formatPreviewTime } from '../../utils/formatTime';

const StatusPanel = ({ onClose, onOpenViewer }) => {
  const { currentUser } = useAuth();
  const { socket } = useSocket();
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  const resolveUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
  };

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/status');
        setStatuses(data.statuses || []);
      } catch (error) {
        console.error('Error fetching statuses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatuses();

    if (socket) {
      const handleNewStatus = (newStatus) => {
        // Only add if it's from current user or their contact
        // (The backend already filters getStatuses, but real-time needs it too)
        if (newStatus.userId._id === currentUser?._id || currentUser?.contacts?.includes(newStatus.userId._id)) {
          setStatuses(prev => {
            // Avoid duplicates
            if (prev.find(s => s._id === newStatus._id)) return prev;
            return [...prev, newStatus];
          });
        }
      };

      const handleStatusDeleted = ({ statusId }) => {
        setStatuses(prev => prev.filter(s => s._id !== statusId));
      };

      socket.on('newStatus', handleNewStatus);
      socket.on('statusDeleted', handleStatusDeleted);

      return () => {
        socket.off('newStatus', handleNewStatus);
        socket.off('statusDeleted', handleStatusDeleted);
      };
    }
  }, [socket, currentUser]);

  // Group statuses by user
  const groupedStatuses = statuses.reduce((acc, status) => {
    const uid = status.userId._id;
    if (!acc[uid]) {
      acc[uid] = {
        user: status.userId,
        statuses: []
      };
    }
    acc[uid].statuses.push(status);
    return acc;
  }, {});

  const myStatuses = groupedStatuses[currentUser?._id]?.statuses || [];
  const otherUsers = Object.values(groupedStatuses).filter(g => g.user._id !== currentUser?._id);

  const handleUploadStatus = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const { data } = await api.post('/status', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Update local state by appending to myStatuses
      setStatuses(prev => [...prev, data.status]);
    } catch (err) {
      console.error('Failed to upload status', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div 
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="sidebar-panel border-r border-border bg-bg-primary overflow-hidden flex flex-col"
    >
      <header className="h-[108px] bg-bg-secondary flex items-end px-6 pb-5 gap-6 border-b border-border flex-shrink-0">
        <button onClick={onClose} className="btn-ghost -ml-2 mb-0.5">
          <ArrowLeft className="w-6 h-6 text-text-primary" />
        </button>
        <h2 className="text-[19px] font-bold text-text-primary tracking-tight">Status</h2>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-custom">
        {/* My Status Section */}
        <div className="p-4 mt-2">
          <div 
            className="flex items-center gap-4 cursor-pointer hover:bg-bg-hover p-2 rounded-xl transition-colors"
            onClick={() => {
              if (myStatuses.length > 0) {
                onOpenViewer(groupedStatuses[currentUser._id]);
              } else {
                fileInputRef.current?.click();
              }
            }}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-bg-secondary border-2 border-border flex items-center justify-center relative">
                {myStatuses.length > 0 ? (
                  myStatuses[myStatuses.length - 1].type === 'image' ? (
                    <img src={resolveUrl(myStatuses[myStatuses.length - 1].content)} className="w-full h-full object-cover" alt="My last status" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-1 text-xs text-center text-white break-words overflow-hidden" style={{backgroundColor: myStatuses[myStatuses.length - 1].bgColor}}>
                      {myStatuses[myStatuses.length - 1].content.substring(0, 20)}
                    </div>
                  )
                ) : currentUser?.avatarUrl ? (
                  <img src={resolveUrl(currentUser.avatarUrl)} className="w-full h-full object-cover" alt="Me" />
                ) : (
                  <span className="text-xl font-bold">{currentUser?.username?.charAt(0).toUpperCase()}</span>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="absolute bottom-0 right-0 w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center border-2 border-bg-primary hover:scale-110 transition-transform cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleUploadStatus} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-text-primary font-medium text-base">My status</h3>
              <p className="text-text-muted text-sm truncate">
                {myStatuses.length > 0 ? 'Click to view' : 'Click to add status update'}
              </p>
            </div>
          </div>
        </div>

        <div className="h-2 bg-bg-secondary/50 w-full" />

        {/* Recent Updates */}
        <div className="p-4">
          <h4 className="text-text-muted text-sm font-semibold uppercase tracking-wider mb-4 px-2">Recent updates</h4>
          
          {loading ? (
             <div className="flex justify-center p-8">
               <Loader2 className="w-6 h-6 text-accent animate-spin" />
             </div>
          ) : otherUsers.length === 0 ? (
            <div className="text-center p-8 text-text-muted text-sm">
              No recent updates from your contacts.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {otherUsers.map(({ user, statuses }) => {
                const latestStatus = statuses[statuses.length - 1];
                return (
                  <div 
                    key={user._id}
                    onClick={() => onOpenViewer({ user, statuses })}
                    className="flex items-center gap-4 cursor-pointer hover:bg-bg-hover p-2 rounded-xl transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-bg-secondary ring-2 ring-accent ring-offset-2 ring-offset-bg-primary flex items-center justify-center">
                      {latestStatus.type === 'image' ? (
                        <img src={resolveUrl(latestStatus.content)} className="w-full h-full object-cover" alt={user.username} />
                      ) : latestStatus.type === 'video' ? (
                        <video src={resolveUrl(latestStatus.content)} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-1 text-[10px] text-center text-white break-words overflow-hidden" style={{backgroundColor: latestStatus.bgColor}}>
                          {latestStatus.content.substring(0, 20)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-text-primary font-medium text-base truncate">{user.displayName || user.username}</h3>
                      <p className="text-text-muted text-xs">
                        {formatPreviewTime(latestStatus.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StatusPanel;
