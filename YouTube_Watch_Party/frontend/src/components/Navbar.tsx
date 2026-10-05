import React, { useState } from 'react';
import {
  Tv,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import type { Role } from '../types/party';

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
  isConnected?: boolean;
  onLeaveRoom?: () => void;
  authUser?: AuthUser | null;
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
  onLogout?: () => void;
  onBackToLobby?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  authUser,
  onOpenAuth,
  onLogout,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      style={{
        height: '64px',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(9, 12, 22, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.35)',
      }}
    >
      {/* 1. BRAND LOGO & TITLE (LEFT) */}
      <div
        onClick={scrollToTop}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          userSelect: 'none',
        }}
        title="SyncWave Home"
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 18px rgba(99, 102, 241, 0.5)',
            flexShrink: 0,
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Tv size={20} color="#fff" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: '1.2rem',
              letterSpacing: '-0.3px',
              color: '#fff',
            }}
          >
            SyncWave
          </span>
          <span
            style={{
              color: '#818cf8',
              fontWeight: 700,
              fontSize: '0.68rem',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              padding: '2px 7px',
              borderRadius: '10px',
              letterSpacing: '0.6px',
            }}
          >
            PARTY
          </span>
        </div>
      </div>

      {/* 2. CENTER SECTION: MINIMALIST NAVIGATION LINKS */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="desktop-only">
        <button
          type="button"
          onClick={() => scrollToSection('public-parties')}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'color 0.2s',
            padding: '6px 0',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          Live Parties
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('features')}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'color 0.2s',
            padding: '6px 0',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          Features
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('how-it-works')}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'color 0.2s',
            padding: '6px 0',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          How It Works
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('faq')}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'color 0.2s',
            padding: '6px 0',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          FAQ
        </button>
      </nav>

      {/* 3. RIGHT SECTION: AUTHENTICATION CTAS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {authUser ? (
          /* Logged In User Profile */
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '30px',
                padding: '4px 12px 4px 6px',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
            >
              <span style={{ fontSize: '1.15rem' }}>{authUser.avatar || '🍿'}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{authUser.username}</span>
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
                  padding: '12px',
                  zIndex: 100,
                }}
              >
                <div style={{ paddingBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>{authUser.username}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis' }}>{authUser.email}</div>
                </div>

                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: '8px',
                      color: '#f87171',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Guest / Not Logged In */
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onOpenAuth && (
              <button
                type="button"
                onClick={() => onOpenAuth('signin')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '7px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>
            )}

            {onOpenAuth ? (
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                style={{
                  padding: '7px 16px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  borderRadius: '20px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 14px rgba(99, 102, 241, 0.35)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 14px rgba(99, 102, 241, 0.35)';
                }}
              >
                <UserPlus size={14} />
                <span>Get Started</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => scrollToSection('launcher-card')}
                style={{
                  padding: '7px 16px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  borderRadius: '20px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={14} />
                <span>Start Party</span>
              </button>
            )}
          </div>
        )}

        {/* Mobile Hamburger Menu Toggle */}
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
          {isMobileMenuOpen ? <X size={18} color="#f43f5e" /> : <Menu size={18} color="#818cf8" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
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
            onClick={() => scrollToSection('launcher-card')}
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>🚀</span>
            <span>Create / Join Party</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('public-parties')}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', padding: '6px 0' }}
          >
            🔥 Live Public Parties
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('features')}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', padding: '6px 0' }}
          >
            💎 Platform Features
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('how-it-works')}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', padding: '6px 0' }}
          >
            ⚡ How It Works
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('faq')}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', padding: '6px 0' }}
          >
            ❓ Frequently Asked Questions
          </button>
        </div>
      )}
    </header>
  );
};
