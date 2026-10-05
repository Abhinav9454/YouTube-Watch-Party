import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Lobby } from './components/Lobby';
import { WatchParty } from './components/WatchParty';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { wsService } from './services/websocket';
import { soundEffects } from './services/soundEffects';
import { createRoomApi, getChatHistoryApi } from './services/api';
import type {
  Bookmark,
  BookmarksUpdatedPayload,
  ChatMessage,
  ControlRequestedPayload,
  HandRaisedPayload,
  Participant,
  PlayState,
  Poll,
  PollEndedPayload,
  PollUpdatedPayload,
  QueueItem,
  QueueUpdatedPayload,
  ReactionItem,
  Role,
  SoundPlayedPayload,
  SyncStatePayload,
  UserJoinedPayload,
  UserLeftPayload,
  RoleAssignedPayload,
  ParticipantRemovedPayload,
  ChatBroadcastPayload,
  ReactionBroadcastPayload,
  UserTypingPayload,
  GiftItem,
  GiftBroadcastPayload,
  TriviaQuestion,
  TriviaStartedPayload,
  TriviaEndedPayload,
} from './types/party';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar: string;
}

export function App() {
  const [userId] = useState<string>(() => {
    const saved = localStorage.getItem('watchparty_userid');
    if (saved) return saved;
    const generated = 'user_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('watchparty_userid', generated);
    return generated;
  });

  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('watchparty_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const [username, setUsername] = useState<string>(() => {
    const savedUser = localStorage.getItem('watchparty_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.username) return parsed.username;
      } catch {}
    }
    return localStorage.getItem('watchparty_username') || `User_${Math.floor(1000 + Math.random() * 9000)}`;
  });

  const [currentUserRole, setCurrentUserRole] = useState<Role>('PARTICIPANT');

  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string>('');
  const [videoId, setVideoId] = useState<string>('dQw4w9WgXcQ');
  const [playState, setPlayState] = useState<PlayState>('PAUSED');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [serverTimestamp, setServerTimestamp] = useState<number>(Date.now());
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [playlist, setPlaylist] = useState<QueueItem[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [activeTrivia, setActiveTrivia] = useState<TriviaQuestion | null>(null);
  const [lastTriviaResult, setLastTriviaResult] = useState<TriviaEndedPayload | null>(null);
  const [controlRequests, setControlRequests] = useState<ControlRequestedPayload[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<ReactionItem[]>([]);

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'error' | 'success' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && !roomId) {
      handleJoinRoom(roomParam.toUpperCase(), username);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      if (e.key === '?') {
        setIsShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const unsubscribe = wsService.onStatusChange((connected) => {
      setIsConnected(connected);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubs = [
      wsService.on('sync_state', (payload: SyncStatePayload) => {
        if (payload.videoId) setVideoId(payload.videoId);
        if (payload.playState) setPlayState(payload.playState);
        if (payload.currentTime !== undefined) setCurrentTime(payload.currentTime);
        if (payload.playbackSpeed !== undefined) setPlaybackSpeed(payload.playbackSpeed);
        if (payload.playlist) setPlaylist(payload.playlist);
        if (payload.bookmarks) setBookmarks(payload.bookmarks);
        if (payload.activePoll !== undefined) setActivePoll(payload.activePoll);
        if (payload.serverTimestamp) setServerTimestamp(payload.serverTimestamp);
        if (payload.assignedRole) setCurrentUserRole(payload.assignedRole);
      }),

      wsService.on('user_joined', (payload: UserJoinedPayload) => {
        if (payload.participants) {
          setParticipants(payload.participants);
        }
        if (payload.roomName) {
          setRoomName(payload.roomName);
        }
        if (payload.userId === userId) {
          setCurrentUserRole(payload.role);
          showToast(`Joined watch party room as ${payload.role}!`, 'success');
        } else {
          setChatMessages((prev) => [
            ...prev,
            {
              id: 'sys_' + Date.now(),
              senderName: 'System',
              senderRole: 'SYSTEM',
              message: `${payload.username} joined the party.`,
              timestamp: new Date().toISOString(),
              isSystem: true,
            },
          ]);
        }
      }),

      wsService.on('user_left', (payload: UserLeftPayload) => {
        if (payload.participants) {
          setParticipants(payload.participants);
        }
        setChatMessages((prev) => [
          ...prev,
          {
            id: 'sys_' + Date.now(),
            senderName: 'System',
            senderRole: 'SYSTEM',
            message: `${payload.username} left the room.`,
            timestamp: new Date().toISOString(),
            isSystem: true,
          },
        ]);
      }),

      wsService.on('role_assigned', (payload: RoleAssignedPayload) => {
        if (payload.participants) {
          setParticipants(payload.participants);
        }
        if (payload.userId === userId) {
          setCurrentUserRole(payload.role);
          showToast(`Your role was updated to ${payload.role}!`, 'info');
        }
        // Remove from pending control requests if approved
        setControlRequests((prev) => prev.filter((r) => r.userId !== payload.userId));

        const target = payload.participants?.find((p) => p.id === payload.userId);
        const name = target ? target.username : payload.username || 'User';
        setChatMessages((prev) => [
          ...prev,
          {
            id: 'sys_' + Date.now(),
            senderName: 'System',
            senderRole: 'SYSTEM',
            message: payload.hostTransferred
              ? `${name} is now the Room Host 👑`
              : `${name} is now a ${payload.role}`,
            timestamp: new Date().toISOString(),
            isSystem: true,
          },
        ]);
      }),

      wsService.on('participant_removed', (payload: ParticipantRemovedPayload) => {
        if (payload.participants) {
          setParticipants(payload.participants);
        }
        if (payload.userId === userId) {
          showToast(payload.message || 'You were removed from the room by the host', 'error');
          handleLeaveRoom();
        }
      }),

      wsService.on('chat_broadcast', (payload: ChatBroadcastPayload) => {
        setChatMessages((prev) => [
          ...prev,
          {
            id: payload.id,
            senderId: payload.senderId,
            senderName: payload.senderName,
            senderRole: payload.senderRole,
            message: payload.message,
            timestamp: payload.timestamp,
          },
        ]);
      }),

      wsService.on('reaction_broadcast', (payload: ReactionBroadcastPayload) => {
        const reactionItem: ReactionItem = {
          id: Math.random().toString(36).substring(2, 9),
          emoji: payload.emoji,
          senderName: payload.senderName,
          leftPercent: 15 + Math.random() * 70,
        };
        setReactions((prev) => [...prev, reactionItem]);
        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== reactionItem.id));
        }, 3000);
      }),

      wsService.on('control_requested', (payload: ControlRequestedPayload) => {
        if (currentUserRole === 'HOST' || currentUserRole === 'MODERATOR') {
          setControlRequests((prev) => [...prev.filter((r) => r.userId !== payload.userId), payload]);
          showToast(`${payload.username} requested playback control!`, 'info');
        }
      }),

      wsService.on('queue_updated', (payload: QueueUpdatedPayload) => {
        if (payload.playlist) {
          setPlaylist(payload.playlist);
        }
      }),

      wsService.on('hand_raised', (payload: HandRaisedPayload) => {
        if (payload.participants) {
          setParticipants(payload.participants);
        }
        if (payload.raised) {
          showToast(`${payload.username} raised their hand ✋`, 'info');
        }
      }),

      wsService.on('poll_updated', (payload: PollUpdatedPayload) => {
        if (payload.poll) {
          setActivePoll(payload.poll);
        }
      }),

      wsService.on('poll_ended', (_payload: PollEndedPayload) => {
        setActivePoll(null);
        showToast('Live poll ended and results finalized!', 'info');
      }),

      wsService.on('bookmarks_updated', (payload: BookmarksUpdatedPayload) => {
        if (payload.bookmarks) {
          setBookmarks(payload.bookmarks);
        }
      }),

      wsService.on('sound_played', (payload: SoundPlayedPayload) => {
        soundEffects.play(payload.soundId);
        if (payload.senderName) {
          showToast(`${payload.senderName} played a party sound! 🔊`, 'info');
        }
      }),

      wsService.on('user_typing', (payload: UserTypingPayload) => {
        if (payload.userId !== userId) {
          if (payload.isTyping) {
            setTypingUsers((prev) => Array.from(new Set([...prev, payload.username])));
          } else {
            setTypingUsers((prev) => prev.filter((u) => u !== payload.username));
          }
        }
      }),

      wsService.on('gift_broadcast', (payload: GiftBroadcastPayload) => {
        const giftItem: GiftItem = {
          id: Math.random().toString(36).substring(2, 9),
          giftType: payload.giftType,
          giftIcon: payload.giftIcon,
          giftName: payload.giftName,
          senderName: payload.senderName,
          leftPercent: 20 + Math.random() * 60,
        };
        setGifts((prev) => [...prev, giftItem]);
        setTimeout(() => {
          setGifts((prev) => prev.filter((g) => g.id !== giftItem.id));
        }, 3500);
      }),

      wsService.on('trivia_started', (payload: TriviaStartedPayload) => {
        if (payload.trivia) {
          setActiveTrivia(payload.trivia);
          showToast(`Trivia quiz started: "${payload.trivia.question}"`, 'info');
        }
      }),

      wsService.on('trivia_ended', (payload: TriviaEndedPayload) => {
        setActiveTrivia(null);
        setLastTriviaResult(payload);
        showToast(`Trivia ended! Correct answer: ${payload.correctOption}`, 'info');
      }),

      wsService.on('error_message', (payload: { message: string }) => {
        showToast(payload.message, 'error');
      }),

      wsService.on('chat_cleared', () => {
        setChatMessages([]);
        showToast('Host cleared chat history 🧹', 'info');
      }),

      wsService.on('host_announcement', (payload: { announcement: string }) => {
        showToast(`📢 Host: ${payload.announcement}`, 'info');
      }),

      wsService.on('mute_all', () => {
        showToast('Host requested silence / muted all microphones 🔇', 'info');
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [userId, currentUserRole, showToast]);

  // Handle browser Back / Forward navigation smoothly
  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');

      if (!roomParam) {
        // User pressed Back to return to Lobby
        if (roomId) {
          wsService.leaveRoom(roomId);
        }
        setRoomId(null);
        setParticipants([]);
        setPlaylist([]);
        setControlRequests([]);
        setChatMessages([]);
        setCurrentUserRole('PARTICIPANT');
      } else if (roomParam && roomParam !== roomId) {
        // User pressed Forward to re-enter a room
        handleJoinRoom(roomParam.toUpperCase(), username);
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [roomId, username]);

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: AuthUser) => {
    setAuthUser(user);
    setUsername(user.username);
    localStorage.setItem('watchparty_username', user.username);
    showToast(`Welcome, ${user.username}! Signed in successfully.`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('watchparty_token');
    localStorage.removeItem('watchparty_user');
    setAuthUser(null);
    showToast('Signed out successfully.', 'info');
  };

  const handleJoinRoom = async (targetRoomId: string, joinUsername: string, passcode?: string) => {
    setUsername(joinUsername);
    localStorage.setItem('watchparty_username', joinUsername);

    // Track recently visited room
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('watchparty_recent_rooms') || '[]');
      const updated = [targetRoomId, ...saved.filter((id) => id !== targetRoomId)].slice(0, 10);
      localStorage.setItem('watchparty_recent_rooms', JSON.stringify(updated));
    } catch {}

    try {
      await wsService.connect();
      setRoomId(targetRoomId);
      const newUrl = `${window.location.pathname}?room=${targetRoomId}`;
      window.history.pushState({ roomId: targetRoomId }, '', newUrl);

      const history = await getChatHistoryApi(targetRoomId);
      if (history.length > 0) {
        setChatMessages(history);
      }

      wsService.joinRoom(targetRoomId, joinUsername, userId, passcode);
    } catch {
      showToast('Could not connect to WebSocket server. Is backend running?', 'error');
    }
  };

  const handleCreateRoom = async (name: string, hostUsername: string, initialVideo: string, passcode?: string) => {
    setUsername(hostUsername);
    localStorage.setItem('watchparty_username', hostUsername);

    try {
      const room = await createRoomApi(name, hostUsername, initialVideo, passcode);
      await handleJoinRoom(room.roomId, hostUsername, passcode);
      setRoomName(room.name);
      setVideoId(room.videoId);
      if (room.playlist) setPlaylist(room.playlist);
    } catch (err: any) {
      showToast('Error creating room: ' + err.message, 'error');
    }
  };

  const handleLeaveRoom = () => {
    if (roomId) {
      wsService.leaveRoom(roomId);
    }
    setRoomId(null);
    setParticipants([]);
    setPlaylist([]);
    setControlRequests([]);
    setChatMessages([]);
    setCurrentUserRole('PARTICIPANT');
    const cleanUrl = window.location.pathname;
    window.history.pushState({ roomId: null }, '', cleanUrl);
  };

  const handlePlay = (time: number) => {
    wsService.play(time);
  };

  const handlePause = (time: number) => {
    wsService.pause(time);
  };

  const handleSeek = (time: number) => {
    wsService.seek(time);
  };

  const handleChangeVideo = (newVideo: string) => {
    wsService.changeVideo(newVideo);
  };

  const handleSpeedChange = (speed: number) => {
    wsService.changeSpeed(speed);
  };

  const handleRequestControl = () => {
    wsService.requestControl();
    showToast('Permission requested from room host!', 'info');
  };

  const handleApproveControl = (targetUserId: string) => {
    wsService.approveControl(targetUserId);
    setControlRequests((prev) => prev.filter((r) => r.userId !== targetUserId));
    showToast('Permission granted! Promoted user to Moderator.', 'success');
  };

  const handleDismissControlRequest = (targetUserId: string) => {
    setControlRequests((prev) => prev.filter((r) => r.userId !== targetUserId));
  };

  const handleAddToQueue = (vid: string, title?: string) => {
    wsService.addToQueue(vid, title);
    showToast('Video added to queue!', 'success');
  };

  const handleRemoveFromQueue = (queueItemId: string) => {
    wsService.removeFromQueue(queueItemId);
  };

  const handlePlayQueueItem = (queueItemId: string) => {
    wsService.playQueueItem(queueItemId);
  };

  const handleAssignRole = (targetUserId: string, newRole: Role) => {
    wsService.assignRole(targetUserId, newRole);
  };

  const handleRemoveParticipant = (targetUserId: string) => {
    wsService.removeParticipant(targetUserId);
  };

  const handleTransferHost = (targetUserId: string) => {
    wsService.transferHost(targetUserId);
  };

  const handleToggleRaiseHand = (raised: boolean) => {
    wsService.raiseHand(raised);
  };

  const handleSendMessage = (text: string) => {
    wsService.sendChatMessage(text);
  };

  const handleSendReaction = (emoji: string) => {
    wsService.sendReaction(emoji);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <Navbar
        roomId={roomId || undefined}
        roomName={roomName}
        username={username}
        userRole={roomId ? currentUserRole : undefined}
        isConnected={isConnected}
        onLeaveRoom={roomId ? handleLeaveRoom : undefined}
        authUser={authUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onBackToLobby={handleLeaveRoom}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <main style={{ flex: 1 }}>
        {!roomId ? (
          <Lobby
            initialRoomCode={new URLSearchParams(window.location.search).get('room') || ''}
            onJoinRoom={handleJoinRoom}
            onCreateRoom={handleCreateRoom}
          />
        ) : (
          <WatchParty
            roomId={roomId}
            roomName={roomName}
            videoId={videoId}
            playState={playState}
            currentTime={currentTime}
            playbackSpeed={playbackSpeed}
            serverTimestamp={serverTimestamp}
            currentUserId={userId}
            currentUserRole={currentUserRole}
            participants={participants}
            playlist={playlist}
            bookmarks={bookmarks}
            activePoll={activePoll}
            typingUsers={typingUsers}
            gifts={gifts}
            activeTrivia={activeTrivia}
            lastTriviaResult={lastTriviaResult}
            onClearTriviaResult={() => setLastTriviaResult(null)}
            chatMessages={chatMessages}
            reactions={reactions}
            controlRequests={controlRequests}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={handleSeek}
            onChangeVideo={handleChangeVideo}
            onSpeedChange={handleSpeedChange}
            onRequestControl={handleRequestControl}
            onApproveControl={handleApproveControl}
            onDismissControlRequest={handleDismissControlRequest}
            onAddToQueue={handleAddToQueue}
            onRemoveFromQueue={handleRemoveFromQueue}
            onPlayQueueItem={handlePlayQueueItem}
            onAssignRole={handleAssignRole}
            onRemoveParticipant={handleRemoveParticipant}
            onTransferHost={handleTransferHost}
            onToggleRaiseHand={handleToggleRaiseHand}
            onSendMessage={handleSendMessage}
            onSendReaction={handleSendReaction}
          />
        )}
      </main>

      {!roomId && <Footer onOpenShortcuts={() => setIsShortcutsOpen(true)} />}
    </div>
  );
}

export default App;
