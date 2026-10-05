import React, { useState } from 'react';
import {
  Tv,
  Copy,
  Check,
  LogOut,
  Crown,
  Shield,
  User,
  QrCode,
  Keyboard,
  Volume2,
  VolumeX,
  ArrowLeft,
  LogIn,
  UserPlus,
} from 'lucide-react';
import type { Role } from '../types/party';
import { ShareModal } from './ShareModal';
import { AvatarCustomizer } from './AvatarCustomizer';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { soundEffects } from '../services/soundEffects';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar: string;
}

interface NavbarProps {
  roomId?: string;
  roomName?: string;
  username?: string;
  userRole?: Role;
  isConnected: boolean;
  onLeaveRoom?: () => void;
  authUser?: AuthUser | null;
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
  onLogout?: () => void;
  onBackToLobby?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomId,
  roomName,
  username,
  userRole,
  isConnected,
  onLeaveRoom,
  authUser,
  onOpenAuth,
  onLogout,
  onBackToLobby,
}) => {
  const [copied, setCopied] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(() => soundEffects.isMuted());
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand & Room Info + Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Back to Lobby Button (Visible when inside a room) */}
        {roomId && (
          <button
            onClick={onBackToLobby || onLeaveRoom}
            className="btn-secondary"
            style={{
              padding: '6px 10px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(255, 255, 255, 0.08)',
            }}
            title="Go back to Home / Lobby"
          >
            <ArrowLeft size={15} />
            <span>Lobby</span>
          </button>
        )}

        <div
          onClick={roomId ? onBackToLobby : undefined}
          style={{
            cursor: roomId ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
          title={roomId ? 'Click to return to Lobby' : undefined}
        >
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
              <span style={{ color: '#818cf8', fontWeight: 600, fontSize: '0.8rem', background: 'rgba(99, 102, 241, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                PARTY
              </span>
            </div>
            {roomName && (
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                {roomName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center Navigation Links (when on Landing Page / Lobby) */}
      {!roomId ? (
        <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }} className="desktop-only">
          <button
            type="button"
            onClick={() => document.getElementById('launcher-card')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
          >
            Create Party
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('public-parties')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
          >
            Live Parties
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('comparison')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
          >
            Why Us
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
          >
            FAQ
          </button>
        </nav>
      ) : (
        /* Center Room Code & Share Controls (when in room) */
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

      {/* Right Controls: SFX, Shortcuts, Connection, User / Auth buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Sound Effects Toggle */}
        <button
          onClick={toggleSoundEffects}
          className="btn-secondary"
          style={{ padding: '6px 9px', fontSize: '0.8rem' }}
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
          <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Shortcuts</span>
        </button>

        {/* Connection Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.75rem',
            padding: '4px 8px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-xs)',
          }}
          title={isConnected ? 'Connected to real-time server' : 'Disconnected, attempting to reconnect...'}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#10b981' : '#f43f5e',
              boxShadow: isConnected ? '0 0 8px #10b981' : '0 0 8px #f43f5e',
            }}
          />
          <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>{isConnected ? 'Live' : 'Offline'}</span>
        </div>

        {/* User Profile or Sign In / Sign Up */}
        {authUser ? (
          /* LOGGED IN USER PROFILE */
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '9999px',
                padding: '4px 12px 4px 6px',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{authUser.avatar || '🍿'}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{authUser.username}</span>
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                }}
              >
                PRO
              </span>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  width: '230px',
                  background: 'rgba(20, 20, 32, 0.98)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '0.75rem',
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6)',
                  padding: '0.75rem',
                  zIndex: 100,
                }}
              >
                <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>{authUser.username}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', wordBreak: 'break-all' }}>{authUser.email}</div>
                </div>

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '0.5rem',
                      color: '#f87171',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* NOT LOGGED IN: SIGN IN & SIGN UP BUTTONS */
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Guest Identifier (if present) */}
            {username && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AvatarCustomizer currentUsername={username} />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.78rem',
                  }}
                >
                  {getRoleIcon()}
                  <span style={{ fontWeight: 600 }}>{username}</span>
                </div>
              </div>
            )}

            {onOpenAuth && (
              <>
                <button
                  onClick={() => onOpenAuth('signin')}
                  className="btn-secondary"
                  style={{
                    padding: '5px 10px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    gap: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <LogIn size={13} />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => onOpenAuth('signup')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 10px rgba(236, 72, 153, 0.35)',
                    transition: 'all 0.2s',
                  }}
                >
                  <UserPlus size={13} />
                  <span>Sign Up</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Leave Room Button (when in room) */}
        {roomId && onLeaveRoom && (
          <button
            onClick={onLeaveRoom}
            className="btn-danger"
            style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '5px', display: 'flex', alignItems: 'center' }}
            title="Leave party session"
          >
            <LogOut size={13} /> Leave
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
