import type { Role, WebSocketMessage } from '../types/party';

type MessageHandler = (payload: any) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private isExplicitlyClosed = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private messageQueue: string[] = [];
  public isConnected = false;
  private onStatusChangeCallbacks: Set<(connected: boolean) => void> = new Set();

  constructor() {
    const wsEnv = import.meta.env.VITE_WS_URL;
    if (wsEnv) {
      this.url = wsEnv;
    } else {
      const loc = window.location;
      const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = loc.hostname === 'localhost' || loc.hostname === '127.0.0.1' ? 'localhost:8080' : loc.host;
      this.url = `${protocol}//${host}/ws/party`;
    }
  }

  public connect(): Promise<void> {
    this.isExplicitlyClosed = false;
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
      const cleanup = () => {
        if (timeoutTimer) clearTimeout(timeoutTimer);
      };

      timeoutTimer = setTimeout(() => {
        if (!this.isConnected && (!this.socket || this.socket.readyState !== WebSocket.OPEN)) {
          cleanup();
          reject(new Error('Connection timed out. Server might be spinning up or unreachable.'));
        }
      }, 10000);

      if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
        const onOpen = () => {
          cleanup();
          this.socket?.removeEventListener('open', onOpen);
          this.socket?.removeEventListener('error', onError);
          resolve();
        };
        const onError = () => {
          cleanup();
          this.socket?.removeEventListener('open', onOpen);
          this.socket?.removeEventListener('error', onError);
          reject(new Error('WebSocket connection failed'));
        };
        this.socket.addEventListener('open', onOpen);
        this.socket.addEventListener('error', onError);
        return;
      }

      try {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
          cleanup();
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.notifyStatus(true);
          while (this.messageQueue.length > 0) {
            const pending = this.messageQueue.shift();
            if (pending && this.socket) this.socket.send(pending);
          }
          resolve();
        };

        this.socket.onclose = () => {
          this.isConnected = false;
          this.notifyStatus(false);
          if (!this.isExplicitlyClosed) {
            this.handleReconnect();
          }
        };

        this.socket.onerror = (err) => {
          console.warn('WebSocket connection error:', err);
          if (!this.isConnected) {
            cleanup();
            setTimeout(() => reject(new Error('WebSocket connection failed')), 800);
          }
        };

        this.socket.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            if (data && data.type) {
              const listeners = this.handlers.get(data.type);
              if (listeners) {
                listeners.forEach((callback) => callback(data.payload));
              }
            }
          } catch (e) {
            console.error('Failed to parse incoming WebSocket message:', e);
          }
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max WebSocket reconnect attempts reached');
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 8000);
    setTimeout(() => {
      if (!this.isExplicitlyClosed) {
        this.connect().catch(() => {});
      }
    }, delay);
  }

  public on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => {
      this.off(type, handler);
    };
  }

  public off(type: string, handler: MessageHandler) {
    const set = this.handlers.get(type);
    if (set) {
      set.delete(handler);
    }
  }

  public onStatusChange(callback: (connected: boolean) => void): () => void {
    this.onStatusChangeCallbacks.add(callback);
    callback(this.isConnected);
    return () => {
      this.onStatusChangeCallbacks.delete(callback);
    };
  }

  private notifyStatus(connected: boolean) {
    this.onStatusChangeCallbacks.forEach((cb) => cb(connected));
  }

  public send(type: string, payload: Record<string, any> = {}) {
    const raw = JSON.stringify({ type, payload });
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(raw);
    } else {
      this.messageQueue.push(raw);
      if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
        this.connect().catch(() => {});
      }
    }
  }

  public joinRoom(roomId: string, username: string, userId?: string, passcode?: string) {
    this.send('join_room', { roomId, username, userId, passcode });
  }

  public leaveRoom(roomId: string) {
    this.send('leave_room', { roomId });
  }

  public play(currentTime?: number) {
    this.send('play', { currentTime });
  }

  public pause(currentTime?: number) {
    this.send('pause', { currentTime });
  }

  public seek(time: number) {
    this.send('seek', { time });
  }

  public changeVideo(videoId: string) {
    this.send('change_video', { videoId });
  }

  public assignRole(userId: string, role: Role) {
    this.send('assign_role', { userId, role });
  }

  public removeParticipant(userId: string) {
    this.send('remove_participant', { userId });
  }

  public transferHost(userId: string) {
    this.send('transfer_host', { userId });
  }

  public sendChatMessage(message: string) {
    this.send('chat_message', { message });
  }

  public sendReaction(emoji: string) {
    this.send('reaction', { emoji });
  }

  public requestSync() {
    this.send('request_sync', {});
  }

  public requestControl() {
    this.send('request_control', {});
  }

  public approveControl(userId: string) {
    this.send('approve_control', { userId });
  }

  public addToQueue(videoId: string, title?: string) {
    this.send('add_to_queue', { videoId, title });
  }

  public removeFromQueue(queueItemId: string) {
    this.send('remove_from_queue', { queueItemId });
  }

  public playQueueItem(queueItemId: string) {
    this.send('play_queue_item', { queueItemId });
  }

  public changeSpeed(speed: number) {
    this.send('change_speed', { speed });
  }

  public raiseHand(raised: boolean) {
    this.send('raise_hand', { raised });
  }

  public createPoll(question: string, options: string[]) {
    this.send('create_poll', { question, options });
  }

  public votePoll(pollId: string, optionIndex: number) {
    this.send('vote_poll', { pollId, optionIndex });
  }

  public endPoll() {
    this.send('end_poll', {});
  }

  public playSound(soundId: string) {
    this.send('play_sound', { soundId });
  }

  public addBookmark(time: number, title?: string) {
    this.send('add_bookmark', { time, title });
  }

  public jumpBookmark(time: number) {
    this.send('jump_bookmark', { time });
  }

  public deleteBookmark(bookmarkId: string) {
    this.send('delete_bookmark', { bookmarkId });
  }

  public sendTyping(isTyping: boolean) {
    this.send('user_typing', { isTyping });
  }

  public sendWebRtcSignal(targetUserId: string, signal: any) {
    this.send('webrtc_signal', { targetUserId, signal });
  }

  public sendWebRtcMediaState(isAudioMuted: boolean, isVideoEnabled: boolean, isSpeaking?: boolean) {
    this.send('webrtc_media_state', { isAudioMuted, isVideoEnabled, isSpeaking });
  }

  public sendGift(giftType: string, giftIcon: string, giftName: string) {
    this.send('send_gift', { giftType, giftIcon, giftName });
  }

  public startTrivia(question: string, options: string[], correctIndex: number, duration: number = 15) {
    this.send('start_trivia', { question, options, correctIndex, duration });
  }

  public answerTrivia(optionIndex: number) {
    this.send('answer_trivia', { optionIndex });
  }

  public endTrivia() {
    this.send('end_trivia', {});
  }

  public clearChat() {
    this.send('clear_chat', {});
  }

  public broadcastAnnouncement(announcement: string) {
    this.send('broadcast_announcement', { announcement });
  }

  public muteAll() {
    this.send('mute_all', {});
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.notifyStatus(false);
  }
}

export const wsService = new WebSocketClient();
