import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Sparkles, ChevronDown, ChevronUp, PhoneCall, PhoneOff } from 'lucide-react';
import { webrtcService } from '../services/webrtc';
import type { Participant } from '../types/party';

interface VoiceVideoOverlayProps {
  currentUserId: string;
  currentUsername: string;
  participants: Participant[];
  onDuckVolume?: (duck: boolean) => void;
}

interface PeerMediaState {
  stream?: MediaStream;
  isSpeaking: boolean;
  isAudioMuted: boolean;
  isVideoEnabled: boolean;
}

export const VoiceVideoOverlay: React.FC<VoiceVideoOverlayProps> = ({
  currentUserId,
  currentUsername,
  participants,
  onDuckVolume,
}) => {
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isDucking, setIsDucking] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<Map<string, PeerMediaState>>(new Map());
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOn]);

  useEffect(() => {
    // Listen for remote streams
    const unsubRemote = webrtcService.onRemoteStream((peerId, stream) => {
      setRemotePeers((prev) => {
        const next = new Map(prev);
        const existing = next.get(peerId) || { isSpeaking: false, isAudioMuted: false, isVideoEnabled: false };
        existing.stream = stream;
        existing.isVideoEnabled = stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled;
        next.set(peerId, existing);
        return next;
      });
    });

    const unsubPeerLeft = webrtcService.onPeerLeft((peerId) => {
      setRemotePeers((prev) => {
        const next = new Map(prev);
        next.delete(peerId);
        return next;
      });
    });

    const unsubSpeaking = webrtcService.onSpeakingChange((peerId, speaking) => {
      if (peerId === 'local') {
        setIsLocalSpeaking(speaking);
      } else {
        setRemotePeers((prev) => {
          const next = new Map(prev);
          const existing = next.get(peerId);
          if (existing) {
            existing.isSpeaking = speaking;
            next.set(peerId, { ...existing });
          }
          return next;
        });
      }
    });

    // Handle Audio Ducking
    const unsubDucking = webrtcService.onAudioDucking((shouldDuck) => {
      if (onDuckVolume && isDucking) {
        onDuckVolume(shouldDuck);
      }
    });

    return () => {
      unsubRemote();
      unsubPeerLeft();
      unsubSpeaking();
      unsubDucking();
    };
  }, [onDuckVolume, isDucking]);

  const handleJoinCall = async () => {
    const stream = await webrtcService.startMedia(false);
    if (stream) {
      setLocalStream(stream);
      setInCall(true);
      setIsMuted(false);
      setIsVideoOn(false);

      // Call other participants in the room
      participants.forEach((p) => {
        if (p.id !== currentUserId) {
          webrtcService.callPeer(p.id);
        }
      });
    }
  };

  const handleLeaveCall = () => {
    webrtcService.stopMedia();
    setLocalStream(null);
    setInCall(false);
    setRemotePeers(new Map());
  };

  const handleToggleMute = () => {
    const next = webrtcService.toggleMute();
    setIsMuted(next);
  };

  const handleToggleVideo = async () => {
    const next = await webrtcService.toggleVideo();
    setIsVideoOn(next);
  };

  const handleToggleDeafen = () => {
    const next = webrtcService.toggleDeafen();
    setIsDeafened(next);
  };

  const handleToggleDucking = () => {
    const next = !isDucking;
    setIsDucking(next);
    webrtcService.setAudioDucking(next);
  };

  // Helper to find username for a peerId
  const getPeerUsername = (peerId: string) => {
    const p = participants.find((item) => item.id === peerId);
    return p ? p.username : 'Friend';
  };

  return (
    <div
      className="voice-video-overlay"
      style={{
        position: 'relative',
        width: '100%',
        marginTop: '8px',
      }}
    >
      {/* Control Dock Bar */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          background: 'rgba(15, 18, 28, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          padding: '8px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!inCall ? (
            <button
              type="button"
              onClick={handleJoinCall}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              <PhoneCall size={14} />
              <span>Join Voice & Cam</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLeaveCall}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '6px 12px',
                color: '#ef4444',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <PhoneOff size={14} />
              <span>Leave Call</span>
            </button>
          )}

          {inCall && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Mic Toggle */}
              <button
                type="button"
                onClick={handleToggleMute}
                style={{
                  background: isMuted ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.2)',
                  border: isMuted ? '1px solid #ef4444' : '1px solid #10b981',
                  color: isMuted ? '#ef4444' : '#10b981',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                <span>{isMuted ? 'Muted' : 'Mic On'}</span>
              </button>

              {/* Video Toggle */}
              <button
                type="button"
                onClick={handleToggleVideo}
                style={{
                  background: isVideoOn ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  border: isVideoOn ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: isVideoOn ? '#38bdf8' : '#a0aec0',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
                title={isVideoOn ? 'Turn Video Off' : 'Turn Video On'}
              >
                {isVideoOn ? <Video size={14} /> : <VideoOff size={14} />}
                <span>{isVideoOn ? 'Cam On' : 'Cam Off'}</span>
              </button>

              {/* Deafen Toggle */}
              <button
                type="button"
                onClick={handleToggleDeafen}
                style={{
                  background: isDeafened ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  border: isDeafened ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: isDeafened ? '#ef4444' : '#a0aec0',
                  borderRadius: '8px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                }}
                title={isDeafened ? 'Undeafen (Hear Friends)' : 'Deafen (Mute Friends)'}
              >
                {isDeafened ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          )}
        </div>

        {inCall && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Audio Ducking Pill */}
            <button
              type="button"
              onClick={handleToggleDucking}
              style={{
                background: isDucking ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: isDucking ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.1)',
                color: isDucking ? '#818cf8' : '#718096',
                borderRadius: '20px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Automatically lowers YouTube volume when someone talks"
            >
              <Sparkles size={12} />
              <span>Ducking: {isDucking ? 'Active' : 'Off'}</span>
            </button>

            {/* Minimize / Expand Grid */}
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              style={{
                background: 'none',
                border: 'none',
                color: '#a0aec0',
                cursor: 'pointer',
                padding: '4px',
              }}
              title={isMinimized ? 'Show Video Cams' : 'Hide Video Cams'}
            >
              {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        )}
      </div>

      {/* Persistent Always-on Audio Elements for all remote peers */}
      {inCall && (
        <div style={{ display: 'none' }}>
          {Array.from(remotePeers.entries()).map(([peerId, peerState]) => {
            if (!peerState.stream) return null;
            return (
              <audio
                key={`audio-${peerId}`}
                autoPlay
                playsInline
                ref={(el) => {
                  if (el && peerState.stream) {
                    if (el.srcObject !== peerState.stream) {
                      el.srcObject = peerState.stream;
                    }
                    el.muted = isDeafened;
                  }
                }}
              />
            );
          })}
        </div>
      )}

      {/* Floating Video Cams Grid (When in Call and Not Minimized) */}
      {inCall && !isMinimized && (
        <div
          className="cams-grid animate-fade-in"
          style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            paddingTop: '8px',
            paddingBottom: '4px',
          }}
        >
          {/* Local User Box */}
          <div
            className="cam-box glass-card"
            style={{
              position: 'relative',
              width: '130px',
              height: '85px',
              background: '#0f121d',
              borderRadius: '10px',
              overflow: 'hidden',
              flexShrink: 0,
              border: isLocalSpeaking ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: isLocalSpeaking ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {isVideoOn ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(255, 75, 43, 0.2))',
                }}
              >
                <span>👤</span>
              </div>
            )}

            <div
              style={{
                position: 'absolute',
                bottom: '4px',
                left: '6px',
                right: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.65)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              <span style={{ fontSize: '10px', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                You ({currentUsername})
              </span>
              {isMuted && <span style={{ color: '#ef4444', fontSize: '10px' }}>🔇</span>}
            </div>
          </div>

          {/* Remote Peers Boxes */}
          {Array.from(remotePeers.entries()).map(([peerId, peerState]) => {
            const peerName = getPeerUsername(peerId);

            return (
              <div
                key={peerId}
                className="cam-box glass-card"
                style={{
                  position: 'relative',
                  width: '130px',
                  height: '85px',
                  background: '#0f121d',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: peerState.isSpeaking ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: peerState.isSpeaking ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {peerState.stream && peerState.isVideoEnabled ? (
                  <video
                    autoPlay
                    muted
                    playsInline
                    ref={(el) => {
                      if (el && peerState.stream) {
                        el.srcObject = peerState.stream;
                        remoteVideoRefs.current.set(peerId, el);
                      }
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(16, 185, 129, 0.15))',
                    }}
                  >
                    <span>👥</span>
                  </div>
                )}

                <div
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '6px',
                    right: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(0, 0, 0, 0.65)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  <span style={{ fontSize: '10px', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {peerName}
                  </span>
                  {peerState.isAudioMuted && <span style={{ color: '#ef4444', fontSize: '10px' }}>🔇</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
