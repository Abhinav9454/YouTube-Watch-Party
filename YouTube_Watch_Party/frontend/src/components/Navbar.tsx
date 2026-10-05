import React, { useState } from 'react';
import { Tv, LogOut, LogIn, Sparkles } from 'lucide-react';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar: string;
}

interface NavbarProps {
  authUser?: AuthUser | null;
  isConnected?: boolean;
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  authUser,
  onOpenAuth,
  onLogout,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const scrollToLauncher = () => {
    const el = document.getElementById('launcher-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header
      style={{
        height: '60px',
        padding: '0 24px',
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
      }}
    >
      {/* Brand */}
      <div
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          userSelect: 'none',
        }}
        title="SyncWave - YouTube Watch Party"
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
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.45)',
          }}
        >
          <Tv size={18} color="#fff" />
        </div>
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
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {authUser ? (
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
                borderRadius: '24px',
                padding: '4px 12px 4px 8px',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
            >
              <span style={{ fontSize: '1rem' }}>{authUser.avatar || '🍿'}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{authUser.username}</span>
            </button>

            {showProfileMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '125%',
                  right: 0,
                  width: '180px',
                  background: 'rgba(16, 20, 32, 0.98)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.7)',
                  padding: '10px',
                  zIndex: 100,
                }}
              >
                <div style={{ paddingBottom: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{authUser.username}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis' }}>{authUser.email}</div>
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
                      padding: '7px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: '8px',
                      color: '#f87171',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onOpenAuth && (
              <button
                type="button"
                onClick={() => onOpenAuth('signin')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
            )}

            <button
              type="button"
              onClick={scrollToLauncher}
              style={{
                padding: '7px 16px',
                fontSize: '0.85rem',
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
              <Sparkles size={14} />
              <span>Start Party</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
