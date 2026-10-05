import React, { useState } from 'react';
import {
  Tv,
  Code2,
  Shield,
  FileText,
  Lock,
  ExternalLink,
  ChevronUp,
  Cpu,
  CheckCircle2,
  Sparkles,
  Heart,
  X,
  Radio,
  Zap,
} from 'lucide-react';

interface FooterProps {
  onOpenShortcuts?: () => void;
  onNavigateSection?: (sectionId: string) => void;
}

type LegalModalType = 'privacy' | 'terms' | 'fairuse' | null;

export const Footer: React.FC<FooterProps> = ({ onOpenShortcuts, onNavigateSection }) => {
  const [activeLegalModal, setActiveLegalModal] = useState<LegalModalType>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNav = (sectionId: string) => {
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'linear-gradient(180deg, rgba(13, 17, 27, 0.95) 0%, rgba(7, 9, 14, 1) 100%)',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        zIndex: 10,
        marginTop: 'auto',
      }}
    >
      {/* Top Gradient Border Line */}
      <div
        style={{
          height: '1px',
          width: '100%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.5) 50%, transparent 100%)',
        }}
      />

      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '60px 24px 30px 24px' }}>
        {/* Main Footer Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '40px',
            marginBottom: '50px',
          }}
        >
          {/* Column 1: Brand & Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
                }}
              >
                <Tv size={20} color="#fff" />
              </div>
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                  SyncWave
                </span>
                <span
                  style={{
                    marginLeft: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#818cf8',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                  }}
                >
                  PRO
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              The high-performance, open-source collaborative streaming platform. Watch synchronized YouTube videos with friends with sub-second sync, WebRTC voice/video, and interactive trivia.
            </p>

            {/* Live Operational Status Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '9999px',
                width: 'fit-content',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 10px #10b981',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#34d399' }}>
                All Systems Operational
              </span>
              <span style={{ fontSize: '11px', color: '#6ee7b7', opacity: 0.8 }}>• &lt;15ms</span>
            </div>
          </div>

          {/* Column 2: Platform Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Features
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('features')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Zap size={13} color="#818cf8" /> Sub-Second Timeline Sync
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('features')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Radio size={13} color="#38bdf8" /> WebRTC Voice & Video Grid
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('features')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Sparkles size={13} color="#f43f5e" /> 3D Floating Snacks & Gifts
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('features')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle2 size={13} color="#c084fc" /> Synchronized Trivia Quizzes
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('features')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Cpu size={13} color="#facc15" /> 3D Cinema Equalizer & Looper
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('features')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FileText size={13} color="#34d399" /> Subtitle Drag & Drop (.SRT)
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Tech Architecture */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Architecture
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }} />
                Java 21 LTS + Spring Boot 3.3
              </li>
              <li style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                MongoDB Atlas Cloud Database
              </li>
              <li style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />
                React 19 + TypeScript + Vite
              </li>
              <li style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a855f7' }} />
                STOMP over WebSocket Protocol
              </li>
              <li style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                WebRTC P2P Mesh Audio/Video
              </li>
              <li style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4' }} />
                Docker Multi-Stage Cloud Deploy
              </li>
            </ul>
          </div>

          {/* Column 4: Resources & Community */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Resources & Legal
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <a
                  href="https://github.com/Abhinav9454/YouTube-Watch-Party"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#94a3b8', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Code2 size={14} color="#818cf8" /> GitHub Repository
                  <ExternalLink size={11} color="#64748b" />
                </a>
              </li>
              {onOpenShortcuts && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenShortcuts}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Cpu size={13} color="#818cf8" /> Keyboard Shortcuts Guide (?)
                  </button>
                </li>
              )}
              <li>
                <button
                  type="button"
                  onClick={() => setActiveLegalModal('privacy')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Lock size={13} color="#34d399" /> Privacy & Zero-Data Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveLegalModal('terms')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FileText size={13} color="#818cf8" /> Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveLegalModal('fairuse')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Shield size={13} color="#f43f5e" /> YouTube API & Fair Use
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            fontSize: '12px',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>© 2026 SyncWave Party. Built with</span>
            <Heart size={13} color="#f43f5e" fill="#f43f5e" />
            <span>for seamless group streaming worldwide.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <span>v2.5.0 Production</span>
            <span>•</span>
            <span>MongoDB Atlas Secured</span>
            <span>•</span>
            <button
              type="button"
              onClick={scrollToTop}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                padding: '5px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                transition: 'all 0.2s',
              }}
            >
              <ChevronUp size={14} /> Back to Top
            </button>
          </div>
        </div>
      </div>

      {/* Legal & Policy Modals */}
      {activeLegalModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setActiveLegalModal(null)}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{
              maxWidth: '620px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              background: 'rgba(15, 20, 32, 0.98)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {activeLegalModal === 'privacy' && <Lock size={22} color="#34d399" />}
                {activeLegalModal === 'terms' && <FileText size={22} color="#818cf8" />}
                {activeLegalModal === 'fairuse' && <Shield size={22} color="#f43f5e" />}
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                  {activeLegalModal === 'privacy' && 'Privacy Policy & Zero Data Harvesting'}
                  {activeLegalModal === 'terms' && 'Terms of Service & Usage'}
                  {activeLegalModal === 'fairuse' && 'YouTube API & Fair Use Notice'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveLegalModal(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {activeLegalModal === 'privacy' && (
                <>
                  <p>
                    <strong>1. Zero Data Harvesting:</strong> SyncWave Party is built on an open-source, privacy-first architecture. We do not sell, track, or monetize personal user behavior, viewing habits, or device identifiers.
                  </p>
                  <p>
                    <strong>2. Account & Credentials:</strong> Passwords are cryptographically salted and hashed using SHA-256 before being committed to our encrypted MongoDB Atlas cloud instance. We never log plaintext passwords.
                  </p>
                  <p>
                    <strong>3. WebRTC Peer-to-Peer Voice & Video:</strong> Audio and video streams are transmitted directly peer-to-peer (P2P) between participants via WebRTC mesh connections. Streams do not pass through or get recorded on our central servers.
                  </p>
                  <p>
                    <strong>4. Ephemeral Room Data:</strong> Chat messages and trivia scores within temporary watch parties can be cleared at any time by the room host.
                  </p>
                </>
              )}

              {activeLegalModal === 'terms' && (
                <>
                  <p>
                    <strong>1. Acceptance of Terms:</strong> By creating or joining a room on SyncWave Party, you agree to respect community safety guidelines and not engage in abusive, harassing, or malicious conduct.
                  </p>
                  <p>
                    <strong>2. Host Authority:</strong> Room hosts retain authority to kick, mute, pass-protect, or transfer ownership of active party rooms.
                  </p>
                  <p>
                    <strong>3. Permitted Content:</strong> Users may synchronize public videos accessible via YouTube's standard embed APIs. Content that violates international copyright or local regulations is strictly prohibited.
                  </p>
                  <p>
                    <strong>4. Service Availability:</strong> SyncWave Party is provided free of charge under the open-source license. While our architecture targets 99.9% uptime, we are not liable for transient network disruptions.
                  </p>
                </>
              )}

              {activeLegalModal === 'fairuse' && (
                <>
                  <p>
                    <strong>1. YouTube IFrame API Compliance:</strong> SyncWave utilizes the official YouTube IFrame Player API for video playback. All video views, impressions, and creator ad monetization are tracked directly by YouTube.
                  </p>
                  <p>
                    <strong>2. No Video Hosting or Re-encoding:</strong> SyncWave does not download, re-host, mirror, or rip any YouTube video files. All media is streamed legitimately directly from Google's edge delivery servers.
                  </p>
                  <p>
                    <strong>3. Trademarks:</strong> YouTube is a registered trademark of Google LLC. SyncWave is an independent third-party tool and is not affiliated with or endorsed by Google LLC.
                  </p>
                </>
              )}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setActiveLegalModal(null)}
                style={{ padding: '8px 20px', fontSize: '13px' }}
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
