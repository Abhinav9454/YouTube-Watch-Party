import React, { useState, useEffect, useMemo } from 'react';
import {
  PlusCircle,
  LogIn,
  Sparkles,
  Radio,
  Lock,
  Mic,
  Gift,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Zap,
  Flame,
  Check,
  History,
  LogOut,
} from 'lucide-react';
import type { RoomEntityDto } from '../types/party';
import { listRecentRoomsApi, getUserRoomsApi } from '../services/api';
import { extractYouTubeVideoId } from '../utils/youtube';
import { cleanRoomCode } from '../utils/room';
import { DiscoverModal } from './DiscoverModal';
import { AvatarCustomizer } from './AvatarCustomizer';

interface LobbyProps {
  initialRoomCode?: string;
  onJoinRoom: (roomId: string, username: string, passcode?: string) => void;
  onCreateRoom: (roomName: string, username: string, videoId: string, passcode?: string) => void;
  authUser?: { id: string; username: string; email: string; avatar: string } | null;
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
  onLogout?: () => void;
}

const PRESET_VIDEOS = [
  { title: 'Lofi Chill Beats', id: 'jfKfPfyJRdk', tag: '🎵 Music' },
  { title: 'Big Buck Bunny (4K)', id: 'aqz-KE-bpKQ', tag: '🍿 Animation' },
  { title: 'Cyberpunk Synthwave', id: '4xDzrJKXOOY', tag: '🌆 Synth' },
  { title: 'Relaxing Nature (4K)', id: 'Dx5qFachd3A', tag: '🌿 Ambient' },
];

