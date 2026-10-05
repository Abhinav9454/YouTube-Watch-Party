import React, { useState, useEffect, useMemo } from 'react';
import {
  PlusCircle,
  LogIn,
  Sparkles,
  Radio,
  Lock,
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
  Volume2,
  ArrowRight,
  Film,
  Flame,
  Check,
  X as XIcon,
} from 'lucide-react';
import type { RoomEntityDto } from '../types/party';
import { listRecentRoomsApi } from '../services/api';
import { soundEffects } from '../services/soundEffects';

interface LobbyProps {
  initialRoomCode?: string;
  onJoinRoom: (roomId: string, username: string, passcode?: string) => void;
  onCreateRoom: (roomName: string, username: string, videoId: string, passcode?: string) => void;
}

const FEATURED_VIDEOS = [
  { title: 'Lofi Hip Hop Radio - Beats to Relax/Study', id: 'jfKfPfyJRdk', badge: 'Music', duration: '24/7 Live' },
  { title: 'Big Buck Bunny (4K Animation Classic)', id: 'aqz-KE-bpKQ', badge: 'Movie', duration: '9:56' },
  { title: 'Cyberpunk Synthwave 80s Chill Mix', id: '4xDzrJKXOOY', badge: 'Mix', duration: '1:02:14' },
  { title: 'Relaxing Jazz Coffee Shop Ambience', id: 'Dx5qFachd3A', badge: 'Ambient', duration: '3:15:00' },
];

import { extractYouTubeVideoId } from '../utils/youtube';

