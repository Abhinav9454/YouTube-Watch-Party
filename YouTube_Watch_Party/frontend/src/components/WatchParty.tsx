import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, ListPlus, ShieldCheck, X, QrCode, BarChart3, Megaphone } from 'lucide-react';
import { YouTubePlayer } from './YouTubePlayer';
import { ParticipantList } from './ParticipantList';
import { ChatPanel } from './ChatPanel';
import { PlaylistPanel } from './PlaylistPanel';
import { ReactionOverlay } from './ReactionOverlay';
import { Soundboard } from './Soundboard';
import { PollPanel } from './PollPanel';
import { BookmarksPanel } from './BookmarksPanel';
import { DiscoverModal } from './DiscoverModal';
import { VoiceVideoOverlay } from './VoiceVideoOverlay';
import { GiftsOverlay } from './GiftsOverlay';
import { TriviaModal } from './TriviaModal';
import { AudioEqualizer } from './AudioEqualizer';
import { ABLoopControl } from './ABLoopControl';
import { SubtitlesOverlay } from './SubtitlesOverlay';
import { ShareModal } from './ShareModal';
import { AnalyticsDashboard } from './AnalyticsDashboard';
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
  roomId: _roomId,
  roomName: _roomName,
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
  const [activeAnnouncement, setActiveAnnouncement] = useState<string | null>(null);

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
      style={{
        maxWidth: isTheaterMode ? '100%' : '1550px',
        margin: '0 auto',
        padding: '16px 20px',
        display: 'grid',
        gridTemplateColumns: isTheaterMode ? '1fr' : 'minmax(0, 1fr) 420px',
        gap: '20px',
        height: 'calc(100vh - 75px)',
        transition: 'grid-template-columns 0.3s ease',
      }}
    >
      {/* Video & Player Column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflowY: 'auto',
          paddingRight: '6px',
          gap: '12px',
        }}
      >
        {/* Watch Party Top Quick Actions Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '8px 14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Discover / Quick Pick Button */}
            <button
              type="button"
              onClick={() => setIsDiscoverOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, rgba(255, 75, 43, 0.2), rgba(255, 65, 108, 0.2))',
                border: '1px solid rgba(255, 75, 43, 0.4)',
                borderRadius: '8px',
                padding: '6px 12px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>✨</span>
              <span>Quick Pick & Discover</span>
            </button>

            {/* Soundboard Component */}
            <Soundboard />

            {/* Virtual Snacks & Gifts Component */}
            <GiftsOverlay gifts={gifts} />

            {/* Live Trivia Quiz Component */}
            <TriviaModal
              activeTrivia={activeTrivia}
              lastTriviaResult={lastTriviaResult}
              userRole={currentUserRole}
              userId={currentUserId}
              onClearResult={onClearTriviaResult}
            />

            {/* Audio Equalizer & Presets */}
            <AudioEqualizer />

            {/* A-B Segment Repeat Looper */}
            <ABLoopControl
              currentTime={liveCurrentTime}
              onSeek={onSeek}
              canControl={currentUserRole === 'HOST' || currentUserRole === 'MODERATOR'}
            />

            {/* Subtitles & Closed Captions Manager */}
            <SubtitlesOverlay currentTime={liveCurrentTime} />

            {/* Invite Friends & QR Code Button */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: '#818cf8',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Share Room & Show QR Code"
            >
              <QrCode size={13} />
              <span>Share & QR</span>
            </button>

            {/* Analytics & Host Dashboard Button */}
            <button
              type="button"
              onClick={() => setIsAnalyticsOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: '#38bdf8',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Audience Analytics, Engagement Graph & Host Controls"
            >
              <BarChart3 size={13} />
              <span>Analytics & Host</span>
            </button>

            {/* Ambient Glow Toggle */}
            <button
              type="button"
              onClick={() => setAmbientGlow(!ambientGlow)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: ambientGlow ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: ambientGlow ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: ambientGlow ? '#818cf8' : '#a0aec0',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Toggle Dynamic Ambient Glow around player"
            >
              <span>💡</span>
              <span>Glow {ambientGlow ? 'On' : 'Off'}</span>
            </button>
          </div>

          {/* Active Poll Live Notification Pill */}
          {activePoll && activePoll.active && (
            <button
              type="button"
              onClick={() => setActiveTab('polls')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 75, 43, 0.25)',
                border: '1px solid #ff4b2b',
                borderRadius: '20px',
                padding: '4px 12px',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                animation: 'pulse 1.5s infinite',
              }}
            >
              <span>🔴</span>
              <span>Poll Live: {activePoll.question.substring(0, 22)}... → Vote</span>
            </button>
          )}
        </div>

        {/* Host Broadcast Announcement Banner */}
        {activeAnnouncement && (
          <div
            className="glass-card animate-fade-in"
            style={{
              padding: '12px 18px',
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(99, 102, 241, 0.25))',
              border: '1px solid #ec4899',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 0 25px rgba(236, 72, 153, 0.35)',
              zIndex: 36,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(236, 72, 153, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f472b6',
                }}
              >
                <Megaphone size={16} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#f472b6', letterSpacing: '0.5px' }}>
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
                  background: 'rgba(99, 102, 241, 0.25)',
                  borderColor: '#818cf8',
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
              border: '1px dashed rgba(99, 102, 241, 0.4)',
              background: 'rgba(99, 102, 241, 0.04)',
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
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(99, 102, 241, 0.5)',
                  border: '2px solid #6366f1',
                  background: '#090d16',
                }
              : {
                  position: 'relative',
                  width: '100%',
                  borderRadius: '12px',
                  boxShadow: ambientGlow
                    ? '0 0 60px rgba(99, 102, 241, 0.25), 0 0 120px rgba(255, 75, 43, 0.15)'
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
          className="glass-panel"
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
                background: activeTab === 'chat' ? 'rgba(99, 102, 241, 0.85)' : 'transparent',
                color: activeTab === 'chat' ? '#fff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
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
                background: activeTab === 'playlist' ? 'rgba(99, 102, 241, 0.85)' : 'transparent',
                color: activeTab === 'playlist' ? '#fff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
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
                background: activeTab === 'participants' ? 'rgba(99, 102, 241, 0.85)' : 'transparent',
                color: activeTab === 'participants' ? '#fff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
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
                background: activeTab === 'polls' ? 'rgba(255, 75, 43, 0.85)' : 'transparent',
                color: activeTab === 'polls' ? '#fff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                position: 'relative',
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
                background: activeTab === 'moments' ? 'rgba(99, 102, 241, 0.85)' : 'transparent',
                color: activeTab === 'moments' ? '#fff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '13px' }}>🔖</span>
              <span>Moments ({bookmarks.length})</span>
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
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
        roomId={_roomId}
        roomName={_roomName}
      />

      {/* Audience Analytics & Host Command Center */}
      <AnalyticsDashboard
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        roomName={_roomName}
        roomId={_roomId}
        userRole={currentUserRole}
        participants={participants}
        chatMessages={chatMessages}
        gifts={gifts}
        bookmarks={bookmarks}
      />
    </div>
  );
};