export const Lobby: React.FC<LobbyProps> = ({
  initialRoomCode = '',
  onJoinRoom,
  onCreateRoom,
  authUser,
  onOpenAuth,
  onLogout,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [username, setUsername] = useState(
    () => authUser?.username || localStorage.getItem('watchparty_username') || `User_${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [myRooms, setMyRooms] = useState<RoomEntityDto[]>([]);

  const [roomName, setRoomName] = useState('Epic Movie Night');
  const [selectedVideo, setSelectedVideo] = useState(PRESET_VIDEOS[0].id);
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [createPasscode, setCreatePasscode] = useState('');
  const [requirePasscode, setRequirePasscode] = useState(false);

  const [joinCode, setJoinCode] = useState(initialRoomCode);
  const [joinPasscode, setJoinPasscode] = useState('');
  const [persistedRooms, setPersistedRooms] = useState<RoomEntityDto[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isDiscoverOpen, setIsDiscoverOpen] = useState(false);

  const activeVideoId = useMemo(() => {
    return extractYouTubeVideoId(customVideoUrl.trim() || selectedVideo);
  }, [customVideoUrl, selectedVideo]);

  const detectedJoinCode = useMemo(() => {
    return cleanRoomCode(joinCode);
  }, [joinCode]);

  useEffect(() => {
    if (initialRoomCode) {
      setJoinCode(cleanRoomCode(initialRoomCode));
      setTab('join');
    }
  }, [initialRoomCode]);

  useEffect(() => {
    localStorage.setItem('watchparty_username', username);
  }, [username]);

  useEffect(() => {
    if (authUser && authUser.username) {
      setUsername(authUser.username);
      getUserRoomsApi(authUser.username)
        .then((rooms) => setMyRooms(rooms))
        .catch(() => {});
    } else {
      setMyRooms([]);
    }
  }, [authUser]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const rooms = await listRecentRoomsApi();
        setPersistedRooms(rooms);
      } catch {
        // Fallback gracefully
      }
    };
    fetchRooms();
  }, []);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalVideo = activeVideoId;
    const finalPasscode = requirePasscode && createPasscode.trim() ? createPasscode.trim() : undefined;
    onCreateRoom(roomName.trim() || 'Watch Party', username.trim() || 'Host', finalVideo, finalPasscode);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCode = detectedJoinCode;
    if (!finalCode) return;
    const finalPasscode = joinPasscode.trim() ? joinPasscode.trim() : undefined;
    onJoinRoom(finalCode, username.trim() || 'Viewer', finalPasscode);
  };

  const handleQuickJoinRoom = (roomId: string, isPasscodeProtected?: boolean) => {
    if (isPasscodeProtected) {
      setJoinCode(roomId);
      setTab('join');
      document.getElementById('launcher-card')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      onJoinRoom(roomId, username.trim() || 'Viewer');
    }
  };

  const faqs = [
    {
      q: 'Do friends need to download apps or install extensions to join?',
      a: 'No downloads, extensions, or accounts needed. Friends simply open your watch party link on Chrome, Firefox, Safari, or Edge on mobile or desktop to join immediately with instant sync.',
    },
    {
      q: 'How does playback stay in exact millisecond synchronization?',
      a: 'SyncWave uses an authoritative timestamp consensus model powered by WebSockets. Whenever someone plays, pauses, seeks, or changes speed, the exact position is synchronized across all viewers in <15 milliseconds.',
    },
    {
      q: 'Can we talk and see each other while watching?',
      a: 'Yes! SyncWave has a built-in WebRTC Mesh voice and video call grid. It also includes automatic YouTube audio ducking: when someone speaks, the video volume softly lowers so voices remain crystal clear.',
    },
    {
      q: 'What are Virtual Flying Snacks and Synchronized Trivia?',
      a: 'You can toss animated 3D popcorn, pizza, soda, and confetti across everyone’s screens. Hosts can also trigger 15-second timed trivia quizzes to challenge friends and climb the party leaderboard.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '64px', paddingBottom: '60px' }}>
      {/* 1. HERO SECTION WITH INTEGRATED LAUNCHER */}
      <section
        style={{
          position: 'relative',
          padding: '48px 20px 10px 20px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Ambient Top Glow */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '650px',
            height: '350px',
            background: 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.14) 0%, rgba(220, 38, 38, 0.04) 50%, transparent 75%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            borderRadius: '9999px',
            background: 'rgba(239, 68, 68, 0.10)',
            border: '1px solid rgba(239, 68, 68, 0.28)',
            marginBottom: '20px',
          }}
        >
          <Sparkles size={14} color="#f87171" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#fecaca' }}>
            Next-Gen YouTube Watch Party • Zero Install • 100% Free
          </span>
        </div>

        {/* Main Headline */}
        <h1
          style={{
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-1.5px',
            color: '#fff',
            maxWidth: '850px',
            margin: '0 0 16px 0',
          }}
        >
          Watch YouTube Together.{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #ff2a2a 0%, #f97316 60%, #e11d48 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            In Real-Time Sync.
          </span>
        </h1>

        {/* Subhead */}
        <p
          style={{
            fontSize: 'clamp(0.95rem, 1.6vw, 1.15rem)',
            color: '#94a3b8',
            maxWidth: '650px',
            margin: '0 0 36px 0',
            lineHeight: 1.6,
          }}
        >
          Connect with friends anywhere. Sub-second video synchronization, WebRTC voice & video, live emoji reactions, and trivia battles.
        </p>

        {/* 2. THE LAUNCHER CARD (FRONT & CENTER) */}
        <div
          id="launcher-card"
          className="glass-panel lobby-card"
          style={{
            maxWidth: '560px',
            width: '100%',
            padding: '28px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 30px rgba(239, 68, 68, 0.12)',
            background: 'rgba(15, 20, 32, 0.94)',
            textAlign: 'left',
          }}
        >
          {/* Account Status / Sign In Callout */}
          {authUser ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(168, 85, 247, 0.15))',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ef4444, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: '#fff',
                    fontSize: '14px',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                  }}
                >
                  {authUser.avatar || authUser.username[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 800, color: '#fff', fontSize: '13px' }}>{authUser.username}</span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        background: 'rgba(239, 68, 68, 0.25)',
                        color: '#fca5a5',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '999px',
                        padding: '1px 7px',
                      }}
                    >
                      ⭐ Verified Host
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {authUser.email || 'Cloud Synced Profile'}
                  </div>
                </div>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#cbd5e1',
                    padding: '5px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                  title="Sign out"
                >
                  <LogOut size={13} />
                  <span>Sign out</span>
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px dashed rgba(255, 255, 255, 0.16)',
                borderRadius: '12px',
                padding: '9px 13px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={14} color="#f59e0b" />
                <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  Save your parties & get a verified host badge!
                </span>
              </div>
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={() => onOpenAuth('signin')}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <LogIn size={13} />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          )}

          {/* Identity Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.5px' }}>
                Your Screen Name
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your screen name"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '14px',
                    width: '190px',
                  }}
                />
              </div>
            </div>

            <AvatarCustomizer currentUsername={username} />
          </div>

          {/* Tab Switcher */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '22px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <button
              type="button"
              onClick={() => setTab('create')}
              style={{
                flex: 1,
                padding: '9px',
                border: 'none',
                borderRadius: '8px',
                background: tab === 'create' ? 'linear-gradient(135deg, #ff2a2a, #dc2626)' : 'transparent',
                color: tab === 'create' ? '#fff' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              <PlusCircle size={16} /> Create Party
            </button>
            <button
              type="button"
              onClick={() => setTab('join')}
              style={{
                flex: 1,
                padding: '9px',
                border: 'none',
                borderRadius: '8px',
                background: tab === 'join' ? 'linear-gradient(135deg, #ff2a2a, #dc2626)' : 'transparent',
                color: tab === 'join' ? '#fff' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              <LogIn size={16} /> Join With Code
            </button>
          </div>

          {tab === 'create' ? (
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e0', marginBottom: '6px', fontWeight: 600 }}>
                  Party Title
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Friday Movie Night, Chill Beats..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e0', fontWeight: 600 }}>
                    Starting YouTube Video
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsDiscoverOpen(true)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '6px',
                      padding: '3px 9px',
                      color: '#fca5a5',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.28)';
                      e.currentTarget.style.borderColor = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
                    }}
                  >
                    <Sparkles size={11} color="#f87171" />
                    <span>Browse 32+ Videos</span>
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '10px' }}>
                  {PRESET_VIDEOS.map((vid) => {
                    const isSelected = selectedVideo === vid.id && !customVideoUrl;
                    return (
                      <div
                        key={vid.id}
                        onClick={() => {
                          setSelectedVideo(vid.id);
                          setCustomVideoUrl('');
                        }}
                        style={{
                          padding: '8px 10px',
                          background: isSelected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          border: isSelected ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? '#fff' : '#cbd5e1' }}>
                          {vid.tag} {vid.title}
                        </span>
                        {isSelected && <CheckCircle2 size={13} color="#f87171" />}
                      </div>
                    );
                  })}
                </div>

                <input
                  type="text"
                  className="input-field"
                  value={customVideoUrl}
                  onChange={(e) => setCustomVideoUrl(e.target.value)}
                  placeholder="Or paste YouTube link / ID..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '13px' }}
                />
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={14} color={requirePasscode ? '#ef4444' : '#94a3b8'} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>Passcode Protect Room</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={requirePasscode}
                    onChange={(e) => setRequirePasscode(e.target.checked)}
                    style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#ef4444' }}
                  />
                </div>

                {requirePasscode && (
                  <div style={{ marginTop: '8px' }}>
                    <input
                      type="password"
                      className="input-field"
                      value={createPasscode}
                      onChange={(e) => setCreatePasscode(e.target.value)}
                      placeholder="Set room password..."
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{
                  padding: '13px',
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px',
                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
                }}
              >
                <Sparkles size={17} />
                <span>Launch Watch Party Now</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e0', marginBottom: '6px', fontWeight: 600 }}>
                  Enter Room Code or Paste Party Link
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  onBlur={() => {
                    const cleaned = cleanRoomCode(joinCode);
                    if (cleaned && cleaned.length >= 4) {
                      setJoinCode(cleaned);
                    }
                  }}
                  placeholder="e.g. QHSDHXSBRN or paste party link..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    fontSize: '1.15rem',
                    letterSpacing: '2px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    textAlign: 'center',
                  }}
                />
                {detectedJoinCode && detectedJoinCode.length >= 4 && (
                  <div style={{ marginTop: '6px', fontSize: '12px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Check size={13} />
                    <span>Ready to join room: <strong>{detectedJoinCode}</strong></span>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e0', marginBottom: '6px', fontWeight: 600 }}>
                  Room Passcode (If required by host)
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={joinPasscode}
                  onChange={(e) => setJoinPasscode(e.target.value)}
                  placeholder="Enter passcode if protected..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '13px' }}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={!detectedJoinCode}
                style={{
                  padding: '13px',
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px',
                  opacity: detectedJoinCode ? 1 : 0.6,
                }}
              >
                <LogIn size={17} />
                <span>Enter Room Now</span>
              </button>
            </form>
          )}
        </div>
      </section>

      {/* 3. PLATFORM HIGHLIGHT STATS */}
      <section
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '0 20px',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            padding: '18px 24px',
            background: 'rgba(18, 24, 38, 0.65)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8' }}>&lt; 15 ms</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Sync Precision Drift</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>100% Free</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Zero Downloads or Extensions</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f87171' }}>WebRTC Mesh</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Live Voice & Video Calls</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b' }}>Instant Share</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Link & Phone Camera QR</span>
          </div>
        </div>
      </section>

      {/* 3.5. MY SAVED WATCH PARTIES (PERSISTED FOR THIS HOST) */}
      {myRooms && myRooms.length > 0 && (
        <section
          id="my-saved-parties"
          style={{
            maxWidth: '1200px',
            margin: '0 auto 40px auto',
            padding: '0 24px',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} color="#a855f7" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                My Saved Watch Parties
              </h2>
              <span
                style={{
                  background: 'rgba(168, 85, 247, 0.2)',
                  color: '#c084fc',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '999px',
                  padding: '2px 8px',
                }}
              >
                {myRooms.length} {myRooms.length === 1 ? 'room' : 'rooms'}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            {myRooms.map((room) => (
              <div
                key={room.roomId}
                className="glass-panel glass-panel-interactive"
                style={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  background: 'rgba(20, 15, 30, 0.75)',
                }}
              >
                <div style={{ height: '130px', position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={`https://img.youtube.com/vi/${room.currentVideoId || 'jfKfPfyJRdk'}/mqdefault.jpg`}
                    alt={room.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(4px)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#c084fc',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    ⭐ Host: {room.creatorUsername || username}
                  </div>
                  {Boolean(room.passcode) && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(239, 68, 68, 0.85)',
                        backdropFilter: 'blur(4px)',
                        padding: '3px 6px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Lock size={10} /> Locked
                    </div>
                  )}
                </div>

                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '15px',
                      color: '#fff',
                      marginBottom: '6px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {room.name}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>Code:</span>
                    <code
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        color: '#38bdf8',
                        fontWeight: 700,
                      }}
                    >
                      {room.roomId}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => onJoinRoom(room.roomId, username)}
                    style={{
                      marginTop: 'auto',
                      padding: '9px',
                      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <LogIn size={14} /> Resume Watch Party
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. ACTIVE PUBLIC WATCH PARTIES (IF ANY) */}
      {persistedRooms && persistedRooms.length > 0 && (
        <section
          id="public-parties"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} color="#f43f5e" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Active Public Rooms
              </h2>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            {persistedRooms.slice(0, 4).map((room) => (
              <div
                key={room.roomId}
                className="glass-panel glass-panel-interactive"
                style={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ height: '130px', position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={`https://img.youtube.com/vi/${room.currentVideoId || 'jfKfPfyJRdk'}/mqdefault.jpg`}
                    alt={room.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: 'rgba(0, 0, 0, 0.75)',
                      padding: '2px 7px',
                      borderRadius: '5px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Radio size={10} color="#10b981" /> LIVE
                  </div>
                </div>

                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {room.name}
                    </h3>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Host: <strong style={{ color: '#fff' }}>{room.creatorUsername}</strong>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#fca5a5', fontWeight: 700 }}>
                      #{room.roomId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuickJoinRoom(room.roomId, !!room.passcode)}
                      style={{
                        padding: '5px 12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#fecaca',
                        cursor: 'pointer',
                      }}
                    >
                      Join Room
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. CORE FEATURES */}
      <section
        id="features"
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 24px',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>
            Everything You Need For The Perfect Movie Night
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Modern features engineered for seamless video streaming with friends
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
          }}
        >
          {[
            {
              icon: <Zap size={22} color="#38bdf8" />,
              title: 'Sub-Second Sync',
              desc: 'Authoritative timestamp consensus maintains <15ms drift so everyone laughs at the exact same joke.',
            },
            {
              icon: <Mic size={22} color="#ef4444" />,
              title: 'WebRTC Voice & Cam',
              desc: 'Talk and see your friends with built-in auto-ducking that lowers YouTube audio when someone speaks.',
            },
            {
              icon: <Gift size={22} color="#f43f5e" />,
              title: 'Interactive Virtual Snacks',
              desc: 'Toss popcorn, pizza, soda, and party confetti across everyone’s screens with smooth visual animations.',
            },
            {
              icon: <Sparkles size={22} color="#f59e0b" />,
              title: 'Synchronized Trivia',
              desc: 'Challenge the room with 15-second timed trivia questions, earn XP, and climb the live leaderboard.',
            },
          ].map((feat, idx) => (
            <div
              key={idx}
              className="glass-panel"
              style={{
                padding: '22px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {feat.icon}
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>
                {feat.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section
        id="faq"
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 24px',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            Got questions? We’ve got answers.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="glass-panel"
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={16} color="#ef4444" /> : <ChevronDown size={16} color="#94a3b8" />}
                </button>
                {isOpen && (
                  <div
                    style={{
                      padding: '0 18px 14px 18px',
                      fontSize: '13px',
                      color: '#94a3b8',
                      lineHeight: 1.6,
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Discover Modal for Lobby Video Selection */}
      <DiscoverModal
        isOpen={isDiscoverOpen}
        onClose={() => setIsDiscoverOpen(false)}
        userRole="HOST"
        onSelectVideo={(id) => {
          setSelectedVideo(id);
          setCustomVideoUrl('');
          setIsDiscoverOpen(false);
        }}
      />
    </div>
  );
};