function extractYouTubeId(urlOrId: string): string {
  return extractYouTubeVideoId(urlOrId);
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

  // Interactive Live Demo simulation state
  const [demoPlaying, setDemoPlaying] = useState(true);
  const [demoReaction, setDemoReaction] = useState<string | null>(null);

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
        // Fallback gracefully
      }
    };
    fetchRooms();
  }, []);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.play('join');
    const finalVideo = activeVideoId;
    const finalPasscode = requirePasscode && createPasscode.trim() ? createPasscode.trim() : undefined;
    onCreateRoom(roomName.trim() || 'Watch Party', username.trim() || 'Host', finalVideo, finalPasscode);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    soundEffects.play('join');
    const finalPasscode = joinPasscode.trim() ? joinPasscode.trim() : undefined;
    onJoinRoom(joinCode.trim().toUpperCase(), username.trim() || 'Viewer', finalPasscode);
  };

  const handleQuickJoinRoom = (roomId: string, isPasscodeProtected?: boolean) => {
    if (isPasscodeProtected) {
      setJoinCode(roomId);
      setTab('join');
      document.getElementById('launcher-card')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      soundEffects.play('join');
      onJoinRoom(roomId, username.trim() || 'Viewer');
    }
  };

  const triggerDemoReaction = (emoji: string) => {
    soundEffects.play('reaction');
    setDemoReaction(emoji);
    setTimeout(() => setDemoReaction(null), 1500);
  };

  const scrollToLauncher = (desiredTab: 'create' | 'join') => {
    setTab(desiredTab);
    document.getElementById('launcher-card')?.scrollIntoView({ behavior: 'smooth' });
  };

  const faqs = [
    {
      q: 'Do my friends need to create an account or install browser extensions?',
      a: 'No! Zero downloads, extensions, or software installations are needed. Friends simply click your party link on any modern browser (Chrome, Firefox, Safari, Edge) on PC, Mac, Android, or iOS to join immediately with instant sync.',
    },
    {
      q: 'How does SyncWave achieve sub-second (<15ms) playback synchronization?',
      a: 'SyncWave uses an authoritative timestamp consensus model powered by Spring Boot WebSockets and high-frequency drift correction. When the host plays, pauses, or seeks, state is broadcasted over STOMP WebSockets within milliseconds to all connected clients.',
    },
    {
      q: 'Can we talk and see each other while watching?',
      a: 'Yes! SyncWave has a built-in WebRTC Mesh voice and video call grid with speaking indicator glow. It also includes automatic YouTube audio ducking: when someone speaks, the video volume softly lowers so voices are crystal clear.',
    },
    {
      q: 'What are Virtual Flying Snacks and Synchronized Trivia?',
      a: 'You can toss animated 3D popcorn, pizza, soda, and party confetti across everyone’s screens with spatial audio cues. Hosts can also trigger 15-second timed trivia quizzes to challenge friends, earn XP, and climb the room leaderboard in real time.',
    },
    {
      q: 'Can I upload custom subtitles for videos in different languages?',
      a: 'Yes! You can drag and drop any local .SRT or .VTT subtitle file or paste text directly into the room. Captions synchronize in real time with the video timeline, complete with font scaling and sync delay offset slider.',
    },
    {
      q: 'Is SyncWave Party free to use?',
      a: 'SyncWave Party is 100% free and open-source under the MIT license, backed by Java 21, Spring Boot 3, and MongoDB Atlas. No subscription or credit card required.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', paddingBottom: '60px' }}>
      {/* 1. HERO SECTION */}
      <section
        style={{
          position: 'relative',
          padding: '60px 24px 20px 24px',
          maxWidth: '1240px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '350px',
            background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.22) 0%, rgba(168, 85, 247, 0.12) 40%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        />

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '9999px',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            marginBottom: '24px',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)',
          }}
        >
          <Sparkles size={15} color="#818cf8" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#c7d2fe' }}>
            Next-Gen YouTube Watch Party • WebRTC Voice & Video • 100% Free
          </span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.5rem, 5.5vw, 4.2rem)',
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: '-1.5px',
            color: '#fff',
            maxWidth: '920px',
            margin: '0 0 20px 0',
          }}
        >
          Watch YouTube Together.{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Feel Like You're in the Same Room.
          </span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 1.8vw, 1.25rem)',
            color: '#94a3b8',
            maxWidth: '740px',
            margin: '0 0 36px 0',
            lineHeight: 1.6,
          }}
        >
          Experience cinema-grade synchronization (&lt;15ms drift), peer-to-peer WebRTC voice & video calls, floating 3D virtual gifts, synchronized subtitles, and interactive trivia quizzes.
        </p>

        {/* Live Community Activity Simulation Ticker */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '7px 16px',
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '9999px',
            fontSize: '12px',
            color: '#94a3b8',
            marginBottom: '32px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 10px #f43f5e' }} />
          <span>
            <strong style={{ color: '#fff' }}>Live Activity:</strong> Room <span style={{ color: '#818cf8', fontWeight: 700 }}>#RETRO-SYNTH</span> synced with 6 viewers • <strong style={{ color: '#38bdf8' }}>Maya</strong> answered trivia (+100 XP)
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '48px',
          }}
        >
          <button
            type="button"
            className="btn-primary"
            onClick={() => scrollToLauncher('create')}
            style={{
              padding: '14px 32px',
              fontSize: '1rem',
              fontWeight: 700,
              gap: '10px',
              boxShadow: '0 0 30px rgba(99, 102, 241, 0.45)',
            }}
          >
            <PlusCircle size={20} />
            <span>Create a Watch Party</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => scrollToLauncher('join')}
            style={{
              padding: '14px 28px',
              fontSize: '1rem',
              fontWeight: 600,
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <LogIn size={20} color="#38bdf8" />
            <span>Join With Room Code</span>
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '16px',
            maxWidth: '880px',
            width: '100%',
            padding: '18px 24px',
            background: 'rgba(18, 24, 38, 0.65)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
            marginBottom: '40px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>&lt; 15 ms</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Sync Precision Drift</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>100% Free</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Zero Install / No Extensions</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a855f7' }}>WebRTC Mesh</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>P2P Voice & Video Grid</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>MongoDB Atlas</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Cloud-Secured Backbone</span>
          </div>
        </div>

        {/* Live Demo Simulation Showcase */}
        <div
          style={{
            maxWidth: '820px',
            width: '100%',
            background: 'rgba(15, 20, 32, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(99, 102, 241, 0.25)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              paddingBottom: '12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginLeft: '8px' }}>
                Room #FRIDAY-VIBES • Live Sync Simulation
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.15)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Radio size={12} /> 4 Viewers Synced
              </span>
            </div>
          </div>

          <div
            style={{
              height: '240px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <img
              src={`https://img.youtube.com/vi/${FEATURED_VIDEOS[0].id}/hqdefault.jpg`}
              alt="Lofi Beats Preview"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.35,
                filter: 'brightness(0.7) blur(1px)',
              }}
            />

            {demoReaction && (
              <div
                className="animate-pop-up"
                style={{
                  position: 'absolute',
                  fontSize: '48px',
                  zIndex: 20,
                  filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.5))',
                }}
              >
                {demoReaction}
              </div>
            )}

            <button
              type="button"
              onClick={() => setDemoPlaying(!demoPlaying)}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.85)',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 0 30px rgba(99, 102, 241, 0.6)',
                zIndex: 10,
                transition: 'all 0.2s',
              }}
            >
              <Play size={24} fill="#fff" style={{ marginLeft: demoPlaying ? '0' : '3px' }} />
            </button>

            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '12px 16px',
                background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.9) 0%, transparent 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                  Lofi Hip Hop Radio - Beats to Relax/Study
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {['🍿', '🔥', '🎉', '❤️'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => triggerDemoReaction(emoji)}
                    title={`Send test ${emoji} reaction`}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'transform 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '12px',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {[
                  { name: 'Alex (Host)', color: '#6366f1', speaking: true },
                  { name: 'Sarah', color: '#ec4899', speaking: false },
                  { name: 'David', color: '#10b981', speaking: false },
                  { name: 'Maya', color: '#f59e0b', speaking: false },
                ].map((user, idx) => (
                  <div
                    key={idx}
                    title={user.name}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: user.color,
                      border: user.speaking ? '2px solid #38bdf8' : '2px solid #0f172a',
                      boxShadow: user.speaking ? '0 0 10px #38bdf8' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#fff',
                      marginLeft: idx > 0 ? '-8px' : '0',
                    }}
                  >
                    {user.name[0]}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                <strong style={{ color: '#38bdf8' }}>Alex</strong> is speaking • YouTube audio auto-ducked
              </span>
            </div>

            <span style={{ fontSize: '11px', color: '#64748b' }}>Try clicking emojis above!</span>
          </div>
        </div>
      </section>

      {/* 2. PARTY LAUNCHER PANEL */}
      <section
        id="launcher-card"
        style={{
          maxWidth: '680px',
          width: '100%',
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        <div
          className="glass-panel"
          style={{
            padding: '32px',
            borderRadius: '24px',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.2)',
            background: 'rgba(15, 20, 32, 0.92)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#818cf8', fontWeight: 700, letterSpacing: '0.5px' }}>
                Your Party Identity
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
                    width: '180px',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '16px',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
              }}
            >
              {username ? username[0].toUpperCase() : 'U'}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '26px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
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
                color: tab === 'create' ? '#fff' : '#94a3b8',
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
                color: tab === 'join' ? '#fff' : '#94a3b8',
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

          {tab === 'create' ? (
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e0', marginBottom: '8px', fontWeight: 600 }}>
                  Choose Starting Video
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
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
                            {vid.badge} • {vid.duration}
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

                <div>
                  <input
                    type="text"
                    className="input-field"
                    value={customVideoUrl}
                    onChange={(e) => setCustomVideoUrl(e.target.value)}
                    placeholder="Or paste any YouTube URL, <iframe> embed code, or ID..."
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px' }}
                  />
                </div>

                {activeVideoId && (
                  <div
                    style={{
                      marginTop: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${activeVideoId}/default.jpg`}
                      alt="Thumbnail Preview"
                      style={{ width: '60px', height: '45px', objectFit: 'cover', borderRadius: '6px' }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '11px', color: '#818cf8', fontWeight: 700 }}>VALID YOUTUBE TARGET</div>
                      <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>ID: {activeVideoId}</div>
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={15} color={requirePasscode ? '#38bdf8' : '#94a3b8'} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>Require Passcode / PIN</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={requirePasscode}
                    onChange={(e) => setRequirePasscode(e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#6366f1' }}
                  />
                </div>

                {requirePasscode && (
                  <div style={{ marginTop: '10px' }}>
                    <input
                      type="password"
                      className="input-field"
                      value={createPasscode}
                      onChange={(e) => setCreatePasscode(e.target.value)}
                      placeholder="Set room passcode (optional, leave blank for open room)"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{
                  padding: '14px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginTop: '6px',
                  boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)',
                }}
              >
                <Sparkles size={18} />
                <span>Launch Watch Party Now</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e0', marginBottom: '6px', fontWeight: 600 }}>
                  Enter 6-Character Room Code
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="input-field"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. 7X9K2P"
                    maxLength={10}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      fontSize: '1.2rem',
                      letterSpacing: '3px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      textAlign: 'center',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e0', marginBottom: '6px', fontWeight: 600 }}>
                  Room Passcode (If required by host)
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={joinPasscode}
                  onChange={(e) => setJoinPasscode(e.target.value)}
                  placeholder="Enter passcode if protected..."
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px' }}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={!joinCode.trim()}
                style={{
                  padding: '14px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginTop: '8px',
                  opacity: joinCode.trim() ? 1 : 0.6,
                }}
              >
                <LogIn size={18} />
                <span>Enter Room Now</span>
              </button>
            </form>
          )}
        </div>
      </section>

      {/* 3. ACTIVE PUBLIC WATCH PARTIES SHOWCASE */}
      <section
        id="public-parties"
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0 24px',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Flame size={18} color="#f43f5e" />
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Live Public Watch Parties
              </h2>
            </div>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
              Join active community rooms currently streaming videos right now.
            </p>
          </div>

          <button
            type="button"
            onClick={() => scrollToLauncher('create')}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px', gap: '6px' }}
          >
            <PlusCircle size={15} /> Host Your Own
          </button>
        </div>

        {persistedRooms && persistedRooms.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {persistedRooms.slice(0, 6).map((room) => (
              <div
                key={room.roomId}
                className="glass-panel glass-panel-interactive"
                style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ height: '140px', position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={`https://img.youtube.com/vi/${room.currentVideoId || 'jfKfPfyJRdk'}/mqdefault.jpg`}
                    alt={room.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(6px)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Radio size={11} color="#10b981" /> LIVE
                  </div>

                  {room.passcode && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(0, 0, 0, 0.75)',
                        padding: '4px',
                        borderRadius: '6px',
                        color: '#38bdf8',
                      }}
                      title="Passcode Protected Room"
                    >
                      <Lock size={12} />
                    </div>
                  )}
                </div>

                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {room.name}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Host: <strong style={{ color: '#c7d2fe' }}>{room.creatorUsername}</strong>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#818cf8', fontWeight: 700 }}>
                      #{room.roomId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuickJoinRoom(room.roomId, Boolean(room.passcode))}
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, gap: '4px' }}
                    >
                      Join <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="glass-panel"
            style={{
              padding: '40px',
              textAlign: 'center',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Film size={36} color="#818cf8" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
              No Public Watch Parties Running Right Now
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, maxWidth: '420px' }}>
              Be the first host to start a room! Launch a party above and invite friends or leave it open for others to discover.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => scrollToLauncher('create')}
              style={{ marginTop: '8px', padding: '10px 22px', fontSize: '13px' }}
            >
              Start First Party
            </button>
          </div>
        )}
      </section>

      {/* 4. HOW IT WORKS */}
      <section
        id="how-it-works"
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0 24px',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Frictionless Setup
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '6px 0 10px 0' }}>
            How SyncWave Works in 3 Simple Steps
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            No browser extensions to download, no accounts mandated. Pure web-standard magic.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div
            className="glass-panel"
            style={{
              padding: '28px',
              borderRadius: '20px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 800,
              }}
            >
              1
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Create or Pick Any Video
            </h3>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Enter any public YouTube URL or select from our curated trending lists (Lofi, 4K Cinema, Synthwave, Chill Jazz). Add an optional room passcode if you want total privacy.
            </p>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '28px',
              borderRadius: '20px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 800,
              }}
            >
              2
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Share Room Code / QR Link
            </h3>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Send your friends the generated 6-character room code or instant URL. Friends join seamlessly from smartphones, tablets, laptops, or smart TVs without installing any apps.
            </p>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '28px',
              borderRadius: '20px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 800,
              }}
            >
              3
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Sync, Talk, React & Play
            </h3>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Enjoy cinema-level sync across play, pause, and seek. Talk over WebRTC voice/video with audio ducking, send floating 3D snacks, trigger trivia quizzes, and enjoy the party!
            </p>
          </div>
        </div>
      </section>

      {/* 5. PREMIER FEATURE SHOWCASE */}
      <section
        id="features"
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0 24px',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Built for the Ultimate Experience
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '6px 0 10px 0' }}>
            Packed With Industry-Leading Features
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Everything you need for movie nights, anime marathons, and collaborative study groups.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              borderRadius: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <Zap size={22} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Sub-Second Timeline Sync
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
              Spring Boot WebSocket server continuously reconciles drift (&lt;15ms). When the host plays, pauses, or seeks, all viewers stay frame-accurate.
            </p>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '24px',
              borderRadius: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
              <Mic size={22} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0 }}>
              WebRTC Voice & Cam Grid
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
              Low-latency P2P mesh audio and video calls. Includes live speaking glow indicators and automatic YouTube audio ducking when someone speaks.
            </p>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '24px',
              borderRadius: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>
              <Gift size={22} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Flying Snacks & Gifts
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
              Toss animated 3D popcorn, pizza, drinks, and confetti across everyone’s screens accompanied by spatial celebration chimes.
            </p>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '24px',
              borderRadius: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
              <HelpCircle size={22} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Synchronized Live Trivia
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
              Host 15-second timed quiz battles. Everyone receives the question simultaneously, competing for +100 XP points on the room leaderboard.
            </p>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '24px',
              borderRadius: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#facc15' }}>
              <Sliders size={22} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0 }}>
              3D Cinema Equalizer & Looper
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
              Cinema 3D, Bass Boost, and Vocal Clarity EQ presets. Set custom Point A and Point B timestamps to seamlessly loop musical choruses.
            </p>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '24px',
              borderRadius: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
              <Subtitles size={22} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Custom Subtitle Sync (.SRT/.VTT)
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
              Drag and drop local subtitle files or paste captions. Subtitles render on top of the video player with font scaling and sync delay offset slider.
            </p>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '24px',
              borderRadius: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(249, 115, 22, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb923c' }}>
              <Volume2 size={22} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Interactive Soundboard
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
              Trigger hilarious sound effects in real time (airhorn, applause, rimshot, fail chime, dramatic drumroll) to hype up memorable video scenes.
            </p>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '24px',
              borderRadius: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <BarChart3 size={22} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Host Moderation & Security
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
              Assign moderators, kick disruptive users, pass-protect rooms, transfer host ownership, and lock queue permissions at any time.
            </p>
          </div>
        </div>
      </section>

      {/* 6. COMPARISON MATRIX */}
      <section
        id="comparison"
        style={{
          maxWidth: '1080px',
          margin: '0 auto',
          padding: '0 24px',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Industry Benchmarks
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '6px 0 10px 0' }}>
            Why SyncWave Outperforms Other Solutions
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Compare SyncWave directly against traditional browser extensions and Discord streaming.
          </p>
        </div>

        <div
          className="glass-panel"
          style={{
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>Feature</th>
                  <th style={{ padding: '16px 20px', fontSize: '14px', color: '#818cf8', fontWeight: 700, background: 'rgba(99, 102, 241, 0.1)' }}>
                    SyncWave Party (Pro)
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>Browser Extensions</th>
                  <th style={{ padding: '16px 20px', fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>Discord Stream</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Zero Extension / App Install', us: true, ext: false, discord: false },
                  { feature: 'Sub-Second (<15ms) Sync Accuracy', us: true, ext: false, discord: false },
                  { feature: 'Built-in WebRTC Voice & Video Grid', us: true, ext: false, discord: true },
                  { feature: 'Works on Mobile & Tablets', us: true, ext: false, discord: true },
                  { feature: '3D Flying Snacks & Confetti', us: true, ext: false, discord: false },
                  { feature: 'Synchronized Trivia Quizzes', us: true, ext: false, discord: false },
                  { feature: 'Drag-and-Drop Subtitle Sync (.SRT)', us: true, ext: false, discord: false },
                  { feature: '100% Free & Open Source', us: true, ext: false, discord: false },
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                    }}
                  >
                    <td style={{ padding: '14px 20px', fontSize: '13.5px', color: '#cbd5e1', fontWeight: 500 }}>
                      {row.feature}
                    </td>
                    <td style={{ padding: '14px 20px', background: 'rgba(99, 102, 241, 0.06)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 700, fontSize: '13px' }}>
                        <Check size={16} color="#10b981" /> Yes
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {row.ext ? (
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>Yes</span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#f43f5e', fontSize: '13px' }}>
                          <XIcon size={14} color="#f43f5e" /> No
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {row.discord ? (
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>Yes</span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#f43f5e', fontSize: '13px' }}>
                          <XIcon size={14} color="#f43f5e" /> No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 6.5 COMMUNITY TESTIMONIALS */}
      <section
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0 24px',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Loved by Communities
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '6px 0 10px 0' }}>
            Built for Real People Watching Together
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Here is how friends, clubs, and remote couples use SyncWave every day.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              borderRadius: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', gap: '4px', color: '#fbbf24', fontSize: '16px' }}>
              ★★★★★
            </div>
            <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
              "The WebRTC voice with automatic YouTube audio ducking makes movie dates feel like we're on the same couch. No lag, no awkward countdowns!"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #ec4899, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '12px' }}>
                E&M
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Elena & Mark</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Long-Distance Movie Night (NYC & Berlin)</div>
              </div>
            </div>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '24px',
              borderRadius: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', gap: '4px', color: '#fbbf24', fontSize: '16px' }}>
              ★★★★★
            </div>
            <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
              "We hosted a 35-person anime premiere party. The floating 3D gifts and live trivia quizzes made it 10x more engaging than standard screen shares."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '12px' }}>
                K
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Kenji Takahashi</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Organizer, AnimeSphere Club</div>
              </div>
            </div>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '24px',
              borderRadius: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', gap: '4px', color: '#fbbf24', fontSize: '16px' }}>
              ★★★★★
            </div>
            <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
              "Our university coding group uses SyncWave daily. The 3D bass equalizer and subtitle sync for technical tutorials are pure engineering excellence."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '12px' }}>
                P
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Priya Sharma</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>CS Senior & Study Group Lead</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ ACCORDION */}
      <section
        id="faq"
        style={{
          maxWidth: '840px',
          margin: '0 auto',
          padding: '0 24px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Got Questions?
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '6px 0 10px 0' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Everything you need to know about setting up and running your watch party.
          </p>
        </div>

        {faqs.map((faq, idx) => {
          const isExpanded = expandedFaq === idx;
          return (
            <div
              key={idx}
              className="glass-panel"
              style={{
                borderRadius: '14px',
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
                  padding: '18px 22px',
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: '#fff',
                  fontSize: '15px',
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
                    padding: '0 22px 20px 22px',
                    color: '#94a3b8',
                    fontSize: '13.5px',
                    lineHeight: 1.6,
                    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                    paddingTop: '14px',
                  }}
                >
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* 8. CALL-TO-ACTION BANNER */}
      <section
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0 24px',
          width: '100%',
        }}
      >
        <div
          style={{
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.2) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            padding: '50px 32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.2)',
          }}
        >
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 800, color: '#fff', margin: '0 0 14px 0' }}>
            Ready to Stream With Your Friends?
          </h2>
          <p style={{ fontSize: '15px', color: '#cbd5e1', maxWidth: '580px', margin: '0 0 30px 0', lineHeight: 1.6 }}>
            Launch your room in less than 10 seconds. Free forever, no registration needed, sub-second sync on any device.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => scrollToLauncher('create')}
            style={{
              padding: '14px 36px',
              fontSize: '1.05rem',
              fontWeight: 700,
              gap: '10px',
              boxShadow: '0 0 30px rgba(99, 102, 241, 0.5)',
            }}
          >
            <Sparkles size={20} />
            <span>Start a Free Watch Party Now</span>
          </button>
        </div>
      </section>
    </div>
  );
};
