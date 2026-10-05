import React, { useState } from 'react';
import { soundEffects } from '../services/soundEffects';
import { wsService } from '../services/websocket';

interface SoundboardProps {
  onSoundTriggered?: (name: string, soundName: string) => void;
}

const SOUNDS = [
  { id: 'airhorn', label: 'Airhorn', icon: '🎺', color: '#ff4d4f' },
  { id: 'applause', label: 'Applause', icon: '👏', color: '#52c41a' },
  { id: 'laughter', label: 'Laughter', icon: '😂', color: '#faad14' },
  { id: 'drumroll', label: 'Ba-Dum-Tss', icon: '🥁', color: '#722ed1' },
  { id: 'crickets', label: 'Crickets', icon: '🦗', color: '#13c2c2' },
  { id: 'ding', label: 'Ding!', icon: '🔔', color: '#eb2f96' },
];

export const Soundboard: React.FC<SoundboardProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEffects.isMuted());
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);

  const handlePlay = (id: string, label: string) => {
    soundEffects.play(id);
    wsService.playSound(id);
    setLastPlayed(label);
    setTimeout(() => setLastPlayed(null), 1500);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEffects.setMuted(next);
  };

  return (
    <div className="soundboard-container" style={{ position: 'relative' }}>
      <button
        type="button"
        className={`ctrl-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Party Soundboard"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: isOpen ? 'rgba(255, 75, 43, 0.25)' : 'rgba(255, 255, 255, 0.08)',
          border: isOpen ? '1px solid #ff4b2b' : '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          padding: '6px 12px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 600,
          transition: 'all 0.2s ease',
        }}
      >
        <span>🔊</span>
        <span>SFX Board</span>
        {lastPlayed && (
          <span
            style={{
              fontSize: '11px',
              background: '#ff4b2b',
              padding: '1px 6px',
              borderRadius: '10px',
              animation: 'pulse 1s infinite',
            }}
          >
            {lastPlayed}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="soundboard-dropdown glass-card animate-fade-in"
          style={{
            position: 'absolute',
            bottom: '48px',
            right: 0,
            width: '280px',
            background: 'rgba(20, 22, 35, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '14px',
            padding: '14px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 75, 43, 0.15)',
            zIndex: 100,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>🎉</span>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>Party Soundboard</span>
            </div>
            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
              style={{
                background: isMuted ? 'rgba(255, 77, 79, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '6px',
                padding: '3px 8px',
                color: isMuted ? '#ff4d4f' : '#a0aec0',
                cursor: 'pointer',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{isMuted ? '🔇 Muted' : '🔊 SFX On'}</span>
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
            }}
          >
            {SOUNDS.map((snd) => (
              <button
                key={snd.id}
                type="button"
                onClick={() => handlePlay(snd.id, snd.label)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'transform 0.15s ease, background 0.15s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: '18px' }}>{snd.icon}</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {snd.label}
                </span>
              </button>
            ))}
          </div>

          <div
            style={{
              marginTop: '10px',
              fontSize: '10px',
              color: 'rgba(255, 255, 255, 0.4)',
              textAlign: 'center',
            }}
          >
            Plays synchronized audio for everyone in the room!
          </div>
        </div>
      )}
    </div>
  );
};
