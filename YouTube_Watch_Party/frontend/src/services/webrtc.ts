import { wsService } from './websocket';
import type { WebRtcSignalPayload } from '../types/party';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

type StreamCallback = (stream: MediaStream) => void;
type PeerStreamCallback = (peerId: string, stream: MediaStream) => void;
type PeerLeftCallback = (peerId: string) => void;
type SpeakingCallback = (peerId: string, isSpeaking: boolean) => void;
type DuckingCallback = (shouldDuck: boolean) => void;

class WebRtcService {
  private localStream: MediaStream | null = null;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private audioContext: AudioContext | null = null;
  private analysers: Map<string, AnalyserNode> = new Map();

  private isAudioMuted: boolean = false;
  private isVideoEnabled: boolean = false;
  private isDeafened: boolean = false;
  private audioDuckingEnabled: boolean = true;
  private duckingTimeout: ReturnType<typeof setTimeout> | null = null;

  // Listeners
  private localStreamListeners: Set<StreamCallback> = new Set();
  private remoteStreamListeners: Set<PeerStreamCallback> = new Set();
  private peerLeftListeners: Set<PeerLeftCallback> = new Set();
  private speakingListeners: Set<SpeakingCallback> = new Set();
  private duckingListeners: Set<DuckingCallback> = new Set();

  private isInitialized = false;

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Listen to signaling messages from backend
    wsService.on('webrtc_signal', async (payload: WebRtcSignalPayload) => {
      const senderId = payload.senderUserId;
      const { signal } = payload;
      if (!senderId || !signal) return;

      try {
        if (signal.type === 'offer') {
          await this.handleOffer(senderId, signal.sdp);
        } else if (signal.type === 'answer') {
          await this.handleAnswer(senderId, signal.sdp);
        } else if (signal.type === 'candidate') {
          await this.handleCandidate(senderId, signal.candidate);
        }
      } catch (err) {
        console.warn('Error handling WebRTC signal:', err);
      }
    });

