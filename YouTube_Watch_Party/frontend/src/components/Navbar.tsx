import React, { useState } from 'react';
import { Tv, Copy, Check, LogOut, Crown, Shield, User, QrCode, Keyboard, Volume2, VolumeX } from 'lucide-react';
import type { Role } from '../types/party';
import { ShareModal } from './ShareModal';
import { AvatarCustomizer } from './AvatarCustomizer';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { soundEffects } from '../services/soundEffects';

interface NavbarProps {
  roomId?: string;
  roomName?: string;
  username?: string;
  userRole?: Role;
  isConnected: boolean;
  onLeaveRoom?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomId,
  roomName,
  username,
  userRole,
  isConnected,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(() => soundEffects.isMuted());

  const handleCopyLink = () => {
    if (!roomId) return;
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleSoundEffects = () => {
    const nextState = !isSfxMuted;
    soundEffects.setMuted(nextState);
    setIsSfxMuted(nextState);
  };

  const getRoleIcon = () => {
    switch (userRole) {
      case 'HOST':
        return <Crown size={12} color="#fbbf24" />;
      case 'MODERATOR':
        return <Shield size={12} color="#38bdf8" />;
      default:
        return <User size={12} color="#94a3b8" />;
    }
  };

  return (
    <header
      className="glass-panel"
      style={{
        borderRadius: 0,
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand & Room Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.45)',
          }}
        >
          <Tv size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>SyncWave</span>
            <span style={{ color: '#818cf8', fontWeight: 600, fontSize: '0.85rem', background: 'rgba(99, 102, 241, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
              PARTY
            </span>
          </div>
          {roomName && (
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
              {roomName}
            </div>
          )}
        </div>
      </div>

      {/* Center Room Code & Share Controls (when in room) */}
      {roomId && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            onClick={handleCopyLink}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: copied ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${copied ? '#10b981' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              transition: 'all 0.2s',
            }}
            title="Click to copy room link"
          >
            <span style={{ color: 'var(--text-dim)' }}>Room:</span>
            <span className="code-pill">{roomId}</span>
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} color="#94a3b8" />}
          </div>

          <button
            onClick={() => setIsShareOpen(true)}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
            title="Open QR Code & Share modal"
          >
            <QrCode size={14} color="#818cf8" />
            <span>Share & QR</span>
          </button>
        </div>
      )}

      {/* Right Controls: SFX toggle, Shortcuts, Profile, Status, Leave */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Sound Effects Toggle */}
        <button
          onClick={toggleSoundEffects}
          className="btn-secondary"
          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
          title={isSfxMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        >
          {isSfxMuted ? <VolumeX size={15} color="#f43f5e" /> : <Volume2 size={15} color="#10b981" />}
        </button>

        {/* Keyboard Shortcuts Help */}
        <button
          onClick={() => setIsShortcutsOpen(true)}
          className="btn-secondary"
          style={{ padding: '6px 10px', fontSize: '0.8rem', gap: '5px' }}
          title="Keyboard shortcuts guide (?)"
        >
          <Keyboard size={15} color="#818cf8" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Shortcuts</span>
        </button>

        {/* Connection Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            padding: '4px 8px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-xs)',
          }}
          title={isConnected ? 'Connected to real-time server' : 'Disconnected, attempting to reconnect...'}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#10b981' : '#f43f5e',
              boxShadow: isConnected ? '0 0 8px #10b981' : '0 0 8px #f43f5e',
            }}
          />
          <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>{isConnected ? 'Online' : 'Reconnecting'}</span>
        </div>

        {/* User Pill & Avatar */}
        {username && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AvatarCustomizer currentUsername={username} />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.82rem',
              }}
            >
              {getRoleIcon()}
              <span style={{ fontWeight: 600 }}>{username}</span>
              {userRole && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'capitalize' }}>
                  ({userRole.toLowerCase()})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Leave Room Button */}
        {onLeaveRoom && (
          <button
            onClick={onLeaveRoom}
            className="btn-danger"
            style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px', display: 'flex', alignItems: 'center' }}
            title="Leave party session"
          >
            <LogOut size={14} /> Leave
          </button>
        )}
      </div>

      {roomId && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          roomId={roomId}
          roomName={roomName || 'Watch Party'}
        />
      )}

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </header>
  );
};
