import React, { useState, useEffect, useMemo } from 'react';
import {
  PlusCircle,
  LogIn,
  Sparkles,
  Radio,
  Users,
  Lock,
  Key,
  Mic,
  Gift,
  HelpCircle,
  Sliders,
  Subtitles,
  BarChart3,
  Play,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';
import type { RoomEntityDto } from '../types/party';
import { listRecentRoomsApi } from '../services/api';

interface LobbyProps {
  initialRoomCode?: string;
  onJoinRoom: (roomId: string, username: string, passcode?: string) => void;
  onCreateRoom: (roomName: string, username: string, videoId: string, passcode?: string) => void;
}

const FEATURED_VIDEOS = [
  { title: 'Lofi Hip Hop Radio - Beats to Relax/Study', id: 'jfKfPfyJRdk', badge: 'Music' },
  { title: 'Big Buck Bunny (4K Animation Classic)', id: 'aqz-KE-bpKQ', badge: 'Movie' },
  { title: 'Cyberpunk Synthwave 80s Chill Mix', id: '4xDzrJKXOOY', badge: 'Mix' },
  { title: 'Relaxing Jazz Coffee Shop Ambience', id: 'Dx5qFachd3A', badge: 'Ambient' },
];

function extractYouTubeId(urlOrId: string): string {
  if (!urlOrId) return 'jfKfPfyJRdk';
  const trimmed = urlOrId.trim();
  if (trimmed.length === 11 && !trimmed.includes('/') && !trimmed.includes('?')) {
    return trimmed;
  }
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : trimmed;
}

export const Lobby: React.FC<LobbyProps> = ({
  initialRoomCode = '',
  onJoinRoom,
  onCreateRoom,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [username, setUsername] = useState(
    () => localStorage.getItem('watchparty_username') || `User_${Math.floor(1000 + Math.random() * 9000)}`
  );

  const [roomName, setRoomName] = useState('Epic Movie Night');
  const [selectedVideo, setSelectedVideo] = useState(FEATURED_VIDEOS[0].id);
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [createPasscode, setCreatePasscode] = useState('');
  const [requirePasscode, setRequirePasscode] = useState(false);

  const [joinCode, setJoinCode] = useState(initialRoomCode);
  const [joinPasscode, setJoinPasscode] = useState('');
  const [persistedRooms, setPersistedRooms] = useState<RoomEntityDto[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const activeVideoId = useMemo(() => {
    return extractYouTubeId(customVideoUrl.trim() || selectedVideo);
  }, [customVideoUrl, selectedVideo]);

  useEffect(() => {
    if (initialRoomCode) {
      setJoinCode(initialRoomCode);
      setTab('join');
    }
  }, [initialRoomCode]);

  useEffect(() => {
    localStorage.setItem('watchparty_username', username);
  }, [username]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const rooms = await listRecentRoomsApi();
        setPersistedRooms(rooms);
      } catch {
        // ignore
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
    if (joinCode.trim()) {
      onJoinRoom(joinCode.trim().toUpperCase(), username.trim() || 'Guest', joinPasscode.trim() || undefined);
    }
  };

  const handleQuickDemo = () => {
    onCreateRoom('✨ Demo Party Room', username.trim() || 'DemoUser', 'jfKfPfyJRdk', undefined);
  };

  const faqs = [
    {
      q: 'How does real-time millisecond playback synchronization work?',
      a: 'The Spring Boot backend maintains a central high-precision clock reference. When any host seeks, plays, or pauses, timestamps and playback states are pushed instantly over persistent low-latency WebSockets, synchronizing every peer down to fractions of a second.',
    },
    {
      q: 'Do friends need to install software or sign up?',
      a: 'No! There are no extensions or account signups needed. Friends simply click your invite link, scan your room QR code on mobile, or enter your 6-letter room code in their browser to jump straight in.',
    },
    {
      q: 'How does Voice Chat & WebRTC audio ducking work?',
      a: 'Voice and video are handled peer-to-peer using in-browser WebRTC with STUN signaling. When a friend speaks, our Voice Activity Detector (VAD) automatically ducks (lowers) the YouTube volume so everyone can hear them clearly without talking over the video.',
    },
    {
      q: 'Can I upload custom subtitles or repeat favorite video clips?',
      a: 'Yes! You can drag and drop any .SRT or .VTT subtitle file with adjustable millisecond sync offset, and use the A-B Segment Repeat Looper to effortlessly loop music video choruses, anime intros, or tutorial steps.',
    },
  ];

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '30px auto 60px auto',
        padding: '0 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '48px',
      }}
    >
      {/* Hero Section */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: '#a5b4fc',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            <Sparkles size={14} /> Sub-Millisecond YouTube Sync
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.35)',
              color: '#4ade80',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            <Zap size={14} /> WebRTC P2P Voice & Cam
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              color: '#facc15',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            <Lock size={14} /> 100% Free & No Sign-up
          </div>
        </div>

        <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.15, margin: 0 }}>
          Watch YouTube Together, <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #38bdf8 50%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Exact Sync • Live Voice • Interactive Fun
          </span>
        </h1>

        <p style={{ color: 'var(--text-muted)', maxWidth: '620px', fontSize: '1.1rem', margin: 0, lineHeight: 1.5 }}>
          Create private or public rooms with synchronized YouTube playback, peer-to-peer voice & webcam, flying animated snacks, live trivia competitions, audio equalizers, and subtitles.
        </p>

        {/* 1-Click Instant Demo Button */}
        <button
          type="button"
          onClick={handleQuickDemo}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4), 0 0 15px rgba(168, 85, 247, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Play size={16} />
          <span>Launch Instant Watch Party (1-Click Demo)</span>
        </button>
      </div>

      {/* Main Room Creator & Joiner Card */}
      <div
        className="glass-panel"
        style={{
          maxWidth: '680px',
          width: '100%',
          margin: '0 auto',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.15)',
          borderRadius: '18px',
        }}
      >
        {/* Username Field */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e0', marginBottom: '6px', fontWeight: 600 }}>
            Your Display Name
          </label>
          <input
            type="text"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your nickname..."
            required
            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
          />
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '10px',
            padding: '4px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            type="button"
            onClick={() => setTab('create')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              background: tab === 'create' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              color: tab === 'create' ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <PlusCircle size={16} /> Create Watch Party
          </button>
          <button
            type="button"
            onClick={() => setTab('join')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              background: tab === 'join' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              color: tab === 'join' ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.92rem',
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

        {/* CREATE TAB */}
        {tab === 'create' ? (
          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e0', marginBottom: '6px', fontWeight: 600 }}>
                Party Title
              </label>
              <input
                type="text"
                className="input-field"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. Friday Movie Night, Chill Beats Session..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
              />
            </div>

            {/* Video Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e0', marginBottom: '8px', fontWeight: 600 }}>
                Choose Starting Video
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
                {FEATURED_VIDEOS.map((vid) => {
                  const isSelected = selectedVideo === vid.id && !customVideoUrl;
                  return (
                    <div
                      key={vid.id}
                      onClick={() => {
                        setSelectedVideo(vid.id);
                        setCustomVideoUrl('');
                      }}
                      style={{
                        padding: '10px 12px',
                        background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase' }}>
                          {vid.badge}
                        </span>
                        {isSelected && <CheckCircle2 size={13} color="#6366f1" />}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {vid.title}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom YouTube URL */}
              <div>
                <input
                  type="text"
                  className="input-field"
                  value={customVideoUrl}
                  onChange={(e) => setCustomVideoUrl(e.target.value)}
                  placeholder="Or paste any YouTube Video URL / ID..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                />
              </div>

              {/* Live Thumbnail Preview */}
              {activeVideoId && (
                <div
                  style={{
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                  }}
                >
                  <img
                    src={`https://img.youtube.com/vi/${activeVideoId}/mqdefault.jpg`}
                    alt="Video thumbnail preview"
                    style={{ width: '70px', height: '42px', borderRadius: '6px', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                      Ready to Stream
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      YouTube ID: {activeVideoId}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Room Passcode Toggle */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={requirePasscode}
                  onChange={(e) => setRequirePasscode(e.target.checked)}
                  style={{ accentColor: '#6366f1' }}
                />
                <span style={{ fontSize: '12px', color: '#cbd5e0', fontWeight: 600 }}>
                  🔒 Protect Room with Secret Passcode (Optional)
                </span>
              </label>

              {requirePasscode && (
                <input
                  type="password"
                  className="input-field animate-fade-in"
                  value={createPasscode}
                  onChange={(e) => setCreatePasscode(e.target.value)}
                  placeholder="Enter secret passcode..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px' }}
                />
              )}
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: '12px',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '10px',
                gap: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PlusCircle size={18} /> Create & Enter Party Room
            </button>
          </form>
        ) : (
          /* JOIN TAB */
          <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e0', marginBottom: '6px', fontWeight: 600 }}>
                Room Code
              </label>
              <input
                type="text"
                className="input-field"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g., A7X9Q2"
                required
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', fontSize: '18px', fontWeight: 800, letterSpacing: '2px', fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e0', marginBottom: '6px', fontWeight: 600 }}>
                Passcode (If Room is Locked)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="input-field"
                  value={joinPasscode}
                  onChange={(e) => setJoinPasscode(e.target.value)}
                  placeholder="Leave empty if public..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                />
                <Key size={16} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: '12px',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '10px',
                gap: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LogIn size={18} /> Join Room Now
            </button>
          </form>
        )}
      </div>

      {/* Active Public Rooms in Database */}
      {persistedRooms.length > 0 && (
        <div style={{ maxWidth: '850px', width: '100%', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Radio size={18} color="#10b981" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Live Public Rooms in Database ({persistedRooms.length})
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {persistedRooms.map((room) => (
              <div
                key={room.roomId}
                className="glass-panel"
                style={{
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '2px' }}>
                      {room.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Host: {room.creatorUsername || 'Host'}
                    </div>
                  </div>
                  {room.passcode && (
                    <span
                      title="Password protected"
                      style={{
                        padding: '3px 6px',
                        background: 'rgba(234, 179, 8, 0.15)',
                        border: '1px solid rgba(234, 179, 8, 0.3)',
                        borderRadius: '6px',
                        color: '#facc15',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Lock size={11} /> Pass
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                    #{room.roomId}
                  </span>
                  <button
                    type="button"
                    onClick={() => onJoinRoom(room.roomId, username)}
                    className="btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '12px', gap: '4px' }}
                  >
                    <Users size={13} />
                    <span>Join</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature Showcase Grid (6 Cards) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
            Built for the Ultimate Group Watch Experience
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Everything you need for movie nights, anime marathons, and music parties.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div
            className="glass-card"
            style={{
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
              <Mic size={20} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
              WebRTC Voice & Cam Grid
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.45 }}>
              Talk and see each other via low-latency P2P video calls with speaking indicator glow and automatic YouTube audio ducking.
            </p>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>
              <Gift size={20} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Flying Snacks & Gifts
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.45 }}>
              Send floating 3D animated popcorn, pizza, soda, and party confetti across everyone's screens with celebratory audio chimes.
            </p>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
              <HelpCircle size={20} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Live Synchronized Trivia
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.45 }}>
              Challenge attendees with 15-second timed quizzes, earn +100 XP points, and climb the room leaderboard in real time.
            </p>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#facc15' }}>
              <Sliders size={20} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
              3D Equalizer & A-B Looper
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.45 }}>
              Enhance audio with Cinema 3D and Bass Boost presets, and mark Point A and B timestamps to loop memorable chorus clips.
            </p>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
              <Subtitles size={20} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Synchronized Subtitles
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.45 }}>
              Upload .SRT or .VTT files or paste text. Closed captions render directly over video with font size and timing sync offset adjustments.
            </p>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <BarChart3 size={20} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Analytics & Host Controls
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.45 }}>
              Inspect live viewership graphs, top chatters, broadcast urgent announcements, and clear or mute rooms with host moderation tools.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', textAlign: 'center', margin: '0 0 4px 0' }}>
          Frequently Asked Questions
        </h3>

        {faqs.map((faq, idx) => {
          const isExpanded = expandedFaq === idx;
          return (
            <div
              key={idx}
              className="glass-panel"
              style={{
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
                transition: 'all 0.2s',
              }}
            >
              <button
                type="button"
                onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>{faq.q}</span>
                {isExpanded ? <ChevronUp size={18} color="#38bdf8" /> : <ChevronDown size={18} color="#94a3b8" />}
              </button>

              {isExpanded && (
                <div
                  style={{
                    padding: '0 20px 16px 20px',
                    color: '#94a3b8',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}
                >
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* System Status & Architecture Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          color: '#64748b',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span style={{ color: '#4ade80', fontWeight: 600 }}>All Systems Operational</span>
        </div>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span>Spring Boot 3 (Java 21 LTS)</span>
          <span>•</span>
          <span>React 19 + TypeScript + Vite</span>
          <span>•</span>
          <span>H2 SQL Database Persistence</span>
          <span>•</span>
          <span>WebRTC P2P Signaling</span>
          <span>•</span>
          <span>Docker & Nginx Containerized</span>
        </div>
      </footer>
    </div>
  );
};
