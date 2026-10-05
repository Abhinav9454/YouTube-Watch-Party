import React, { useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Space / K', desc: 'Play / Pause Video (Host & Moderator)' },
  { key: 'M', desc: 'Toggle Mute / Unmute Audio' },
  { key: 'F', desc: 'Toggle Fullscreen Mode' },
  { key: 'T', desc: 'Toggle Cinema / Theater Mode' },
  { key: 'P', desc: 'Toggle Floating Mini-Player (PiP)' },
  { key: '← / →', desc: 'Seek Backward / Forward 5s (Host & Mod)' },
  { key: '↑ / ↓', desc: 'Adjust YouTube Player Volume' },
  { key: '?', desc: 'Toggle this Shortcuts Guide' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 30px rgba(99, 102, 241, 0.25)',
          background: 'rgba(15, 20, 32, 0.96)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}
            >
              <Keyboard size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                Keyboard Shortcuts
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Control your watch party effortlessly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {SHORTCUTS.map((s) => (
            <div
              key={s.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{s.desc}</span>
              <kbd className="kbd-badge">{s.key}</kbd>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            className="btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
