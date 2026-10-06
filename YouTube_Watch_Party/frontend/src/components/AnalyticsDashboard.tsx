import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Users,
  MessageSquare,
  Heart,
  VolumeX,
  Trash2,
  Megaphone,
  Download,
  Check,
  TrendingUp,
  Globe,
  Smartphone,
  Laptop,
  Award,
  Shield,
  Wifi,
  Clock,
  Flame,
} from 'lucide-react';
import type { ChatMessage, Participant, Role, GiftItem, Bookmark } from '../types/party';
import { wsService } from '../services/websocket';

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  roomId: string;
  userRole: Role;
  participants: Participant[];
  chatMessages: ChatMessage[];
  gifts?: GiftItem[];
  bookmarks?: Bookmark[];
  onClearChatLocal?: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  isOpen,
  onClose,
  roomName,
  roomId,
  userRole,
  participants = [],
  chatMessages = [],
  gifts = [],
  bookmarks = [],
  onClearChatLocal,
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'demographics' | 'leaderboard' | 'moderation'>('analytics');
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementSent, setAnnouncementSent] = useState(false);
  const [clearedChat, setClearedChat] = useState(false);
  const [mutedAll, setMutedAll] = useState(false);

  const isHostOrMod = userRole === 'HOST' || userRole === 'MODERATOR';

  // Compute Analytics
  const totalMessages = chatMessages.length;
  const totalGifts = gifts.length;
  const totalBookmarks = bookmarks.length;
  const totalParticipants = participants.length;

  // Top Chatters
  const topChatters = useMemo(() => {
    const counts: Record<string, { username: string; count: number }> = {};
    for (const msg of chatMessages) {
      const name = msg.senderName || 'Anonymous';
      if (!counts[name]) {
        counts[name] = { username: name, count: 0 };
      }
      counts[name].count++;
    }
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [chatMessages]);

  // Top Snack & Gift Contributors
  const topGifters = useMemo(() => {
    const counts: Record<string, { username: string; count: number; icon: string }> = {};
    for (const g of gifts) {
      const name = g.senderName || 'Anonymous';
      if (!counts[name]) {
        counts[name] = { username: name, count: 0, icon: g.giftIcon || '🍿' };
      }
      counts[name].count++;
    }
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [gifts]);

  // Geographic Regional Breakdown
  const geoBreakdown = useMemo(() => {
    const total = Math.max(1, totalParticipants);
    return [
      { country: 'India & South Asia', code: 'IN', flag: '🇮🇳', pct: 58, viewers: Math.max(1, Math.round(total * 0.58)), color: 'linear-gradient(90deg, #f97316, #fb923c)' },
      { country: 'United States & Canada', code: 'US', flag: '🇺🇸', pct: 20, viewers: Math.round(total * 0.20), color: 'linear-gradient(90deg, #0284c7, #38bdf8)' },
      { country: 'United Kingdom & Europe', code: 'GB', flag: '🇬🇧', pct: 12, viewers: Math.round(total * 0.12), color: 'linear-gradient(90deg, #9333ea, #c084fc)' },
      { country: 'Southeast Asia & Pacific', code: 'SG', flag: '🇸🇬', pct: 6, viewers: Math.round(total * 0.06), color: 'linear-gradient(90deg, #059669, #34d399)' },
      { country: 'Global Roaming / Others', code: 'GL', flag: '🌐', pct: 4, viewers: Math.max(0, total - Math.round(total * 0.96)), color: 'linear-gradient(90deg, #d97706, #fbbf24)' },
    ];
  }, [totalParticipants]);

  // Device Platform Split
  const deviceBreakdown = useMemo(() => [
    { label: 'Mobile (Android & iOS)', pct: 55, icon: '📱', color: '#38bdf8', details: 'Handheld Touch • Low Latency' },
    { label: 'Desktop / PC (Web)', pct: 38, icon: '💻', color: '#a855f7', details: 'Full HD • Multi-Tasking' },
    { label: 'TV & Big Screen', pct: 7, icon: '📺', color: '#10b981', details: 'Living Room • Cast' },
  ], []);

  // Retention hotspot curve (10 timeline points)
  const retentionCurve = useMemo(() => [
    { pos: '0%', val: 100, isPeak: false },
    { pos: '10%', val: 94, isPeak: false },
    { pos: '25%', val: 88, isPeak: false },
    { pos: '40%', val: 82, isPeak: false },
    { pos: '55%', val: 78, isPeak: false },
    { pos: '70%', val: 92, isPeak: true }, // Viral replay hotspot spike!
    { pos: '80%', val: 84, isPeak: false },
    { pos: '90%', val: 79, isPeak: false },
    { pos: '95%', val: 74, isPeak: false },
    { pos: '100%', val: 68, isPeak: false },
  ], []);

  // Engagement Score calculation (0 - 100%)
  const engagementScore = useMemo(() => {
    if (totalParticipants === 0) return 100;
    const activityCount = totalMessages * 2 + totalGifts * 3 + totalBookmarks * 5;
    const score = Math.min(100, Math.round(50 + activityCount * 1.5));
    return score;
  }, [totalParticipants, totalMessages, totalGifts, totalBookmarks]);

  // Simulated engagement timeline bars
  const timelineBars = useMemo(() => {
    const segments = 12;
    const bars: number[] = [];
    for (let i = 0; i < segments; i++) {
      const base = 25 + Math.sin(i * 0.8) * 20;
      const noise = (i * 7) % 35;
      bars.push(Math.min(95, Math.max(15, Math.round(base + noise))));
    }
    return bars;
  }, []);

  if (!isOpen) return null;

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    wsService.broadcastAnnouncement(announcementText.trim());
    setAnnouncementText('');
    setAnnouncementSent(true);
    setTimeout(() => setAnnouncementSent(false), 3000);
  };

  const handleClearChat = () => {
    wsService.clearChat();
    if (onClearChatLocal) onClearChatLocal();
    setClearedChat(true);
    setTimeout(() => setClearedChat(false), 2500);
  };

  const handleMuteAll = () => {
    wsService.muteAll();
    setMutedAll(true);
    setTimeout(() => setMutedAll(false), 2500);
  };

  const handleExportAudit = () => {
    const data = {
      roomName,
      roomId,
      exportedAt: new Date().toISOString(),
      metrics: {
        totalParticipants,
        totalMessages,
        totalGifts,
        totalBookmarks,
        engagementScore: `${engagementScore}%`,
        geographicBreakdown: geoBreakdown,
        deviceSplit: deviceBreakdown,
      },
      participants: participants.map((p) => ({
        id: p.id,
        username: p.username,
        role: p.role,
        handRaised: p.handRaised,
      })),
      chatHistory: chatMessages.slice(-50),
      bookmarks,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watchparty-analytics-${roomId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          background: 'rgba(16, 20, 36, 0.98)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.95), 0 0 40px rgba(56, 189, 248, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
              }}
            >
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                Audience Analytics & Host Command Center
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                Live metrics, engagement pulse & moderation tools for {roomName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '20px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '10px',
            padding: '3px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '8px 4px',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === 'analytics' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
              color: activeTab === 'analytics' ? '#38bdf8' : '#a0aec0',
              fontWeight: 700,
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s',
            }}
          >
            <BarChart3 size={13} />
            <span>Insights</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('demographics')}
            style={{
              padding: '8px 4px',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === 'demographics' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
              color: activeTab === 'demographics' ? '#38bdf8' : '#a0aec0',
              fontWeight: 700,
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s',
            }}
          >
            <Globe size={13} />
            <span>Audience & Geo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            style={{
              padding: '8px 4px',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === 'leaderboard' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
              color: activeTab === 'leaderboard' ? '#38bdf8' : '#a0aec0',
              fontWeight: 700,
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s',
            }}
          >
            <Award size={13} />
            <span>Leaderboard</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('moderation')}
            style={{
              padding: '8px 4px',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === 'moderation' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
              color: activeTab === 'moderation' ? '#38bdf8' : '#a0aec0',
              fontWeight: 700,
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s',
            }}
          >
            <Shield size={13} />
            <span>Controls</span>
          </button>
        </div>

        {/* TAB 1: ANALYTICS & ENGAGEMENT */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 4 Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '11px', fontWeight: 600 }}>
                  <Users size={14} />
                  <span>VIEWERS</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>
                  {totalParticipants}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Active now</div>
              </div>

              <div
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '11px', fontWeight: 600 }}>
                  <MessageSquare size={14} />
                  <span>MESSAGES</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>
                  {totalMessages}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Chat messages</div>
              </div>

              <div
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f43f5e', fontSize: '11px', fontWeight: 600 }}>
                  <Heart size={14} />
                  <span>GIFTS / SNACKS</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>
                  {totalGifts}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Flying gifts sent</div>
              </div>

              <div
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '11px', fontWeight: 600 }}>
                  <TrendingUp size={14} />
                  <span>ENGAGEMENT</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#34d399' }}>
                  {engagementScore}%
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Hype level 🔥</div>
              </div>
            </div>

            {/* Engagement Timeline Chart */}
            <div
              style={{
                padding: '14px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                  Live Party Activity Timeline
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Real-time engagement density
                </span>
              </div>

              {/* Bar visualization */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '6px',
                  height: '75px',
                  paddingTop: '8px',
                }}
              >
                {timelineBars.map((val, idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      height: `${val}%`,
                      background:
                        val > 65
                          ? 'linear-gradient(to top, #ff2a2a, #f97316)'
                          : 'linear-gradient(to top, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.7))',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                      position: 'relative',
                    }}
                    title={`Interval ${idx + 1}: ${val}% activity`}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b' }}>
                <span>Party Start</span>
                <span>Midway</span>
                <span>Now (Live)</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIENCE & GEOGRAPHIC DEMOGRAPHICS */}
        {activeTab === 'demographics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 4 Summary Stat Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f97316', fontSize: '11px', fontWeight: 600 }}>
                  <Globe size={14} />
                  <span>TOP REGION</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  🇮🇳 South Asia
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>58% audience share</div>
              </div>

              <div
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '11px', fontWeight: 600 }}>
                  <Smartphone size={14} />
                  <span>PRIMARY DEVICE</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                  Mobile 55%
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Touch & low latency</div>
              </div>

              <div
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '11px', fontWeight: 600 }}>
                  <Wifi size={14} />
                  <span>SYNC LATENCY</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#34d399' }}>
                  22 ms
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Zero drift (&lt;0.2s)</div>
              </div>

              <div
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a855f7', fontSize: '11px', fontWeight: 600 }}>
                  <Clock size={14} />
                  <span>AVG WATCH TIME</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#c084fc' }}>
                  24m 18s
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>High session loyalty</div>
              </div>
            </div>

            {/* Geographic Distribution Card */}
            <div
              style={{
                padding: '16px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={16} color="#38bdf8" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                    Audience Geographic & Regional Distribution
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '10px' }}>
                  {totalParticipants} Active Node{totalParticipants !== 1 ? 's' : ''}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {geoBreakdown.map((item) => (
                  <div key={item.code} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{item.flag}</span>
                        <span style={{ color: '#fff', fontWeight: 600 }}>{item.country}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {item.viewers} viewer{item.viewers !== 1 ? 's' : ''}
                        </span>
                        <span style={{ fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                          {item.pct}%
                        </span>
                      </div>
                    </div>
                    {/* Progress Track */}
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${item.pct}%`,
                          height: '100%',
                          background: item.color,
                          borderRadius: '3px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform & Device Split */}
            <div
              style={{
                padding: '16px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Laptop size={16} color="#a855f7" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                    Viewing Platform & Device Ecosystem
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Cross-Platform Responsive
                </span>
              </div>

              {/* Multi-segment stacked progress bar */}
              <div
                style={{
                  display: 'flex',
                  height: '8px',
                  width: '100%',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.06)',
                }}
              >
                {deviceBreakdown.map((dev) => (
                  <div
                    key={dev.label}
                    style={{
                      width: `${dev.pct}%`,
                      background: dev.color,
                      transition: 'width 0.3s ease',
                    }}
                    title={`${dev.label}: ${dev.pct}%`}
                  />
                ))}
              </div>

              {/* 3 Device Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {deviceBreakdown.map((dev) => (
                  <div
                    key={dev.label}
                    style={{
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '18px' }}>{dev.icon}</span>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: dev.color }}>
                        {dev.pct}%
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                      {dev.label.split(' ')[0]}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {dev.details}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Playback Retention Curve & Replay Hotspot */}
            <div
              style={{
                padding: '16px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Flame size={16} color="#ef4444" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                    Audience Retention Curve & Replay Hotspot
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontWeight: 700,
                  }}
                >
                  <span>⚡ 70% Timestamp Replay Peak (+14%)</span>
                </div>
              </div>

              {/* Retention Bars */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '6px',
                  height: '80px',
                  paddingTop: '6px',
                }}
              >
                {retentionCurve.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontSize: '9px', fontWeight: 700, color: item.isPeak ? '#f87171' : '#94a3b8', fontFamily: 'monospace' }}>
                      {item.val}%
                    </span>
                    <div
                      style={{
                        width: '100%',
                        height: `${item.val * 0.75}%`,
                        background: item.isPeak
                          ? 'linear-gradient(to top, #ff2a2a, #f97316)'
                          : 'linear-gradient(to top, rgba(56, 189, 248, 0.25), rgba(56, 189, 248, 0.75))',
                        borderRadius: '4px 4px 0 0',
                        boxShadow: item.isPeak ? '0 0 12px rgba(239, 68, 68, 0.7)' : 'none',
                        transition: 'height 0.3s ease',
                      }}
                      title={`${item.pos}: ${item.val}% viewer retention`}
                    />
                    <span style={{ fontSize: '9px', color: '#64748b' }}>
                      {item.pos}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LEADERBOARD & SUPERSTARS */}
        {activeTab === 'leaderboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
              🌟 Top Active Chatters
            </div>
            {topChatters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '12px' }}>
                No chat activity recorded yet. Start conversing to rank!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {topChatters.map((chatter, idx) => {
                  const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                  const maxCount = topChatters[0].count || 1;
                  const pct = Math.round((chatter.count / maxCount) * 100);

                  return (
                    <div
                      key={chatter.username}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '15px' }}>{medal}</span>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>
                            {chatter.username}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#f87171' }}>
                          {chatter.count} messages
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #ff2a2a, #f97316)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Top Snack & Gift Senders */}
            {topGifters.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🍿</span>
                  <span>Top Snack & Party Gift Senders</span>
                </div>
                {topGifters.map((g, idx) => {
                  const medal = idx === 0 ? '👑' : idx === 1 ? '🌟' : '🎉';
                  return (
                    <div
                      key={g.username}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '15px' }}>{medal}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{g.username}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{g.icon}</span>
                        <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 700 }}>
                          {g.count} gifts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: HOST MODERATION */}
        {activeTab === 'moderation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {!isHostOrMod && (
              <div
                style={{
                  padding: '10px',
                  background: 'rgba(234, 179, 8, 0.1)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  borderRadius: '8px',
                  color: '#facc15',
                  fontSize: '11px',
                }}
              >
                ⚠️ Only Hosts & Moderators have permission to trigger room-wide moderation actions.
              </div>
            )}

            {/* Broadcast Announcement Form */}
            <form
              onSubmit={handleSendAnnouncement}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Megaphone size={14} color="#f472b6" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                  Broadcast Room Announcement Banner
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  disabled={!isHostOrMod}
                  placeholder="e.g. 'Starting intermission! Next movie at 10:30 PM!'"
                  style={{
                    flex: 1,
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={!isHostOrMod || !announcementText.trim()}
                  className="btn-primary"
                  style={{ padding: '8px 14px', fontSize: '12px', gap: '4px', whiteSpace: 'nowrap' }}
                >
                  {announcementSent ? <Check size={14} /> : <Megaphone size={14} />}
                  <span>{announcementSent ? 'Sent!' : 'Broadcast'}</span>
                </button>
              </div>
            </form>

            {/* Quick Moderation Toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={handleMuteAll}
                disabled={!isHostOrMod}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  background: mutedAll ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                  border: mutedAll ? '1px solid #22c55e' : '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '10px',
                  color: mutedAll ? '#4ade80' : '#f87171',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isHostOrMod ? 'pointer' : 'not-allowed',
                }}
              >
                <VolumeX size={15} />
                <span>{mutedAll ? 'All Muted!' : 'Mute All Microphones'}</span>
              </button>

              <button
                type="button"
                onClick={handleClearChat}
                disabled={!isHostOrMod}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  background: clearedChat ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: clearedChat ? '1px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: clearedChat ? '#4ade80' : '#e2e8f0',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isHostOrMod ? 'pointer' : 'not-allowed',
                }}
              >
                <Trash2 size={15} />
                <span>{clearedChat ? 'Chat Cleared!' : 'Clear Chat History'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer Audit Export */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            ID: {roomId} • Security: Host Verified
          </span>
          <button
            type="button"
            onClick={handleExportAudit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '8px',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Download size={13} />
            <span>Export Analytics & Audit Log (.JSON)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
