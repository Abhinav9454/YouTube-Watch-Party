import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, X } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';
import { wsService } from '../services/websocket';

interface SoundboardProps {
  onSoundTriggered?: (soundId: string, label: string) => void;
  inline?: boolean;
}

export const PARTY_SOUNDS = [
  { id: 'airhorn', label: 'Airhorn', icon: '🎺', color: '#ff4d4f', desc: 'DJ Reggae blast' },
  { id: 'drumroll', label: 'Ba-Dum-Tss', icon: '🥁', color: '#8b5cf6', desc: 'Punchline rimshot' },
  { id: 'applause', label: 'Applause', icon: '👏', color: '#10b981', desc: 'Crowd cheer' },
  { id: 'ding', label: 'Victory Ding', icon: '🔔', color: '#ec4899', desc: 'Crystal bell chime' },
  { id: 'buzzer', label: 'Fail Buzzer', icon: '🚨', color: '#ef4444', desc: 'Game show buzzer' },
  { id: 'boing', label: 'Spring Boing', icon: '🎈', color: '#f59e0b', desc: 'Cartoon bounce' },
  { id: 'crickets', label: 'Crickets', icon: '🦗', color: '#06b6d4', desc: 'Awkward silence' },
  { id: 'hype', label: 'Hype Siren', icon: '🔥', color: '#f97316', desc: 'Rave siren sweep' },
];

export const Soundboard: React.FC<SoundboardProps> = ({ onSoundTriggered, inline = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEffects.isMuted());
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);

  const handlePlay = (id: string, label: string) => {
    soundEffects.play(id);
    wsService.playSound(id);
    setLastPlayed(label);
    onSoundTriggered?.(id, label);
    setTimeout(() => setLastPlayed(null), 1800);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEffects.setMuted(next);
  };

  const soundGridContent = (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#f87171" />
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>Party Soundboard</span>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '9999px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontWeight: 700,
            }}
          >
            Room Sync
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={toggleMute}
            title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
            style={{
              background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              padding: '4px 10px',
              color: isMuted ? '#f87171' : '#cbd5e0',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            <span>{isMuted ? 'Muted' : 'SFX On'}</span>
          </button>
          {!inline && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
        }}
      >
        {PARTY_SOUNDS.map((snd) => {
          const isCurrentActive = lastPlayed === snd.label;
          return (
            <button
              key={snd.id}
              type="button"
              onClick={() => handlePlay(snd.id, snd.label)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: isCurrentActive ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: isCurrentActive ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '10px 12px',
                color: '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.18s ease',
                boxShadow: isCurrentActive ? '0 0 16px rgba(239, 68, 68, 0.35)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isCurrentActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrentActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <span
                style={{
                  fontSize: '22px',
                  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
                  lineHeight: 1,
                }}
              >
                {snd.icon}
              </span>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap' }}>
                  {snd.label}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {snd.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: '12px',
          padding: '8px 10px',
          borderRadius: '8px',
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '11px',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>⚡ Synchronized in real-time across all party guests</span>
        {lastPlayed && (
          <span style={{ color: '#f87171', fontWeight: 700 }}>
            Broadcasted: {lastPlayed}
          </span>
        )}
      </div>
    </div>
  );

  if (inline) {
    return <div className="soundboard-inline-panel">{soundGridContent}</div>;
  }

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
          background: isOpen ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.08)',
          border: isOpen ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          padding: '6px 12px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 600,
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{ fontSize: '14px' }}>🔊</span>
        <span>Soundboard</span>
        {lastPlayed && (
          <span
            style={{
              fontSize: '11px',
              background: '#ef4444',
              padding: '1px 6px',
              borderRadius: '10px',
              animation: 'pulse 1s infinite',
              fontWeight: 700,
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
            width: '320px',
            background: 'rgba(15, 20, 32, 0.98)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '14px',
            padding: '14px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.75), 0 0 25px rgba(239, 68, 68, 0.15)',
            zIndex: 100,
          }}
        >
          {soundGridContent}
        </div>
      )}
    </div>
  );
};
