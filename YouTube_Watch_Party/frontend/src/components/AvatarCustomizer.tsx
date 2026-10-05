import React, { useState } from 'react';
import { Check, Smile, Award } from 'lucide-react';

export const AVATAR_OPTIONS = [
  { id: 'fox', emoji: '🦊', name: 'Cyber Fox' },
  { id: 'cat', emoji: '🐱', name: 'Neon Cat' },
  { id: 'robot', emoji: '🤖', name: 'Robo DJ' },
  { id: 'panda', emoji: '🐼', name: 'Space Panda' },
  { id: 'popcorn', emoji: '🍿', name: 'Popcorn Beast' },
  { id: 'astronaut', emoji: '🚀', name: 'Astronaut' },
  { id: 'dino', emoji: '🦖', name: 'Pixel Dino' },
  { id: 'unicorn', emoji: '🦄', name: 'Cosmic Unicorn' },
  { id: 'ninja', emoji: '🥷', name: 'Shadow Ninja' },
  { id: 'volt', emoji: '⚡', name: 'Thunder Volt' },
  { id: 'headphones', emoji: '🎧', name: 'Audio Maestro' },
  { id: 'crown', emoji: '👑', name: 'Party Royalty' },
];

export const BADGE_OPTIONS = [
  { id: 'vip', label: 'VIP Guest', icon: '🌟', color: '#fbbf24' },
  { id: 'dj', label: 'Party DJ', icon: '🎧', color: '#a855f7' },
  { id: 'trivia', label: 'Trivia Whiz', icon: '🧠', color: '#38bdf8' },
  { id: 'snack', label: 'Snack Master', icon: '🍿', color: '#f97316' },
  { id: 'hype', label: 'Hype Captain', icon: '🔥', color: '#ef4444' },
  { id: 'chill', label: 'Chill Viewer', icon: '☕', color: '#10b981' },
];

interface AvatarCustomizerProps {
  currentUsername: string;
  onUpdate?: (avatar: string, badge: string) => void;
}

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({
  currentUsername,
  onUpdate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    return localStorage.getItem('watchparty_avatar') || '🦊';
  });
  const [selectedBadge, setSelectedBadge] = useState(() => {
    return localStorage.getItem('watchparty_badge') || 'VIP Guest';
  });

  const handleSelectAvatar = (emoji: string) => {
    setSelectedAvatar(emoji);
    localStorage.setItem('watchparty_avatar', emoji);
    if (onUpdate) onUpdate(emoji, selectedBadge);
  };

  const handleSelectBadge = (badge: string) => {
    setSelectedBadge(badge);
    localStorage.setItem('watchparty_badge', badge);
    if (onUpdate) onUpdate(selectedAvatar, badge);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '8px',
          padding: '5px 10px',
          color: '#e2e8f0',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        title="Customize Avatar & Flair Badge"
      >
        <span style={{ fontSize: '15px' }}>{selectedAvatar}</span>
        <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedBadge}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className="glass-card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '440px',
              background: 'rgba(18, 22, 38, 0.98)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              borderRadius: '16px',
              padding: '22px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(168, 85, 247, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c084fc',
                  }}
                >
                  <Smile size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                    Profile & Avatar Flair
                  </h3>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                    Choose your watch party identity & title
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '18px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Profile Preview Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
                }}
              >
                {selectedAvatar}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                  {currentUsername}
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#c084fc', fontWeight: 600 }}>
                  <Award size={12} />
                  <span>{selectedBadge}</span>
                </div>
              </div>
            </div>

            {/* Avatar Grid */}
            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                SELECT AVATAR:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {AVATAR_OPTIONS.map((av) => {
                  const isSelected = selectedAvatar === av.emoji;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => handleSelectAvatar(av.emoji)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        padding: '8px 4px',
                        background: isSelected ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        border: isSelected ? '1px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      <span style={{ fontSize: '22px' }}>{av.emoji}</span>
                      <span style={{ fontSize: '10px', color: isSelected ? '#c084fc' : '#94a3b8' }}>
                        {av.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Flair Badge Picker */}
            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                SELECT FLAIR BADGE:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {BADGE_OPTIONS.map((bg) => {
                  const isSelected = selectedBadge === bg.label;
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => handleSelectBadge(bg.label)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 10px',
                        background: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? `1px solid ${bg.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        color: isSelected ? bg.color : '#cbd5e0',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span>{bg.icon}</span>
                      <span style={{ flex: 1 }}>{bg.label}</span>
                      {isSelected && <Check size={12} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn-primary"
              style={{ padding: '8px', fontSize: '12px', marginTop: '4px' }}
            >
              Done & Save Profile
            </button>
          </div>
        </div>
      )}
    </>
  );
};
