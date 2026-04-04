import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const CallContext = createContext(null);

export const useCall = () => {
  return useContext(CallContext);
};

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { currentUser } = useAuth();

  const [callState, setCallState] = useState('idle'); // idle, calling, ringing, connected
  const [callPartner, setCallPartner] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [incomingSignal, setIncomingSignal] = useState(null);
  
  const peerConnection = useRef(null);
  const partnerId = useRef(null);

  // Configuration for STUN servers
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('incomingCall', async ({ signal, from, callerInfo }) => {
      // If already in a call, reject it or handle busy state
      if (callState !== 'idle') {
        socket.emit('rejectCall', { to: from });
        return;
      }
      partnerId.current = from;
      setCallPartner(callerInfo);
      setIncomingSignal(signal);
      setCallState('ringing');
    });

    socket.on('callAccepted', async ({ signal }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
        setCallState('connected');
      }
    });

    socket.on('iceCandidate', async ({ candidate }) => {
      if (peerConnection.current && candidate) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding received ice candidate", e);
        }
      }
    });

    socket.on('callRejected', () => {
      cleanupCall();
    });

    socket.on('callEnded', () => {
      cleanupCall();
    });

    return () => {
      socket.off('incomingCall');
      socket.off('callAccepted');
      socket.off('iceCandidate');
      socket.off('callRejected');
      socket.off('callEnded');
    };
  }, [socket, callState]);

  const initPeerConnection = () => {
    const pc = new RTCPeerConnection(rtcConfig);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && partnerId.current) {
        socket.emit('iceCandidate', { 
          to: partnerId.current, 
          candidate: event.candidate 
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupCall();
      }
    };

    return pc;
  };

  const getMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to get media stream', err);
      return null;
    }
  };

  const initiateCall = async (userToCall) => {
    partnerId.current = userToCall._id;
    setCallPartner(userToCall);
    setCallState('calling');

    const stream = await getMediaStream();
    if (!stream) {
      cleanupCall();
      return;
    }

    const pc = initPeerConnection();
    peerConnection.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit('callUser', {
      userToCall: userToCall._id,
      signalData: offer,
      callerInfo: {
        _id: currentUser._id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatarUrl: currentUser.avatarUrl
      }
    });
  };

  const answerCall = async () => {
    const stream = await getMediaStream();
    if (!stream) {
      rejectCall();
      return;
    }

    const pc = initPeerConnection();
    peerConnection.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('answerCall', { to: partnerId.current, signal: answer });
    setCallState('connected');
  };

  const rejectCall = () => {
    if (partnerId.current) {
      socket.emit('rejectCall', { to: partnerId.current });
    }
    cleanupCall();
  };

  const endCall = () => {
    if (partnerId.current) {
      socket.emit('endCall', { to: partnerId.current });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallPartner(null);
    partnerId.current = null;
    setIncomingSignal(null);
    setCallState('idle');
    setIsMuted(false);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const contextValue = {
    callState,
    callPartner,
    localStream,
    remoteStream,
    isMuted,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute
  };

  return (
    <CallContext.Provider value={contextValue}>
      {children}
    </CallContext.Provider>
  );
};