    wsService.on('user_left', (payload: { userId: string }) => {
      if (payload.userId) {
        this.closePeer(payload.userId);
      }
    });
  }

  public async startMedia(video: boolean = false): Promise<MediaStream | null> {
    this.init();
    try {
      if (this.localStream) {
        this.stopMedia();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: video ? { width: 320, height: 240, frameRate: 15 } : false,
      });

      this.localStream = stream;
      this.isVideoEnabled = video;
      this.isAudioMuted = false;

      // Setup local audio analyzer for speech detection
      this.setupVAD('local', stream);

      this.localStreamListeners.forEach((cb) => cb(stream));

      // Broadcast media state
      wsService.sendWebRtcMediaState(this.isAudioMuted, this.isVideoEnabled);

      return stream;
    } catch (err) {
      console.warn('Microphone/Camera permission denied or not found:', err);
      return null;
    }
  }

  public stopMedia() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    this.remoteStreams.clear();
  }

  public toggleMute(): boolean {
    if (!this.localStream) return true;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      this.isAudioMuted = !this.isAudioMuted;
      audioTrack.enabled = !this.isAudioMuted;
      wsService.sendWebRtcMediaState(this.isAudioMuted, this.isVideoEnabled);
    }
    return this.isAudioMuted;
  }

  public async toggleVideo(): Promise<boolean> {
    if (!this.localStream) {
      await this.startMedia(true);
      return this.isVideoEnabled;
    }

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      this.isVideoEnabled = !this.isVideoEnabled;
      videoTrack.enabled = this.isVideoEnabled;
    } else if (!this.isVideoEnabled) {
      // Add video track dynamically
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, frameRate: 15 },
        });
        const newTrack = videoStream.getVideoTracks()[0];
        this.localStream.addTrack(newTrack);
        this.isVideoEnabled = true;

        // Add to active peers
        this.peers.forEach((pc) => {
          pc.addTrack(newTrack, this.localStream!);
        });
      } catch (e) {
        console.warn('Could not add camera video track:', e);
      }
    }

    wsService.sendWebRtcMediaState(this.isAudioMuted, this.isVideoEnabled);
    return this.isVideoEnabled;
  }

  public toggleDeafen(): boolean {
    this.isDeafened = !this.isDeafened;
    this.remoteStreams.forEach((stream) => {
      stream.getAudioTracks().forEach((t) => {
        t.enabled = !this.isDeafened;
      });
    });
    return this.isDeafened;
  }

  public setAudioDucking(enabled: boolean) {
    this.audioDuckingEnabled = enabled;
  }

  public isAudioDuckingEnabled(): boolean {
    return this.audioDuckingEnabled;
  }

  // Connect to a peer (called by caller/host or when user joins)
  public async callPeer(targetUserId: string) {
    this.init();
    if (this.peers.has(targetUserId)) return;

    const pc = this.createPeerConnection(targetUserId);
    this.peers.set(targetUserId, pc);

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    wsService.sendWebRtcSignal(targetUserId, {
      type: 'offer',
      sdp: pc.localDescription,
    });
  }

  private async handleOffer(senderId: string, sdp: RTCSessionDescriptionInit) {
    let pc = this.peers.get(senderId);
    if (!pc) {
      pc = this.createPeerConnection(senderId);
      this.peers.set(senderId, pc);
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc!.addTrack(track, this.localStream!);
      });
    }

    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    wsService.sendWebRtcSignal(senderId, {
      type: 'answer',
      sdp: pc.localDescription,
    });
  }

  private async handleAnswer(senderId: string, sdp: RTCSessionDescriptionInit) {
    const pc = this.peers.get(senderId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    }
  }

  private async handleCandidate(senderId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peers.get(senderId);
    if (pc && candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('Error adding ICE candidate:', e);
      }
    }
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(RTC_CONFIG);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsService.sendWebRtcSignal(peerId, {
          type: 'candidate',
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      this.remoteStreams.set(peerId, stream);
      this.setupVAD(peerId, stream);
      this.remoteStreamListeners.forEach((cb) => cb(peerId, stream));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(peerId);
      }
    };

    return pc;
  }

  private closePeer(peerId: string) {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
    }
    this.remoteStreams.delete(peerId);
    this.analysers.delete(peerId);
    this.peerLeftListeners.forEach((cb) => cb(peerId));
  }

  // Voice Activity Detection (AnalyserNode) & Audio Ducking
  private setupVAD(id: string, stream: MediaStream) {
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const source = this.audioContext.createMediaStreamSource(stream);
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      this.analysers.set(id, analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      let wasSpeaking = false;

      const checkSpeech = () => {
        if (!this.analysers.has(id)) return;
        analyser.getByteFrequencyData(buffer);

        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const average = sum / buffer.length;
        const isSpeaking = average > 18;

        if (isSpeaking !== wasSpeaking) {
          wasSpeaking = isSpeaking;
          this.speakingListeners.forEach((cb) => cb(id, isSpeaking));

          // Audio Ducking trigger if a remote peer speaks
          if (id !== 'local' && this.audioDuckingEnabled) {
            if (isSpeaking) {
              if (this.duckingTimeout) clearTimeout(this.duckingTimeout);
              this.duckingListeners.forEach((cb) => cb(true));
            } else {
              this.duckingTimeout = setTimeout(() => {
                this.duckingListeners.forEach((cb) => cb(false));
              }, 1200);
            }
          }
        }

        requestAnimationFrame(checkSpeech);
      };

      checkSpeech();
    } catch (e) {
      console.warn('VAD setup failed:', e);
    }
  }

  // Event Subscription Helpers
  public onLocalStream(cb: StreamCallback) {
    this.localStreamListeners.add(cb);
    if (this.localStream) cb(this.localStream);
    return () => this.localStreamListeners.delete(cb);
  }

  public onRemoteStream(cb: PeerStreamCallback) {
    this.remoteStreamListeners.add(cb);
    return () => this.remoteStreamListeners.delete(cb);
  }

  public onPeerLeft(cb: PeerLeftCallback) {
    this.peerLeftListeners.add(cb);
    return () => this.peerLeftListeners.delete(cb);
  }

  public onSpeakingChange(cb: SpeakingCallback) {
    this.speakingListeners.add(cb);
    return () => this.speakingListeners.delete(cb);
  }

  public onAudioDucking(cb: DuckingCallback) {
    this.duckingListeners.add(cb);
    return () => this.duckingListeners.delete(cb);
  }

  public getLocalStream() {
    return this.localStream;
  }

  public getIsAudioMuted() {
    return this.isAudioMuted;
  }

  public getIsVideoEnabled() {
    return this.isVideoEnabled;
  }

  public getIsDeafened() {
    return this.isDeafened;
  }
}

export const webrtcService = new WebRtcService();
