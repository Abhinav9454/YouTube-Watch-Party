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
  HelpCircle,
  Volume2,
  VolumeX,
  ArrowLeft,
  LogIn,
  UserPlus,
  Menu,
  X,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      style={{
        height: '62px',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(9, 12, 22, 0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.35)',
      }}
    >
      {/* 1. BRAND & ROOM CONTEXT (LEFT) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Back to Lobby Pill (When in room) */}
        {roomId && (
          <button
            onClick={onBackToLobby || onLeaveRoom}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = '#cbd5e1';
            }}
            title="Leave room & return to Lobby"
          >
            <ArrowLeft size={14} />
            <span>Lobby</span>
          </button>
        )}

        {/* Brand Logo & Title */}
        <div
          onClick={roomId ? onBackToLobby : undefined}
          style={{
            cursor: roomId ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
          title={roomId ? 'Return to Lobby' : undefined}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.5)',
              flexShrink: 0,
            }}
          >
            <Tv size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '6px', color: '#fff' }}>
              <span>SyncWave</span>
              <span
                style={{
                  color: '#818cf8',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  letterSpacing: '0.5px',
                }}
              >
                PARTY
              </span>
            </div>
            {roomName && (
              <div
                style={{
                  fontSize: '0.72rem',
                  color: '#94a3b8',
                  fontWeight: 500,
                  maxWidth: '180px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {roomName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. CENTER SECTION: ELEGANT NAV (LOBBY) OR SHARE CAPSULE (ROOM) */}
      {!roomId ? (
        /* Minimalist Navigation Links on Lobby */
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }} className="desktop-only">
          <button
            type="button"
            onClick={() => document.getElementById('public-parties')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            Live Parties
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            FAQ
          </button>
        </nav>
      ) : (
        /* Unified Room Share Capsule when inside room */
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '30px',
            padding: '3px 4px 3px 12px',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.5px' }}>
            ROOM
          </span>
          <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.5px' }}>
            {roomId}
          </span>

          <button
            onClick={handleCopyLink}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${copied ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
              color: copied ? '#10b981' : '#cbd5e1',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Copy party invite link"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={() => setIsShareOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(168, 85, 247, 0.35))',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#d8b4fe',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Invite friends via QR code & social cards"
          >
            <QrCode size={12} />
            <span>Invite</span>
          </button>
        </div>
      )}

      {/* 3. RIGHT SECTION: UTILITIES & USER PROFILE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Compact Sound Effects Toggle */}
        <button
          onClick={toggleSoundEffects}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: isSfxMuted ? '#f43f5e' : '#10b981',
            transition: 'all 0.2s',
          }}
          title={isSfxMuted ? 'Sound Effects: Muted' : 'Sound Effects: Active'}
        >
          {isSfxMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        {/* Compact Keyboard Shortcuts Help */}
        <button
          onClick={() => setIsShortcutsOpen(true)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#94a3b8',
            transition: 'all 0.2s',
          }}
          title="Keyboard Shortcuts Guide (?)"
        >
          <HelpCircle size={15} />
        </button>

        {/* Minimalist Live Connection Dot */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 8px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            fontSize: '0.72rem',
            color: '#64748b',
            fontWeight: 600,
          }}
          title={isConnected ? 'Connected to WebSocket Server' : 'Disconnected, reconnecting...'}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#10b981' : '#f43f5e',
              boxShadow: isConnected ? '0 0 8px #10b981' : '0 0 8px #f43f5e',
            }}
          />
          <span className="desktop-only">{isConnected ? 'Live' : 'Offline'}</span>
        </div>

        {/* User Profile / Auth Area */}
        {authUser ? (
          /* Logged In User */
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '30px',
                padding: '4px 10px 4px 6px',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{authUser.avatar || '🍿'}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{authUser.username}</span>
            </button>

            {showProfileMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  width: '210px',
                  background: 'rgba(16, 20, 32, 0.98)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.7)',
                  padding: '10px',
                  zIndex: 100,
                }}
              >
                <div style={{ paddingBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{authUser.username}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis' }}>{authUser.email}</div>
                </div>

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: '8px',
                      color: '#f87171',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Guest / Not Logged In */
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '0.76rem',
                    color: '#cbd5e1',
                  }}
                >
                  {getRoleIcon()}
                  <span style={{ fontWeight: 600 }}>{username}</span>
                </div>
              </div>
            )}

            {!roomId && onOpenAuth && (
              <button
                onClick={() => onOpenAuth('signin')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
              >
                <LogIn size={13} />
                <span>Sign In</span>
              </button>
            )}

            {!roomId && onOpenAuth && (
              <button
                onClick={() => onOpenAuth('signup')}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  borderRadius: '20px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 10px rgba(99, 102, 241, 0.35)',
                  transition: 'all 0.2s',
                }}
              >
                <UserPlus size={13} />
                <span>Get Started</span>
              </button>
            )}
          </div>
        )}

        {/* Distinct Leave Button (inside room) */}
        {roomId && onLeaveRoom && (
          <button
            onClick={onLeaveRoom}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              padding: '5px 10px',
              borderRadius: '16px',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Leave party session"
          >
            <LogOut size={13} />
            <span>Leave</span>
          </button>
        )}

        {/* Mobile Hamburger Menu (Lobby only) */}
        {!roomId && (
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-only"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              color: '#fff',
              cursor: 'pointer',
            }}
            title="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={17} color="#f43f5e" /> : <Menu size={17} color="#818cf8" />}
          </button>
        )}
      </div>

      {/* Mobile Drawer (Lobby mode) */}
      {!roomId && isMobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'rgba(12, 16, 28, 0.98)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            zIndex: 9999,
          }}
          className="animate-fade-in"
        >
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              document.getElementById('launcher-card')?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}
          >
            🚀 Create Watch Party
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              document.getElementById('public-parties')?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
          >
            🔥 Live Public Parties
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
          >
            ⚡ How It Works
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
          >
            💎 Platform Features
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
          >
            ❓ Frequently Asked Questions
          </button>
        </div>
      )}

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
