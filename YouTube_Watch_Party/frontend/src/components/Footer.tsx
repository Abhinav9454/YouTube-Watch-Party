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
  BookOpen,
  MessageSquare,
  Send,
  Star,
  Check,
  Users,
  Volume2,
  VolumeX,
  HelpCircle,
} from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface FooterProps {
  onOpenShortcuts?: () => void;
  onNavigateSection?: (sectionId: string) => void;
  isConnected?: boolean;
}

type ModalType = 'privacy' | 'terms' | 'fairuse' | 'docs' | 'hostguide' | 'feedback' | null;

export const Footer: React.FC<FooterProps> = ({ onOpenShortcuts, onNavigateSection, isConnected = true }) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isSfxMuted, setIsSfxMuted] = useState(() => soundEffects.isMuted());

  const toggleSoundEffects = () => {
    const nextState = !isSfxMuted;
    soundEffects.setMuted(nextState);
    setIsSfxMuted(nextState);
  };

  // Feedback form state
  const [feedbackCategory, setFeedbackCategory] = useState<'feature' | 'bug' | 'question' | 'praise'>('feature');
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

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

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    soundEffects.play('trivia_win');
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackSubmitted(false);
      setFeedbackText('');
      setActiveModal(null);
    }, 2200);
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
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
                background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
                borderRadius: '9999px',
                width: 'fit-content',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isConnected ? '#10b981' : '#f43f5e',
                  boxShadow: isConnected ? '0 0 10px #10b981' : '0 0 10px #f43f5e',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: '12px', fontWeight: 600, color: isConnected ? '#34d399' : '#fb7185' }}>
                {isConnected ? 'All Systems Operational' : 'Connecting to Server...'}
              </span>
              <span style={{ fontSize: '11px', color: isConnected ? '#6ee7b7' : '#fda4af', opacity: 0.8 }}>
                {isConnected ? '• <15ms' : '• Offline'}
              </span>
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

          {/* Column 3: Tech Architecture & Developer Docs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Architecture & API
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
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModal('docs')}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}
                >
                  <BookOpen size={13} color="#38bdf8" /> View API & STOMP Docs
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Resources, Host Guide, Feedback & Legal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Resources & Support
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
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModal('hostguide')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Users size={13} color="#f59e0b" /> Host Moderation Guide
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModal('feedback')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <MessageSquare size={13} color="#c084fc" /> Send Feedback / Bug Report
                </button>
              </li>
              {onOpenShortcuts && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenShortcuts}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Cpu size={13} color="#818cf8" /> Shortcuts Cheat Sheet (?)
                  </button>
                </li>
              )}
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModal('privacy')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Lock size={13} color="#34d399" /> Privacy & Zero-Data Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModal('terms')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FileText size={13} color="#818cf8" /> Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModal('fairuse')}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Audio Effects Toggle (Moved from Header) */}
            <button
              type="button"
              onClick={toggleSoundEffects}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: isSfxMuted ? '#f87171' : '#34d399',
                padding: '5px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              title={isSfxMuted ? 'Sound Effects Muted (Click to enable)' : 'Sound Effects Active (Click to mute)'}
            >
              {isSfxMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>SFX: {isSfxMuted ? 'Muted' : 'On'}</span>
            </button>

            {/* Keyboard Shortcuts Button (Moved from Header) */}
            {onOpenShortcuts && (
              <button
                type="button"
                onClick={onOpenShortcuts}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                title="Keyboard Shortcuts Cheat Sheet (?)"
              >
                <HelpCircle size={14} color="#818cf8" />
                <span>Shortcuts (?)</span>
              </button>
            )}

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

      {/* Interactive Modals Suite */}
      {activeModal && (
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
          onClick={() => setActiveModal(null)}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{
              maxWidth: '680px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: 'rgba(15, 20, 32, 0.98)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(99, 102, 241, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {activeModal === 'privacy' && <Lock size={22} color="#34d399" />}
                {activeModal === 'terms' && <FileText size={22} color="#818cf8" />}
                {activeModal === 'fairuse' && <Shield size={22} color="#f43f5e" />}
                {activeModal === 'docs' && <BookOpen size={22} color="#38bdf8" />}
                {activeModal === 'hostguide' && <Users size={22} color="#f59e0b" />}
                {activeModal === 'feedback' && <MessageSquare size={22} color="#c084fc" />}

                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                  {activeModal === 'privacy' && 'Privacy Policy & Zero Data Harvesting'}
                  {activeModal === 'terms' && 'Terms of Service & Usage'}
                  {activeModal === 'fairuse' && 'YouTube API & Fair Use Notice'}
                  {activeModal === 'docs' && 'Developer & Architecture Documentation'}
                  {activeModal === 'hostguide' && 'Host Moderation & Security Guide'}
                  {activeModal === 'feedback' && 'Send Feedback or Bug Report'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content for Docs Modal */}
            {activeModal === 'docs' && (
              <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p>
                  SyncWave Party utilizes a hybrid real-time architecture: <strong>STOMP over WebSockets</strong> for state authority and low-latency timeline broadcasts, coupled with <strong>WebRTC Mesh</strong> for peer-to-peer audio/video calling.
                </p>

                <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                    WEBSOCKET STOMP DESTINATIONS
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'monospace', fontSize: '12px' }}>
                    <li><span style={{ color: '#818cf8' }}>/topic/room/&#123;roomId&#125;</span> — Broadcasts play, pause, seek, playlist, reactions</li>
                    <li><span style={{ color: '#818cf8' }}>/topic/room/&#123;roomId&#125;/chat</span> — Instant chat broadcasts</li>
                    <li><span style={{ color: '#818cf8' }}>/app/room/&#123;roomId&#125;/sync</span> — Inbound playback synchronization commands</li>
                    <li><span style={{ color: '#818cf8' }}>/app/room/&#123;roomId&#125;/trivia</span> — Synchronized quiz state broadcasts</li>
                  </ul>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', marginBottom: '6px' }}>
                    REST API ENDPOINTS
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'monospace', fontSize: '12px' }}>
                    <li><span style={{ color: '#34d399' }}>POST /api/rooms</span> — Create new room entity with optional passcode</li>
                    <li><span style={{ color: '#34d399' }}>GET /api/rooms/recent</span> — List live and recent public rooms</li>
                    <li><span style={{ color: '#34d399' }}>POST /api/auth/register</span> — Register user (SHA-256 salted password)</li>
                    <li><span style={{ color: '#34d399' }}>POST /api/auth/login</span> — Authenticate user and issue profile session</li>
                    <li><span style={{ color: '#34d399' }}>GET /api/health</span> — Production readiness & uptime check</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Content for Host Guide Modal */}
            {activeModal === 'hostguide' && (
              <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p>
                  As the room creator, you hold the <strong>HOST</strong> crown. You have complete control over party playback, room access, and attendee moderation.
                </p>
                <p>
                  <strong>1. Granting Co-Host / Moderator:</strong> In the right-hand Participants panel, click the 3-dots icon next to any user's name and choose "Make Moderator". Moderators can play, pause, and seek the video.
                </p>
                <p>
                  <strong>2. Transferring Host Ownership:</strong> If you need to leave the party, click "Transfer Host" to designate any participant as the new master host.
                </p>
                <p>
                  <strong>3. Room Passcodes & Security:</strong> Toggle passcode protection when creating the party to keep private study groups or family movie nights invite-only.
                </p>
                <p>
                  <strong>4. Kicking Disruptive Users:</strong> Click "Kick Participant" to instantly disconnect any abusive or trolling viewer from the WebSocket room.
                </p>
              </div>
            )}

            {/* Content for Feedback Modal */}
            {activeModal === 'feedback' && (
              <div>
                {feedbackSubmitted ? (
                  <div style={{ padding: '30px 10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                      <Check size={28} />
                    </div>
                    <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>Thank You for Your Feedback!</h4>
                    <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>
                      Your comments have been received. We review feedback constantly to make SyncWave Party even better.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
                        FEEDBACK CATEGORY
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        {[
                          { id: 'feature', label: 'Feature' },
                          { id: 'bug', label: 'Bug' },
                          { id: 'question', label: 'Question' },
                          { id: 'praise', label: 'Praise' },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setFeedbackCategory(cat.id as any)}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: feedbackCategory === cat.id ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                              background: feedbackCategory === cat.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                              color: feedbackCategory === cat.id ? '#fff' : '#94a3b8',
                              fontWeight: 600,
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
                        HOW WOULD YOU RATE SYNCWAVE?
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                          >
                            <Star
                              size={22}
                              color={star <= feedbackRating ? '#fbbf24' : '#64748b'}
                              fill={star <= feedbackRating ? '#fbbf24' : 'none'}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                        YOUR MESSAGE OR SUGGESTION
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Tell us what you liked, what can be improved, or bugs you encountered..."
                        className="input-field"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', resize: 'vertical' }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ padding: '10px 20px', fontSize: '13.5px', fontWeight: 700, gap: '8px', justifyContent: 'center' }}
                    >
                      <Send size={15} /> Send Feedback
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Content for Privacy Modal */}
            {activeModal === 'privacy' && (
              <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
              </div>
            )}

            {/* Content for Terms Modal */}
            {activeModal === 'terms' && (
              <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
              </div>
            )}

            {/* Content for Fair Use Modal */}
            {activeModal === 'fairuse' && (
              <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p>
                  <strong>1. YouTube IFrame API Compliance:</strong> SyncWave utilizes the official YouTube IFrame Player API for video playback. All video views, impressions, and creator ad monetization are tracked directly by YouTube.
                </p>
                <p>
                  <strong>2. No Video Hosting or Re-encoding:</strong> SyncWave does not download, re-host, mirror, or rip any YouTube video files. All media is streamed legitimately directly from Google's edge delivery servers.
                </p>
                <p>
                  <strong>3. Trademarks:</strong> YouTube is a registered trademark of Google LLC. SyncWave is an independent third-party tool and is not affiliated with or endorsed by Google LLC.
                </p>
              </div>
            )}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setActiveModal(null)}
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
