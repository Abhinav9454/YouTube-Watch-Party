import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  ChevronUp,
  PhoneCall,
  PhoneOff,
  MonitorUp,
  ShieldCheck,
} from 'lucide-react';
import { webrtcService, type PeerConnectionInfo } from '../services/webrtc';
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
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isDucking, setIsDucking] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<Map<string, PeerMediaState>>(new Map());
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);

  // TURN / WebRTC Network Diagnostics state
  const [connectionInfos, setConnectionInfos] = useState<PeerConnectionInfo[]>([]);
  const [showRelayModal, setShowRelayModal] = useState(false);
  const [customTurnUrl, setCustomTurnUrl] = useState(() => webrtcService.getCustomTurnConfig()?.url || '');
  const [customTurnUser, setCustomTurnUser] = useState(() => webrtcService.getCustomTurnConfig()?.username || '');
  const [customTurnPass, setCustomTurnPass] = useState(() => webrtcService.getCustomTurnConfig()?.credential || '');
  const [turnSaveSuccess, setTurnSaveSuccess] = useState(false);

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

    // Handle WebRTC Peer Connection Analytics
    const unsubConnectionInfos = webrtcService.onConnectionInfoChange((infos) => {
      setConnectionInfos(infos);
    });

    return () => {
      unsubRemote();
      unsubPeerLeft();
      unsubSpeaking();
      unsubDucking();
      unsubConnectionInfos();
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
    setIsScreenSharing(false);
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

  const handleToggleScreenShare = async () => {
    const next = await webrtcService.toggleScreenShare();
    setIsScreenSharing(next);
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

  const handleSaveCustomTurn = () => {
    if (customTurnUrl.trim()) {
      webrtcService.saveCustomTurnConfig({
        url: customTurnUrl.trim(),
        username: customTurnUser.trim() || undefined,
        credential: customTurnPass.trim() || undefined,
      });
    } else {
      webrtcService.saveCustomTurnConfig(null);
    }
    setTurnSaveSuccess(true);
    setTimeout(() => setTurnSaveSuccess(false), 2500);
  };

  const handleResetCustomTurn = () => {
    webrtcService.saveCustomTurnConfig(null);
    setCustomTurnUrl('');
    setCustomTurnUser('');
    setCustomTurnPass('');
  };

  // Helper to find username for a peerId
  const getPeerUsername = (peerId: string) => {
    const p = participants.find((item) => item.id === peerId);
    return p ? p.username : 'Friend';
  };

  const isRelayed = connectionInfos.some((c) => c.isRelayed);
  const activeLatencies = connectionInfos.map((c) => c.latencyMs).filter((l): l is number => typeof l === 'number');
  const lowestLatency = activeLatencies.length > 0 ? Math.min(...activeLatencies) : undefined;
  const activeServers = webrtcService.getActiveIceServers();

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {!inCall ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

              <button
                type="button"
                onClick={() => setShowRelayModal(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease',
                }}
                title="TURN Relay & Network Diagnostics"
              >
                <ShieldCheck size={13} color="#10b981" />
                <span className="hide-on-mobile">TURN Relay Active</span>
              </button>
            </div>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
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
                title={isVideoOn ? 'Turn Off Cam' : 'Turn On Cam'}
              >
                {isVideoOn ? <Video size={14} /> : <VideoOff size={14} />}
                <span>{isVideoOn ? 'Cam On' : 'Cam Off'}</span>
              </button>

              {/* Screen Share Toggle */}
              <button
                type="button"
                onClick={handleToggleScreenShare}
                style={{
                  background: isScreenSharing ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  border: isScreenSharing ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: isScreenSharing ? '#fbbf24' : '#a0aec0',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
                title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
              >
                <MonitorUp size={14} />
                <span>{isScreenSharing ? 'Sharing' : 'Share'}</span>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* TURN Relay / WebRTC Network Indicator Pill */}
          <button
            type="button"
            onClick={() => setShowRelayModal(true)}
            style={{
              background: isRelayed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.12)',
              border: isRelayed ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(56, 189, 248, 0.3)',
              color: isRelayed ? '#34d399' : '#38bdf8',
              borderRadius: '20px',
              padding: '4px 9px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
            title={
              inCall
                ? `Mode: ${isRelayed ? 'TURN Relay (4G/5G mobile NAT bypass)' : 'Direct P2P'}. Click for network diagnostics.`
                : 'Configure WebRTC TURN & STUN servers'
            }
          >
            <ShieldCheck size={12} color={isRelayed ? '#34d399' : '#38bdf8'} />
            <span>{inCall ? (isRelayed ? 'TURN Relay' : 'Direct P2P') : 'TURN Ready'}</span>
            {lowestLatency !== undefined && (
              <span style={{ fontSize: '10px', opacity: 0.85 }}>({lowestLatency}ms)</span>
            )}
          </button>

          {inCall && (
            <>
              {/* Audio Ducking Pill */}
              <button
                type="button"
                onClick={handleToggleDucking}
                style={{
                  background: isDucking ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: isDucking ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: isDucking ? '#fca5a5' : '#718096',
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
            </>
          )}
        </div>
      </div>

      {/* Persistent Always-on Audio Elements for all remote peers */}
      {inCall && (
        <div style={{ display: 'none' }}>
          {Array.from(remotePeers.entries()).map(([peerId, peerState]) => {
            if (!peerState.stream) return null;
            return (
              <audio
                key={peerId}
                autoPlay
                playsInline
                ref={(el) => {
                  if (el && peerState.stream) {
                    el.srcObject = peerState.stream;
                  }
                }}
              />
            );
          })}
        </div>
      )}

      {/* Video / Voice Floating Strip */}
      {inCall && !isMinimized && (
        <div
          className="cams-grid-container"
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            padding: '10px 0 2px 0',
            scrollbarWidth: 'thin',
          }}
        >
          {/* Local User Cam / Avatar Box */}
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
            {localStream && (isVideoOn || isScreenSharing) ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isScreenSharing ? 'none' : 'scaleX(-1)' }}
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
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(249, 115, 22, 0.15))',
                }}
              >
                <span>🎙️</span>
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
            const peerInfo = connectionInfos.find((c) => c.peerId === peerId);

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

                {/* Peer Relay Badge */}
                {peerInfo && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: peerInfo.isRelayed ? 'rgba(16, 185, 129, 0.85)' : 'rgba(56, 189, 248, 0.85)',
                      color: '#fff',
                      fontSize: '8px',
                      fontWeight: 700,
                      padding: '1px 4px',
                      borderRadius: '3px',
                    }}
                  >
                    {peerInfo.isRelayed ? 'TURN' : 'P2P'}
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

      {/* WebRTC TURN Server & Network Diagnostics Modal */}
      {showRelayModal && (
        <div
          className="modal-backdrop animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '16px',
          }}
          onClick={() => setShowRelayModal(false)}
        >
          <div
            className="glass-card animate-scale-up"
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: 'rgba(15, 19, 32, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(16, 185, 129, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981, #0284c7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 700 }}>
                    WebRTC TURN Relay & NAT Diagnostics
                  </h3>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                    Guarantees voice & video connection across 4G/5G mobile carriers and strict firewalls
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRelayModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Status Card */}
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#34d399' }}>
                  ● RELAY READY: {webrtcService.getRelayProvider()}
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {isRelayed ? 'Active in Call (Relayed)' : inCall ? 'Active in Call (Direct P2P)' : 'Standby'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: 1.5 }}>
                Equipped with Google STUN, Cloudflare STUN, and global OpenRelay TURN servers (UDP, TCP, and TLS port 443).
                When direct UDP punching fails on Airtel/Jio 4G/5G or university Wi-Fi, audio/video seamlessly traverses the TURN relay without dropping.
              </p>
            </div>

            {/* Active Peers Diagnostics Table (when in call) */}
            {inCall && (
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>
                  LIVE PEER CONNECTION METRICS
                </span>
                {connectionInfos.length === 0 ? (
                  <div style={{ padding: '8px', fontSize: '11px', color: '#64748b' }}>
                    Connecting to peers... Gathering ICE candidates.
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: '6px',
                      background: 'rgba(0, 0, 0, 0.25)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      overflow: 'hidden',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.04)', color: '#94a3b8', textAlign: 'left' }}>
                          <th style={{ padding: '6px 10px' }}>User</th>
                          <th style={{ padding: '6px 10px' }}>Mode</th>
                          <th style={{ padding: '6px 10px' }}>Protocol</th>
                          <th style={{ padding: '6px 10px' }}>Round-Trip</th>
                          <th style={{ padding: '6px 10px' }}>ICE State</th>
                        </tr>
                      </thead>
                      <tbody>
                        {connectionInfos.map((c) => (
                          <tr key={c.peerId} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)', color: '#e2e8f0' }}>
                            <td style={{ padding: '6px 10px', fontWeight: 600 }}>{getPeerUsername(c.peerId)}</td>
                            <td style={{ padding: '6px 10px' }}>
                              <span
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  background: c.isRelayed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                                  color: c.isRelayed ? '#34d399' : '#38bdf8',
                                }}
                              >
                                {c.isRelayed ? '🛡️ TURN Relay' : '⚡ Direct P2P'}
                              </span>
                            </td>
                            <td style={{ padding: '6px 10px', fontFamily: 'monospace' }}>{c.protocol || 'UDP'}</td>
                            <td style={{ padding: '6px 10px' }}>{c.latencyMs !== undefined ? `${c.latencyMs} ms` : '—'}</td>
                            <td style={{ padding: '6px 10px', color: '#10b981' }}>{c.iceState}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Active STUN & TURN Servers Pool */}
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>
                CONFIGURED ICE SERVERS POOL ({activeServers.length})
              </span>
              <div
                style={{
                  marginTop: '6px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  color: '#cbd5e1',
                }}
              >
                {activeServers.map((s, idx) => {
                  const urlStr = Array.isArray(s.urls) ? s.urls.join(', ') : s.urls;
                  const isTurn = urlStr.includes('turn:');
                  const isTurns = urlStr.includes('turns:');
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '9px',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          fontWeight: 700,
                          background: isTurns ? 'rgba(168, 85, 247, 0.25)' : isTurn ? 'rgba(16, 185, 129, 0.25)' : 'rgba(56, 189, 248, 0.25)',
                          color: isTurns ? '#c084fc' : isTurn ? '#34d399' : '#38bdf8',
                        }}
                      >
                        {isTurns ? 'TURNS' : isTurn ? 'TURN' : 'STUN'}
                      </span>
                      <span>{urlStr}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom TURN Configuration Drawer */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                  Optional Custom TURN Relay (Self-Hosted / Coturn / Twilio)
                </span>
                {webrtcService.getCustomTurnConfig() && (
                  <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 600 }}>Active</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="turn:my-relay.com:3478"
                  value={customTurnUrl}
                  onChange={(e) => setCustomTurnUrl(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    color: '#fff',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <input
                  type="text"
                  placeholder="Username"
                  value={customTurnUser}
                  onChange={(e) => setCustomTurnUser(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={customTurnPass}
                  onChange={(e) => setCustomTurnPass(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                <div style={{ fontSize: '11px', color: '#34d399' }}>
                  {turnSaveSuccess && '✅ Custom TURN server saved!'}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {webrtcService.getCustomTurnConfig() && (
                    <button
                      type="button"
                      onClick={handleResetCustomTurn}
                      className="btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '11px' }}
                    >
                      Reset Defaults
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveCustomTurn}
                    className="btn-primary"
                    style={{ padding: '5px 12px', fontSize: '11px' }}
                  >
                    Save Custom TURN
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
