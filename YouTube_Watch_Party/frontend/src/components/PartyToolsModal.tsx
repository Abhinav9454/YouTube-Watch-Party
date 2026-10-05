import React, { useState } from 'react';
import {
  Repeat,
  RotateCcw,
  BarChart3,
  X,
  Check,
} from 'lucide-react';
import type { Role } from '../types/party';
import { wsService } from '../services/websocket';

interface PartyToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: Role;
  userId: string;
  liveCurrentTime: number;
  onSeek: (time: number) => void;
  ambientGlow: boolean;
  onToggleGlow: () => void;
  onOpenAnalytics: () => void;
}

const SNACK_LIST = [
  { type: 'popcorn', name: 'Popcorn', icon: '🍿' },
  { type: 'pizza', name: 'Pizza', icon: '🍕' },
  { type: 'soda', name: 'Cold Soda', icon: '🥤' },
  { type: 'icecream', name: 'Ice Cream', icon: '🍦' },
  { type: 'donut', name: 'Glazed Donut', icon: '🍩' },
  { type: 'confetti', name: 'Party Cannon', icon: '🎉' },
];

const PRESET_TRIVIA = [
  {
    q: 'In what year was YouTube officially launched?',
    opts: ['2003', '2005', '2007', '2010'],
    correct: 1,
  },
  {
    q: 'What is the most viewed video in YouTube history?',
    opts: ['Despacito', 'Baby Shark Dance', 'Shape of You', 'Gangnam Style'],
    correct: 1,
  },
  {
    q: 'Who composed the epic soundtrack for Interstellar and Inception?',
    opts: ['John Williams', 'Hans Zimmer', 'Ennio Morricone', 'Ludwig Göransson'],
    correct: 1,
  },
  {
    q: 'What was the first music video to hit 1 Billion views on YouTube?',
    opts: ['Baby - Justin Bieber', 'Gangnam Style - PSY', 'Bad Romance - Lady Gaga', 'See You Again - Wiz Khalifa'],
    correct: 1,
  },
];

const EQ_PRESETS = [
  { id: 'flat', name: 'Standard (Flat)', icon: '🎵' },
  { id: 'cinema', name: 'Cinema 3D', icon: '🎬' },
  { id: 'bass', name: 'Bass Boost', icon: '💥' },
  { id: 'vocal', name: 'Vocal Clarity', icon: '🗣️' },
  { id: 'night', name: 'Night Mode', icon: '🌙' },
];

