export type Role = 'HOST' | 'MODERATOR' | 'PARTICIPANT';

export type PlayState = 'PLAYING' | 'PAUSED' | 'BUFFERING' | 'UNSTARTED';

export interface QueueItem {
  id: string;
  videoId: string;
  title: string;
  addedBy: string;
  addedAt?: string;
}

export interface Participant {
  id: string;
  username: string;
  role: Role;
  joinedAt?: string;
  handRaised?: boolean;
}

export interface RoomState {
  roomId: string;
  name: string;
  videoId: string;
  playState: PlayState;
  currentTime: number;
  playbackSpeed?: number;
  hasPasscode?: boolean;
  serverTimestamp?: number;
  hostId?: string;
  participants: Participant[];
  playlist?: QueueItem[];
}

export interface ChatMessage {
  id: string | number;
  senderId?: string;
  senderName: string;
  senderRole: Role | 'SYSTEM';
  message: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface ReactionItem {
  id: string;
  emoji: string;
  senderName: string;
  leftPercent: number;
}

export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
}

export interface PollOption {
  index: number;
  text: string;
  voteCount: number;
  voterUserIds?: string[];
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  creatorId: string;
  creatorName: string;
  active: boolean;
  createdAt: number;
  totalVotes?: number;
}

export interface Bookmark {
  id: string;
  time: number;
  formattedTime: string;
  title: string;
  createdBy: string;
  createdAt: number;
}

export interface SyncStatePayload {
  videoId: string;
  playState: PlayState;
  currentTime: number;
  playbackSpeed?: number;
  playlist?: QueueItem[];
  bookmarks?: Bookmark[];
  activePoll?: Poll | null;
  serverTimestamp?: number;
  assignedRole?: Role;
  userId?: string;
  activeSubtitles?: SubtitlesSyncPayload | null;
}

export interface UserJoinedPayload {
  userId: string;
  username: string;
  role: Role;
  participants: Participant[];
  roomName?: string;
}

export interface UserLeftPayload {
  userId: string;
  username: string;
  participants: Participant[];
}

export interface RoleAssignedPayload {
  userId: string;
  username?: string;
  role: Role;
  hostTransferred?: boolean;
  participants: Participant[];
}

export interface ParticipantRemovedPayload {
  userId: string;
  kicked?: boolean;
  message?: string;
  participants?: Participant[];
}

export interface ChatBroadcastPayload {
  id: string | number;
  senderId: string;
  senderName: string;
  senderRole: Role;
  message: string;
  timestamp: string;
}

export interface ReactionBroadcastPayload {
  emoji: string;
  senderId?: string;
  senderName: string;
}

export interface ControlRequestedPayload {
  userId: string;
  username: string;
  message: string;
}

export interface QueueUpdatedPayload {
  playlist: QueueItem[];
}

export interface HandRaisedPayload {
  userId: string;
  username: string;
  raised: boolean;
  participants: Participant[];
}

export interface RoomEntityDto {
  roomId: string;
  name: string;
  creatorUsername: string;
  currentVideoId: string;
  playState: string;
  currentTime: number;
  passcode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PollUpdatedPayload {
  poll: Poll;
}

export interface PollEndedPayload {
  poll: Poll;
}

export interface BookmarksUpdatedPayload {
  bookmarks: Bookmark[];
}

export interface SubtitleCueItem {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface SubtitlesSyncPayload {
  cues: SubtitleCueItem[];
  isEnabled: boolean;
  fileName?: string;
  offsetSeconds?: number;
}

export interface SoundPlayedPayload {
  soundId: string;
  senderId?: string;
  senderName: string;
}

export interface UserTypingPayload {
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface WebRtcSignalPayload {
  senderUserId: string;
  targetUserId?: string;
  signal: any;
}

export interface WebRtcMediaStatePayload {
  userId: string;
  isAudioMuted: boolean;
  isVideoEnabled: boolean;
  isSpeaking?: boolean;
}

export interface GiftItem {
  id: string;
  giftType: string;
  giftIcon: string;
  giftName: string;
  senderName: string;
  leftPercent: number;
}

export interface GiftBroadcastPayload {
  giftType: string;
  giftIcon: string;
  giftName: string;
  senderId: string;
  senderName: string;
}

export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  durationSeconds: number;
  startTime: number;
  creatorName: string;
}

export interface TriviaStartedPayload {
  trivia: TriviaQuestion;
  duration: number;
}

export interface TriviaEndedPayload {
  triviaId: string;
  question: string;
  correctIndex: number;
  correctOption: string;
  userAnswers: Record<string, number>;
  leaderboard: Record<string, number>;
}



