import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  ListPlus,
  ShieldCheck,
  X,
  QrCode,
  Megaphone,
  ArrowLeft,
  Copy,
  Check,
  Crown,
  Shield,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { YouTubePlayer } from './YouTubePlayer';
import { ParticipantList } from './ParticipantList';
import { ChatPanel } from './ChatPanel';
import { PlaylistPanel } from './PlaylistPanel';
import { ReactionOverlay } from './ReactionOverlay';
import { PollPanel } from './PollPanel';
import { BookmarksPanel } from './BookmarksPanel';
import { DiscoverModal } from './DiscoverModal';
import { VoiceVideoOverlay } from './VoiceVideoOverlay';
import { GiftsOverlay } from './GiftsOverlay';
import { TriviaModal } from './TriviaModal';
import { SubtitlesOverlay } from './SubtitlesOverlay';
import { ShareModal } from './ShareModal';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { PartyToolsModal } from './PartyToolsModal';
import { wsService } from '../services/websocket';
import type { Bookmark, ChatMessage, ControlRequestedPayload, GiftItem, Participant, PlayState, Poll, QueueItem, ReactionItem, Role, TriviaEndedPayload, TriviaQuestion } from '../types/party';

interface WatchPartyProps {
  roomId: string;
  roomName: string;
  videoId: string;
  playState: PlayState;
  currentTime: number;
  playbackSpeed?: number;
  serverTimestamp?: number;
  currentUserId: string;
  currentUserRole: Role;
  participants: Participant[];
  playlist?: QueueItem[];
  bookmarks?: Bookmark[];
  activePoll?: Poll | null;
  typingUsers?: string[];
  gifts?: GiftItem[];
  activeTrivia?: TriviaQuestion | null;
  lastTriviaResult?: TriviaEndedPayload | null;
  onClearTriviaResult?: () => void;
  chatMessages: ChatMessage[];
  reactions: ReactionItem[];
  controlRequests: ControlRequestedPayload[];
  isConnected?: boolean;
  username?: string;
  onLeaveRoom?: () => void;
  onOpenShortcuts?: () => void;
  onPlay: (time: number) => void;
  onPause: (time: number) => void;
  onSeek: (time: number) => void;
  onChangeVideo: (videoId: string) => void;
  onSpeedChange: (speed: number) => void;
  onRequestControl: () => void;
  onApproveControl: (userId: string) => void;
  onDismissControlRequest: (userId: string) => void;
  onAddToQueue: (videoId: string, title?: string) => void;
  onRemoveFromQueue: (queueItemId: string) => void;
  onPlayQueueItem: (queueItemId: string) => void;
  onAssignRole: (userId: string, role: Role) => void;
  onRemoveParticipant: (userId: string) => void;
  onTransferHost: (userId: string) => void;
  onToggleRaiseHand: (raised: boolean) => void;
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
}