export const PartyToolsModal: React.FC<PartyToolsModalProps> = ({
  isOpen,
  onClose,
  userRole,
  liveCurrentTime,
  ambientGlow,
  onToggleGlow,
  onOpenAnalytics,
}) => {
  const [activeTab, setActiveTab] = useState<'snacks' | 'trivia' | 'audio' | 'looper'>('snacks');
  const [lastSentSnack, setLastSentSnack] = useState<string | null>(null);
  const [activeEq, setActiveEq] = useState('flat');

  // Looper state
  const [pointA, setPointA] = useState<number | null>(null);
  const [pointB, setPointB] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(false);

  // Custom Trivia state
  const [customQ, setCustomQ] = useState('');
  const [customOpts, setCustomOpts] = useState(['', '', '', '']);
  const [customCorrect, setCustomCorrect] = useState(0);

  if (!isOpen) return null;

  const canHost = userRole === 'HOST' || userRole === 'MODERATOR';

  const handleSendSnack = (snack: typeof SNACK_LIST[0]) => {
    wsService.sendGift(snack.type, snack.icon, snack.name);
    setLastSentSnack(snack.icon);
    setTimeout(() => setLastSentSnack(null), 1400);
  };

  const handleStartPresetTrivia = (index: number) => {
    const item = PRESET_TRIVIA[index];
    wsService.startTrivia(item.q, item.opts, item.correct, 15);
    onClose();
  };

  const handleStartCustomTrivia = () => {
    if (!customQ.trim() || customOpts.some((o) => !o.trim())) return;
    wsService.startTrivia(customQ.trim(), customOpts.map((o) => o.trim()), customCorrect, 20);
    setCustomQ('');
    setCustomOpts(['', '', '', '']);
    onClose();
  };

  const handleSetA = () => {
    setPointA(Math.floor(liveCurrentTime));
  };

  const handleSetB = () => {
    const candidate = Math.ceil(liveCurrentTime);
    if (pointA === null || candidate > pointA) {
      setPointB(candidate);
      setIsLooping(true);
    }
  };

  const handleClearLoop = () => {
    setPointA(null);
    setPointB(null);
    setIsLooping(false);
  };

  const formatSec = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 16, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-card animate-scale-up"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'rgba(14, 18, 28, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 25px rgba(239, 68, 68, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🎉</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                Party Tools & Interactive FX
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                Virtual snacks, trivia games, and cinema ambient settings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '8px',
              width: '30px',
              height: '30px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            padding: '6px',
            background: 'rgba(0, 0, 0, 0.35)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('snacks')}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'snacks' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
              color: activeTab === 'snacks' ? '#f87171' : '#94a3b8',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <span>🍿</span>
            <span>Snacks</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trivia')}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'trivia' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
              color: activeTab === 'trivia' ? '#f87171' : '#94a3b8',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <span>🧠</span>
            <span>Trivia</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'audio' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
              color: activeTab === 'audio' ? '#f87171' : '#94a3b8',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <span>🎚️</span>
            <span>Cinema FX</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('looper')}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'looper' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
              color: activeTab === 'looper' ? '#f87171' : '#94a3b8',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <span>🔁</span>
            <span>Looper</span>
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto' }}>
          {/* TAB 1: Snacks & Virtual Gifts */}
          {activeTab === 'snacks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                  Send Virtual Snacks to the Party Screen
                </span>
                {lastSentSnack && (
                  <span
                    style={{
                      fontSize: '11px',
                      background: '#10b981',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontWeight: 700,
                    }}
                  >
                    Sent {lastSentSnack}!
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {SNACK_LIST.map((snack) => (
                  <button
                    key={snack.type}
                    type="button"
                    onClick={() => handleSendSnack(snack)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '14px 10px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{snack.icon}</span>
                    <span>{snack.name}</span>
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                Snacks float gracefully across the YouTube player for all viewers in the room.
              </div>
            </div>
          )}

          {/* TAB 2: Trivia Quiz */}
          {activeTab === 'trivia' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!canHost ? (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#94a3b8',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🔒</span>
                  Only the <b>Host</b> or <b>Moderator</b> can launch a trivia quiz for the room.
                  <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                    When the host starts a quiz, it will appear directly on your screen!
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                      ⚡ 1-Click Preset Trivia (Instant Launch)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {PRESET_TRIVIA.map((pt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleStartPresetTrivia(idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          }}
                        >
                          <span>▶ {pt.q}</span>
                          <span
                            style={{
                              fontSize: '11px',
                              color: '#f87171',
                              background: 'rgba(239, 68, 68, 0.15)',
                              padding: '2px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            Launch →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      paddingTop: '14px',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                      ✍️ Custom Trivia Question
                    </div>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Type question (e.g. Which actor plays Neo in Matrix?)"
                      value={customQ}
                      onChange={(e) => setCustomQ(e.target.value)}
                      style={{ width: '100%', marginBottom: '8px', fontSize: '12px', padding: '8px 12px' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                      {customOpts.map((opt, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="radio"
                            name="correctOpt"
                            checked={customCorrect === i}
                            onChange={() => setCustomCorrect(i)}
                            title="Mark as correct answer"
                          />
                          <input
                            type="text"
                            className="input-field"
                            placeholder={`Option ${i + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const next = [...customOpts];
                              next[i] = e.target.value;
                              setCustomOpts(next);
                            }}
                            style={{ flex: 1, fontSize: '11px', padding: '6px 8px' }}
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleStartCustomTrivia}
                      disabled={!customQ.trim() || customOpts.some((o) => !o.trim())}
                      className="btn-primary"
                      style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                    >
                      Start Custom Trivia
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: Audio & Ambient Glow */}
          {activeTab === 'audio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Cinema Ambient Glow Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>💡</span>
                    <span>Dynamic Ambient Cinema Glow</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    Diffuses ambient theater lighting around the YouTube player
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleGlow}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: ambientGlow ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    border: ambientGlow ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                    color: ambientGlow ? '#f87171' : '#94a3b8',
                  }}
                >
                  {ambientGlow ? '✓ Glow ON' : 'Glow OFF'}
                </button>
              </div>

              {/* Sound Equalizer Presets */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                  🎚️ Sound Profile Presets
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {EQ_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActiveEq(p.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: activeEq === p.id ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${activeEq === p.id ? '#ef4444' : 'rgba(255, 255, 255, 0.08)'}`,
                        color: activeEq === p.id ? '#f87171' : '#cbd5e1',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{p.icon}</span>
                        <span>{p.name}</span>
                      </div>
                      {activeEq === p.id && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Host Analytics Launcher */}
              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                    📊 Host Analytics & Metrics
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Audience graph, chat activity, and party stats
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAnalytics();
                  }}
                  className="btn-secondary"
                  style={{ fontSize: '12px', gap: '6px' }}
                >
                  <BarChart3 size={14} />
                  <span>Open Dashboard</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: A-B Video Looper */}
          {activeTab === 'looper' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                Repeat any section of the video seamlessly. Set Start (Point A) and End (Point B) to loop your favourite song drop, meme, or clip.
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  padding: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Point A (Start):</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#f87171', fontFamily: 'monospace' }}>
                    {pointA !== null ? formatSec(pointA) : '--:--'}
                  </div>
                  <button
                    type="button"
                    onClick={handleSetA}
                    className="btn-secondary"
                    style={{ marginTop: '8px', width: '100%', padding: '6px', fontSize: '11px' }}
                  >
                    Set A to Current
                  </button>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Point B (End):</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>
                    {pointB !== null ? formatSec(pointB) : '--:--'}
                  </div>
                  <button
                    type="button"
                    onClick={handleSetB}
                    className="btn-secondary"
                    style={{ marginTop: '8px', width: '100%', padding: '6px', fontSize: '11px' }}
                  >
                    Set B to Current
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsLooping(!isLooping)}
                  disabled={pointA === null || pointB === null}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '12px',
                    opacity: pointA === null || pointB === null ? 0.5 : 1,
                  }}
                >
                  <Repeat size={14} />
                  <span>{isLooping ? 'Pause Loop' : 'Start Looping'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearLoop}
                  className="btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                  title="Clear loop points"
                >
                  <RotateCcw size={14} />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