export const WatchParty: React.FC<WatchPartyProps> = ({
  roomId,
  roomName,
  videoId,
  playState,
  currentTime,
  playbackSpeed = 1.0,
  serverTimestamp,
  currentUserId,
  currentUserRole,
  participants,
  playlist = [],
  bookmarks = [],
  activePoll = null,
  typingUsers = [],
  gifts = [],
  activeTrivia = null,
  lastTriviaResult = null,
  onClearTriviaResult = () => {},
  chatMessages,
  reactions,
  controlRequests,
  isConnected = true,
  username: _username = 'Guest',
  onLeaveRoom,
  onOpenShortcuts,
  onPlay,
  onPause,
  onSeek,
  onChangeVideo,
  onSpeedChange,
  onRequestControl,
  onApproveControl,
  onDismissControlRequest,
  onAddToQueue,
  onRemoveFromQueue,
  onPlayQueueItem,
  onAssignRole,
  onRemoveParticipant,
  onTransferHost,
  onToggleRaiseHand,
  onSendMessage,
  onSendReaction,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'playlist' | 'participants' | 'polls' | 'moments'>('chat');
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isDiscoverOpen, setIsDiscoverOpen] = useState(false);
  const [ambientGlow, setAmbientGlow] = useState(true);
  const [liveCurrentTime, setLiveCurrentTime] = useState(currentTime);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isPartyToolsOpen, setIsPartyToolsOpen] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyRoomCode = () => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const origin = isLocalhost ? 'http://10.55.66.147:5173' : window.location.origin;
    const url = `${origin}/?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  useEffect(() => {
    const unsub = wsService.on('host_announcement', (payload: { announcement: string }) => {
      if (payload && payload.announcement) {
        setActiveAnnouncement(payload.announcement);
      }
    });
    return unsub;
  }, []);

  const isHost = currentUserRole === 'HOST';

  // Handle when current video ends: auto-play next in playlist if available
  const handleVideoEnded = () => {
    if ((currentUserRole === 'HOST' || currentUserRole === 'MODERATOR') && playlist.length > 0) {
      onPlayQueueItem(playlist[0].id);
    }
  };

  return (
    <div
      className="watch-party-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        minHeight: '100vh',
        width: '100%',
        overflow: 'hidden',
        background: '#090c16',
      }}
    >
      {/* Clean Cinema Room Top Bar */}
      <header
        className="watch-party-header"
        style={{
          height: '54px',
          minHeight: '54px',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(10, 13, 20, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 40,
        }}
      >
        {/* Left: Exit/Leave + Room Title + Role + Room Code Chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onLeaveRoom && (
            <button
              type="button"
              onClick={onLeaveRoom}
              className="btn-danger"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
              }}
              title="Leave Room & Return to Lobby"
            >
              <ArrowLeft size={14} />
              <span className="hide-on-mobile">Leave</span>
            </button>
          )}

          <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Room Name & Role */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="room-title-text"
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '-0.2px',
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={roomName || 'Watch Party Room'}
            >
              {roomName || 'Watch Party'}
            </span>

            {/* Role Badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 700,
                background:
                  currentUserRole === 'HOST'
                    ? 'rgba(245, 158, 11, 0.15)'
                    : currentUserRole === 'MODERATOR'
                    ? 'rgba(56, 189, 248, 0.15)'
                    : 'rgba(255, 255, 255, 0.08)',
                color:
                  currentUserRole === 'HOST'
                    ? '#fbbf24'
                    : currentUserRole === 'MODERATOR'
                    ? '#38bdf8'
                    : '#94a3b8',
                border: `1px solid ${
                  currentUserRole === 'HOST'
                    ? 'rgba(245, 158, 11, 0.35)'
                    : currentUserRole === 'MODERATOR'
                    ? 'rgba(56, 189, 248, 0.35)'
                    : 'rgba(255, 255, 255, 0.1)'
                }`,
              }}
            >
              {currentUserRole === 'HOST' && <Crown size={11} />}
              {currentUserRole === 'MODERATOR' && <Shield size={11} />}
              <span className="hide-on-mobile">{currentUserRole}</span>
            </span>
          </div>

          {/* Room Code with Copy Link Pill */}
          <button
            type="button"
            onClick={handleCopyRoomCode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: copiedCode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: copiedCode ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
              color: copiedCode ? '#34d399' : '#cbd5e1',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'monospace',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Click to copy invite link"
          >
            {copiedCode ? <Check size={12} /> : <Copy size={12} />}
            <span>{roomId}</span>
            {copiedCode && <span style={{ fontSize: '10px', color: '#34d399' }}>Copied!</span>}
          </button>
        </div>

        {/* Right: Videos + Share/Invite + Party Tools + Shortcuts + Live Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Quick Pick / Discover Videos Button */}
          <button
            type="button"
            onClick={() => setIsDiscoverOpen(true)}
            className="btn-primary"
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              gap: '5px',
            }}
            title="Pick or search YouTube video"
          >
            <span>✨</span>
            <span className="hide-on-mobile">Videos</span>
          </button>

          {/* Invite & QR Modal Button */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="btn-secondary"
            style={{
              padding: '5px 11px',
              fontSize: '12px',
              gap: '5px',
            }}
            title="Share Room Link & QR Code"
          >
            <QrCode size={13} />
            <span className="hide-on-mobile">Invite</span>
          </button>

          {/* Party Tools Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsPartyToolsOpen(true)}
            className="btn-secondary"
            style={{
              padding: '5px 11px',
              fontSize: '12px',
              gap: '5px',
            }}
            title="Snacks, Trivia, Equalizer, Looper & Analytics"
          >
            <Sparkles size={13} color="#f59e0b" />
            <span className="hide-on-mobile">Party Tools</span>
          </button>

          {/* Keyboard Shortcuts Button */}
          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              className="hide-on-mobile"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '6px 9px',
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
              title="Keyboard Shortcuts (?)"
            >
              <HelpCircle size={14} />
            </button>
          )}

          {/* Connection Status / Live Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '12px',
              background: isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              fontSize: '11px',
              fontWeight: 700,
              color: isConnected ? '#34d399' : '#f87171',
            }}
          >
            <span className="live-dot" style={{ width: '6px', height: '6px' }} />
            <span>{participants.length} <span className="hide-on-mobile">watching</span></span>
          </div>
        </div>
      </header>

      {/* Main Grid: Video Player + Sidebar */}
      <div
        className="watch-party-grid"
        style={{
          flex: 1,
          maxWidth: isTheaterMode ? '100%' : '1650px',
          margin: '0 auto',
          padding: '12px 16px',
          display: 'grid',
          gridTemplateColumns: isTheaterMode ? '1fr' : 'minmax(0, 1fr) 400px',
          gap: '16px',
          overflow: 'hidden',
          width: '100%',
          minHeight: 0,
          transition: 'grid-template-columns 0.3s ease',
        }}
      >
        {/* Video & Player Column */}
        <div
          className="watch-party-video-col"
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflowY: 'auto',
            paddingRight: '4px',
            gap: '12px',
          }}
        >
          {/* Active Poll Live Notification Banner (shown if not currently viewing polls tab) */}
          {activePoll && activePoll.active && activeTab !== 'polls' && (
            <div
              className="glass-card animate-fade-in"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fff',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="live-dot" />
                <span>
                  <b>Live Poll:</b> {activePoll.question}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('polls')}
                className="btn-primary"
                style={{ padding: '3px 10px', fontSize: '11px' }}
              >
                Vote Now →
              </button>
            </div>
          )}

        {/* Host Broadcast Announcement Banner */}
        {activeAnnouncement && (
          <div
            className="glass-card animate-fade-in"
            style={{
              padding: '12px 18px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
              zIndex: 36,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                }}
              >
                <Megaphone size={16} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#f87171', letterSpacing: '0.5px' }}>
                  HOST ANNOUNCEMENT
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                  {activeAnnouncement}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveAnnouncement(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#cbd5e0',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px',
              }}
              title="Dismiss announcement"
            >
              ✕
            </button>
          </div>
        )}

        {/* Host Control Request Alert Banner */}
        {isHost && controlRequests.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              zIndex: 35,
            }}
          >
            {controlRequests.map((req) => (
              <div
                key={req.userId}
                className="glass-panel"
                style={{
                  background: 'rgba(18, 24, 38, 0.95)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>✋</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    <b>{req.username}</b> requested playback control.
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => onApproveControl(req.userId)}
                    className="btn-primary"
                    style={{ padding: '4px 12px', fontSize: '0.78rem', gap: '4px' }}
                  >
                    <ShieldCheck size={14} /> Make Moderator
                  </button>
                  <button
                    onClick={() => onDismissControlRequest(req.userId)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mini-Player Placeholder when Video is Floating */}
        {isMiniPlayer && (
          <div
            className="glass-panel"
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              borderRadius: '12px',
              border: '1px dashed rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.04)',
            }}
          >
            <div style={{ fontSize: '32px' }}>📺</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
              Mini-Player (Picture-in-Picture) Active
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
              The video is floating at the bottom-right corner while you browse chat & playlist.
            </p>
            <button
              type="button"
              onClick={() => setIsMiniPlayer(false)}
              className="btn-primary"
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              Restore to Main View
            </button>
          </div>
        )}

        <div
          style={
            isMiniPlayer
              ? {
                  position: 'fixed',
                  bottom: '24px',
                  right: '24px',
                  width: '380px',
                  maxWidth: '92vw',
                  zIndex: 9999,
                  borderRadius: '14px',
                  overflow: 'hidden',
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(239, 68, 68, 0.45)',
                  border: '2px solid #ef4444',
                  background: '#090d16',
                }
              : {
                  position: 'relative',
                  width: '100%',
                  borderRadius: '12px',
                  boxShadow: ambientGlow
                    ? '0 0 60px rgba(239, 68, 68, 0.22), 0 0 100px rgba(0, 0, 0, 0.85)'
                    : 'none',
                  transition: 'box-shadow 0.4s ease',
                }
          }
        >
          {isMiniPlayer && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                background: 'rgba(15, 20, 35, 0.95)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '11px',
                fontWeight: 700,
                color: '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="live-dot" />
                <span>Mini-Player (PiP)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMiniPlayer(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '2px 6px',
                }}
                title="Restore to main window"
              >
                ✕
              </button>
            </div>
          )}

          <YouTubePlayer
            videoId={videoId}
            serverPlayState={playState}
            serverCurrentTime={currentTime}
            serverPlaybackSpeed={playbackSpeed}
            serverTimestamp={serverTimestamp}
            userRole={currentUserRole}
            onPlay={onPlay}
            onPause={onPause}
            onSeek={onSeek}
            onChangeVideo={onChangeVideo}
            onSpeedChange={onSpeedChange}
            onRequestControl={onRequestControl}
            onVideoEnded={handleVideoEnded}
            isTheaterMode={isTheaterMode}
            onToggleTheater={() => setIsTheaterMode(!isTheaterMode)}
            isMiniPlayer={isMiniPlayer}
            onToggleMiniPlayer={() => setIsMiniPlayer(!isMiniPlayer)}
            onTimeUpdate={(t) => setLiveCurrentTime(t)}
          />
          <SubtitlesOverlay currentTime={liveCurrentTime} />
          <ReactionOverlay reactions={reactions} />
          <GiftsOverlay gifts={gifts} showControls={false} />
          <TriviaModal
            activeTrivia={activeTrivia}
            lastTriviaResult={lastTriviaResult}
            userRole={currentUserRole}
            userId={currentUserId}
            onClearResult={onClearTriviaResult}
            showButton={false}
          />
        </div>

        {/* In-Browser WebRTC Voice Chat & Video Grid */}
        <VoiceVideoOverlay
          currentUserId={currentUserId}
          currentUsername={participants.find((p) => p.id === currentUserId)?.username || 'User'}
          participants={participants}
        />
      </div>

      {/* Right Sidebar: Chat / Playlist / People (hidden or side in non-theater) */}
        {!isTheaterMode && (
          <div
            className="glass-panel watch-party-sidebar"
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
              padding: '16px',
              gap: '14px',
            }}
          >
          {/* Tabs Switcher */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              background: 'rgba(0, 0, 0, 0.35)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px',
              border: '1px solid var(--border-subtle)',
              gap: '2px',
            }}
          >
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                padding: '6px 4px',
                border: 'none',
                borderRadius: '6px',
                background: activeTab === 'chat' ? 'linear-gradient(135deg, #ff2a2a, #dc2626)' : 'transparent',
                color: activeTab === 'chat' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                boxShadow: activeTab === 'chat' ? '0 2px 8px rgba(239, 68, 68, 0.35)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <MessageSquare size={13} />
              <span>Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('playlist')}
              style={{
                padding: '6px 4px',
                border: 'none',
                borderRadius: '6px',
                background: activeTab === 'playlist' ? 'linear-gradient(135deg, #ff2a2a, #dc2626)' : 'transparent',
                color: activeTab === 'playlist' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                boxShadow: activeTab === 'playlist' ? '0 2px 8px rgba(239, 68, 68, 0.35)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <ListPlus size={13} />
              <span>Queue ({playlist.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('participants')}
              style={{
                padding: '6px 4px',
                border: 'none',
                borderRadius: '6px',
                background: activeTab === 'participants' ? 'linear-gradient(135deg, #ff2a2a, #dc2626)' : 'transparent',
                color: activeTab === 'participants' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                boxShadow: activeTab === 'participants' ? '0 2px 8px rgba(239, 68, 68, 0.35)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <Users size={13} />
              <span>People ({participants.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('polls')}
              style={{
                padding: '6px 4px',
                border: 'none',
                borderRadius: '6px',
                background: activeTab === 'polls' ? 'linear-gradient(135deg, #ff2a2a, #dc2626)' : 'transparent',
                color: activeTab === 'polls' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                position: 'relative',
                boxShadow: activeTab === 'polls' ? '0 2px 8px rgba(239, 68, 68, 0.35)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '13px' }}>📊</span>
              <span>
                Polls {activePoll && activePoll.active ? '🔴' : ''}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('moments')}
              style={{
                padding: '6px 4px',
                border: 'none',
                borderRadius: '6px',
                background: activeTab === 'moments' ? 'linear-gradient(135deg, #ff2a2a, #dc2626)' : 'transparent',
                color: activeTab === 'moments' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                boxShadow: activeTab === 'moments' ? '0 2px 8px rgba(239, 68, 68, 0.35)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '13px' }}>🔖</span>
              <span>Moments ({bookmarks.length})</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content-container" style={{ flex: 1, overflow: 'hidden' }}>
            {activeTab === 'chat' && (
              <ChatPanel
                messages={chatMessages}
                currentUserId={currentUserId}
                typingUsers={typingUsers}
                onSendMessage={onSendMessage}
                onSendReaction={onSendReaction}
              />
            )}

            {activeTab === 'playlist' && (
              <PlaylistPanel
                playlist={playlist}
                userRole={currentUserRole}
                onAddToQueue={onAddToQueue}
                onRemoveFromQueue={onRemoveFromQueue}
                onPlayQueueItem={onPlayQueueItem}
              />
            )}

            {activeTab === 'participants' && (
              <ParticipantList
                participants={participants}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                onAssignRole={onAssignRole}
                onRemoveParticipant={onRemoveParticipant}
                onTransferHost={onTransferHost}
                onToggleRaiseHand={onToggleRaiseHand}
              />
            )}

            {activeTab === 'polls' && (
              <PollPanel
                poll={activePoll}
                userRole={currentUserRole}
                userId={currentUserId}
              />
            )}

            {activeTab === 'moments' && (
              <BookmarksPanel
                bookmarks={bookmarks}
                currentTime={liveCurrentTime}
                userRole={currentUserRole}
                onSeek={onSeek}
                onSendMessage={onSendMessage}
              />
            )}
          </div>
        </div>
      )}
      </div>

      {/* Quick Pick & Discover Modal */}
      <DiscoverModal
        isOpen={isDiscoverOpen}
        onClose={() => setIsDiscoverOpen(false)}
        userRole={currentUserRole}
      />

      {/* Share & QR Code Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomId={roomId}
        roomName={roomName}
      />

      {/* Audience Analytics & Host Command Center */}
      <AnalyticsDashboard
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        roomName={roomName}
        roomId={roomId}
        userRole={currentUserRole}
        participants={participants}
        chatMessages={chatMessages}
        gifts={gifts}
        bookmarks={bookmarks}
      />

      {/* Party Tools & Interactive FX Modal */}
      <PartyToolsModal
        isOpen={isPartyToolsOpen}
        onClose={() => setIsPartyToolsOpen(false)}
        userRole={currentUserRole}
        userId={currentUserId}
        liveCurrentTime={liveCurrentTime}
        onSeek={onSeek}
        ambientGlow={ambientGlow}
        onToggleGlow={() => setAmbientGlow(!ambientGlow)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
      />
    </div>
  );
};
