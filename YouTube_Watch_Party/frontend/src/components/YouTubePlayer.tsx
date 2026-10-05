import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, Lock, Check, Hand, Gauge, Monitor, PictureInPicture } from 'lucide-react';
import type { PlayState, Role } from '../types/party';
import { extractYouTubeVideoId } from '../utils/youtube';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  serverPlayState: PlayState;
  serverCurrentTime: number;
  serverPlaybackSpeed?: number;
  serverTimestamp?: number;
  userRole: Role;
  onPlay: (currentTime: number) => void;
  onPause: (currentTime: number) => void;
  onSeek: (time: number) => void;
  onChangeVideo: (videoId: string) => void;
  onSpeedChange?: (speed: number) => void;
  onRequestControl?: () => void;
  onVideoEnded?: () => void;
  isTheaterMode?: boolean;
  onToggleTheater?: () => void;
  isMiniPlayer?: boolean;
  onToggleMiniPlayer?: () => void;
  onTimeUpdate?: (time: number) => void;
}

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  serverPlayState,
  serverCurrentTime,
  serverPlaybackSpeed = 1.0,
  serverTimestamp,
  userRole,
  onPlay,
  onPause,
  onSeek,
  onChangeVideo,
  onSpeedChange,
  onRequestControl,
  onVideoEnded,
  isTheaterMode,
  onToggleTheater,
  isMiniPlayer,
  onToggleMiniPlayer,
  onTimeUpdate,
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isHoveringControls, setIsHoveringControls] = useState(false);
  const [newVideoInput, setNewVideoInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [hasRequestedControl, setHasRequestedControl] = useState(false);
  const [scrubberHoverTime, setScrubberHoverTime] = useState<number | null>(null);
  const [scrubberHoverX, setScrubberHoverX] = useState<number>(0);
  const [needsUserUnmute, setNeedsUserUnmute] = useState(false);

  // Smooth scrubber dragging state to prevent WebSocket flooding
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  // Synchronization locking & tracking refs to prevent echo loops and stutter
  const isServerSyncingRef = useRef(false);
  const hasUserInteractedRef = useRef(false);
  const lastActionTimestampRef = useRef<number>(0);
  const lastSeekTimestampRef = useRef<number>(0);
  const currentVideoIdRef = useRef<string>(videoId);

  const canControl = userRole === 'HOST' || userRole === 'MODERATOR';

  // Keep refs always up-to-date to eliminate stale closure bugs in YT event handlers
  const canControlRef = useRef(canControl);
  const serverPlayStateRef = useRef(serverPlayState);
  const serverCurrentTimeRef = useRef(serverCurrentTime);
  const serverTimestampRef = useRef(serverTimestamp);
  const serverPlaybackSpeedRef = useRef(serverPlaybackSpeed);
  const volumeRef = useRef(volume);
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onSeekRef = useRef(onSeek);
  const onVideoEndedRef = useRef(onVideoEnded);

  useEffect(() => {
    canControlRef.current = canControl;
    serverPlayStateRef.current = serverPlayState;
    serverCurrentTimeRef.current = serverCurrentTime;
    serverTimestampRef.current = serverTimestamp;
    serverPlaybackSpeedRef.current = serverPlaybackSpeed;
    volumeRef.current = volume;
    onPlayRef.current = onPlay;
    onPauseRef.current = onPause;
    onSeekRef.current = onSeek;
    onVideoEndedRef.current = onVideoEnded;
  });

  const handleUserUnmute = useCallback(() => {
    hasUserInteractedRef.current = true;
    if (playerRef.current) {
      try {
        playerRef.current.unMute();
        playerRef.current.setVolume(volumeRef.current > 0 ? volumeRef.current : 80);
      } catch (e) {
        console.warn('Failed to unmute:', e);
      }
    }
    setIsMuted(false);
    setNeedsUserUnmute(false);
  }, []);

  // Global user activation listener: first click, touch or keypress un-mutes
  useEffect(() => {
    const handleGlobalInteraction = () => {
      hasUserInteractedRef.current = true;
      if (needsUserUnmute && playerRef.current) {
        handleUserUnmute();
      }
    };

    window.addEventListener('click', handleGlobalInteraction, { capture: true });
    window.addEventListener('keydown', handleGlobalInteraction, { capture: true });
    window.addEventListener('touchstart', handleGlobalInteraction, { capture: true });

    return () => {
      window.removeEventListener('click', handleGlobalInteraction, { capture: true });
      window.removeEventListener('keydown', handleGlobalInteraction, { capture: true });
      window.removeEventListener('touchstart', handleGlobalInteraction, { capture: true });
    };
  }, [needsUserUnmute, handleUserUnmute]);

  // Real-Time Server Synchronization with instant action execution and tight drift bounds
  const syncWithServer = useCallback(
    (
      targetPlayState: PlayState,
      targetTime: number,
      targetTimestamp?: number,
      forceSeek: boolean = false
    ) => {
      if (!playerRef.current || !isPlayerReady) return;

      try {
        isServerSyncingRef.current = true;
        lastActionTimestampRef.current = Date.now();

        // Calculate expected video position with tightly bounded transit latency compensation
        let expectedTime = targetTime;
        if (targetPlayState === 'PLAYING' && targetTimestamp) {
          const speed = serverPlaybackSpeedRef.current || 1.0;
          // Clamp transit latency to 0-500ms to eliminate artificial clock-skew drift
          const transitLatencyMs = Math.max(0, Math.min(500, Date.now() - targetTimestamp));
          const elapsedSec = (transitLatencyMs / 1000) * speed;
          expectedTime += elapsedSec;
        }

        const localTime = playerRef.current.getCurrentTime ? playerRef.current.getCurrentTime() || 0 : 0;
        const drift = Math.abs(localTime - expectedTime);
        const timeSinceLastSeek = Date.now() - lastSeekTimestampRef.current;

        // INSTANTANEOUS SYNCHRONIZATION RULES:
        // 1. Explicit action (forceSeek = true): snap immediately to the exact frame.
        // 2. While PAUSED: any drift > 0.15s snaps immediately.
        // 3. While PLAYING: drift > 0.4s seeks immediately (rate-limited to 800ms to avoid audio stutter).
        // 4. Large drift (> 1.5s): emergency snap immediately.
        const isPausedDrift = targetPlayState === 'PAUSED' && drift > 0.15;
        const isSignificantDrift = targetPlayState === 'PLAYING' && drift > 0.4 && timeSinceLastSeek > 800;
        const isEmergencyDrift = drift > 1.5;

        const shouldSeek = forceSeek || isPausedDrift || isSignificantDrift || isEmergencyDrift;

        if (shouldSeek) {
          lastSeekTimestampRef.current = Date.now();
          playerRef.current.seekTo(expectedTime, true);
          setCurrentTime(expectedTime);
        }

        const playerState = playerRef.current.getPlayerState ? playerRef.current.getPlayerState() : -1;

        if (targetPlayState === 'PLAYING') {
          // If user hasn't yet interacted with this tab, browser blocks unmuted autoplay.
          // Mute initially so the video starts playing and stays in sync.
          if (!hasUserInteractedRef.current) {
            try {
              playerRef.current.mute();
              setIsMuted(true);
              setNeedsUserUnmute(true);
            } catch {}
          }

          // Trigger instant playback
          if (playerState !== 1) {
            playerRef.current.playVideo();
          }

          // Browser Autoplay Policy Fallback Check
          setTimeout(() => {
            if (playerRef.current) {
              try {
                const state = playerRef.current.getPlayerState();
                if (state !== 1 && state !== 3) {
                  playerRef.current.mute();
                  playerRef.current.playVideo();
                  setIsMuted(true);
                  setNeedsUserUnmute(true);
                }
              } catch {}
            }
          }, 200);
        } else if (targetPlayState === 'PAUSED') {
          // Trigger instant pause
          if (playerState !== 2) {
            playerRef.current.pauseVideo();
          }
        }

        if (serverPlaybackSpeedRef.current && playerRef.current.getPlaybackRate && playerRef.current.getPlaybackRate() !== serverPlaybackSpeedRef.current) {
          playerRef.current.setPlaybackRate(serverPlaybackSpeedRef.current);
        }
      } catch (err) {
        console.warn('Error syncing player:', err);
      } finally {
        setTimeout(() => {
          isServerSyncingRef.current = false;
        }, 250);
      }
    },
    [isPlayerReady]
  );

  // Initialize YouTube Iframe Player ONCE
  useEffect(() => {
    let checkInterval: any;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current) return;

      const iframeTarget = document.getElementById('yt-player-iframe');
      if (!iframeTarget) return;

      playerRef.current = new window.YT.Player('yt-player-iframe', {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1, // Global key listener handles shortcuts uniformly
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            setIsPlayerReady(true);
            currentVideoIdRef.current = videoId;
            setDuration(event.target.getDuration() || 0);
            event.target.setVolume(volumeRef.current);
            if (serverPlaybackSpeedRef.current && event.target.setPlaybackRate) {
              event.target.setPlaybackRate(serverPlaybackSpeedRef.current);
            }
            syncWithServer(
              serverPlayStateRef.current,
              serverCurrentTimeRef.current,
              serverTimestampRef.current,
              true
            );
          },
          onStateChange: (event: any) => {
            const currentState = event.data;
            const currentServerState = serverPlayStateRef.current;
            const canCtrl = canControlRef.current;

            // Handle video completion
            if (currentState === window.YT.PlayerState.ENDED) {
              if (onVideoEndedRef.current) {
                onVideoEndedRef.current();
              }
              return;
            }

            // If this state change was initiated by our own programmatic command, ignore
            if (isServerSyncingRef.current || Date.now() - lastActionTimestampRef.current < 1200) {
              return;
            }

            // Non-host participants can NEVER dictate room playback state
            if (!canCtrl) {
              // If participant fell out of sync (e.g. paused while server is PLAYING):
              if (currentServerState === 'PLAYING' && (currentState === 2 || currentState === -1)) {
                // Resume without force-seeking
                syncWithServer(currentServerState, serverCurrentTimeRef.current, serverTimestampRef.current, false);
              } else if (currentServerState === 'PAUSED' && currentState === 1) {
                try {
                  playerRef.current?.pauseVideo();
                } catch {}
              }
              return;
            }

            // Host / Moderator controls:
            // CRITICAL: Only broadcast if the server state is DIFFERENT from this new state!
            // If server is already PLAYING, onStateChange(PLAYING) is just an echo. Do NOT call onPlay()!
            if (currentState === window.YT.PlayerState.PLAYING && currentServerState !== 'PLAYING') {
              lastActionTimestampRef.current = Date.now();
              onPlayRef.current(playerRef.current.getCurrentTime());
            } else if (currentState === window.YT.PlayerState.PAUSED && currentServerState !== 'PAUSED') {
              lastActionTimestampRef.current = Date.now();
              onPauseRef.current(playerRef.current.getCurrentTime());
            }
          },
        },
      });
    };

    if (!window.YT) {
      const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };

      checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          initPlayer();
        }
      }, 200);
    } else {
      initPlayer();
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }
    };
  }, []);

  // Smooth Video Switching: load new video without destroying and recreating the player
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;
    if (currentVideoIdRef.current === videoId) return;

    currentVideoIdRef.current = videoId;
    isServerSyncingRef.current = true;
    lastActionTimestampRef.current = Date.now();

    try {
      const startTime = serverCurrentTimeRef.current || 0;
      if (typeof playerRef.current.loadVideoById === 'function') {
        if (serverPlayStateRef.current === 'PLAYING') {
          playerRef.current.loadVideoById(videoId, startTime);
        } else {
          playerRef.current.cueVideoById(videoId, startTime);
        }
      }
    } catch (err) {
      console.warn('Failed to dynamically switch video:', err);
    } finally {
      setTimeout(() => {
        isServerSyncingRef.current = false;
      }, 1500);
    }
  }, [videoId, isPlayerReady]);

  // Tab Visibility Catch-up: when user returns to this tab, smoothly re-align
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlayerReady) {
        syncWithServer(serverPlayStateRef.current, serverCurrentTimeRef.current, serverTimestampRef.current, false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlayerReady, syncWithServer]);

  // React to server state updates (play, pause, seek, speed change)
  const prevServerPlayStateRef = useRef<PlayState>(serverPlayState);
  const prevServerTimeRef = useRef<number>(serverCurrentTime);

  useEffect(() => {
    if (!isPlayerReady) return;

    // Detect if this update represents an explicit action (play/pause toggle or seek)
    const stateChanged = serverPlayState !== prevServerPlayStateRef.current;
    const seekChanged = Math.abs(serverCurrentTime - prevServerTimeRef.current) > 0.35;
    const isExplicitAction = stateChanged || seekChanged;

    prevServerPlayStateRef.current = serverPlayState;
    prevServerTimeRef.current = serverCurrentTime;

    syncWithServer(serverPlayState, serverCurrentTime, serverTimestamp, isExplicitAction);
  }, [serverPlayState, serverCurrentTime, serverTimestamp, serverPlaybackSpeed, isPlayerReady, syncWithServer]);

  // Periodic Scrubber & Subtitle Ticker (every 400ms)
  useEffect(() => {
    const timer = setInterval(() => {
      if (playerRef.current && isPlayerReady) {
        try {
          const time = playerRef.current.getCurrentTime() || 0;
          if (!isScrubbing) {
            setCurrentTime(time);
          }
          if (onTimeUpdate) {
            onTimeUpdate(time);
          }
          const dur = playerRef.current.getDuration() || 0;
          if (dur > 0 && dur !== duration) {
            setDuration(dur);
          }
        } catch {
          // ignore
        }
      }
    }, 400);

    return () => clearInterval(timer);
  }, [isPlayerReady, duration, isScrubbing, onTimeUpdate]);

  // Host Play / Pause Toggle
  const handleTogglePlay = () => {
    if (!canControl || !playerRef.current) return;
    const nowTime = playerRef.current.getCurrentTime() || 0;
    lastActionTimestampRef.current = Date.now();
    isServerSyncingRef.current = true;

    if (serverPlayStateRef.current === 'PLAYING') {
      try {
        playerRef.current.pauseVideo();
      } catch {}
      onPause(nowTime);
    } else {
      try {
        playerRef.current.playVideo();
      } catch {}
      onPlay(nowTime);
    }

    setTimeout(() => {
      isServerSyncingRef.current = false;
    }, 250);
  };

  // Replay from 00:00
  const handleReplay = () => {
    if (!canControl || !playerRef.current) return;
    lastSeekTimestampRef.current = Date.now();
    lastActionTimestampRef.current = Date.now();
    isServerSyncingRef.current = true;
    try {
      playerRef.current.seekTo(0, true);
    } catch {}
    setCurrentTime(0);
    onSeek(0);
    setTimeout(() => {
      isServerSyncingRef.current = false;
    }, 250);
  };

  // Scrubber drag handling (single seek on release, zero intermediate flooding)
  const handleScrubberStart = () => {
    if (!canControl) return;
    setIsScrubbing(true);
    setScrubValue(currentTime);
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canControl) return;
    const val = parseFloat(e.target.value);
    setScrubValue(val);
  };

  const handleScrubberEnd = () => {
    if (!canControl || !playerRef.current) return;
    setIsScrubbing(false);
    const target = scrubValue;
    setCurrentTime(target);
    lastSeekTimestampRef.current = Date.now();
    lastActionTimestampRef.current = Date.now();
    isServerSyncingRef.current = true;
    try {
      playerRef.current.seekTo(target, true);
    } catch {}
    onSeek(target);
    setTimeout(() => {
      isServerSyncingRef.current = false;
    }, 250);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      try {
        playerRef.current.setVolume(newVol);
        if (newVol > 0 && isMuted) {
          playerRef.current.unMute();
          setIsMuted(false);
          setNeedsUserUnmute(false);
        }
      } catch {}
    }
  };

  const handleToggleMute = () => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
        setNeedsUserUnmute(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch {}
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const handleVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newVideoInput.trim()) {
      const parsedId = extractYouTubeVideoId(newVideoInput.trim());
      onChangeVideo(parsedId);
      setNewVideoInput('');
      setShowUrlInput(false);
    }
  };

  const handleRequestControlClick = () => {
    if (onRequestControl) {
      onRequestControl();
      setHasRequestedControl(true);
      setTimeout(() => setHasRequestedControl(false), 5000);
    }
  };

  const handleSpeedSelect = (speed: number) => {
    if (!canControl) return;
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      try {
        playerRef.current.setPlaybackRate(speed);
      } catch {}
    }
    if (onSpeedChange) {
      onSpeedChange(speed);
    }
    setShowSpeedMenu(false);
  };

  // Global Keyboard Shortcuts (Space/K, M, F, T, P, ArrowLeft/Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      // If modifier keys are pressed (e.g. Alt + ArrowLeft / Alt + ArrowRight for Browser Back/Forward), allow browser navigation
      if (e.altKey || e.ctrlKey || e.metaKey) {
        return;
      }

      if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        handleFullscreen();
      } else if (e.key === 't' || e.key === 'T') {
        if (onToggleTheater) onToggleTheater();
      } else if (e.key === 'p' || e.key === 'P') {
        if (onToggleMiniPlayer) onToggleMiniPlayer();
      } else if (e.key === 'ArrowLeft' && canControl) {
        e.preventDefault();
        const target = Math.max(0, currentTime - 5);
        setCurrentTime(target);
        lastSeekTimestampRef.current = Date.now();
        lastActionTimestampRef.current = Date.now();
        playerRef.current?.seekTo(target, true);
        onSeek(target);
      } else if (e.key === 'ArrowRight' && canControl) {
        e.preventDefault();
        const target = Math.min(duration, currentTime + 5);
        setCurrentTime(target);
        lastSeekTimestampRef.current = Date.now();
        lastActionTimestampRef.current = Date.now();
        playerRef.current?.seekTo(target, true);
        onSeek(target);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canControl, currentTime, duration, serverPlayState, isMuted, onToggleTheater, onToggleMiniPlayer]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const curatedPresets = [
    { label: '🎵 Lofi Beats', id: 'jfKfPfyJRdk' },
    { label: '🐰 Big Buck Bunny', id: 'aqz-KE-bpKQ' },
    { label: '⚡ Synthwave Mix', id: '4xDzrJKXOOY' },
    { label: '☕ Jazz Cafe', id: 'Dx5qFachd3A' },
  ];

  const displayTime = isScrubbing ? scrubValue : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
      }}
    >
      <div
        onMouseEnter={() => setIsHoveringControls(true)}
        onMouseLeave={() => setIsHoveringControls(false)}
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%',
          background: '#000',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Iframe wrapper container */}
        <div
          ref={playerContainerRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <div id="yt-player-iframe" style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Full-player click target to unmute for non-host participants */}
        {!canControl && needsUserUnmute && (
          <div
            onClick={handleUserUnmute}
            title="Click anywhere to unmute"
            style={{
              position: 'absolute',
              inset: 0,
              cursor: 'pointer',
              zIndex: 22,
            }}
          />
        )}

        {/* Floating Banner when Autoplay was muted by browser policy */}
        {needsUserUnmute && (
          <div
            onClick={handleUserUnmute}
            className="animate-pulse"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'linear-gradient(135deg, #ff2a2a, #dc2626)',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '30px',
              boxShadow: '0 10px 35px rgba(239, 68, 68, 0.6), 0 0 20px rgba(0, 0, 0, 0.8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontWeight: 700,
              fontSize: '0.9rem',
              zIndex: 35,
              border: '1.5px solid rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(10px)',
              userSelect: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <VolumeX size={18} />
            </div>
            <span>Click to Unmute & Sync Audio 🔊</span>
          </div>
        )}

        {/* Big Center Play/Pause Overlay for Host */}
        {canControl && (
          <div
            onClick={handleTogglePlay}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: 'rgba(0, 0, 0, 0.15)',
              opacity: isHoveringControls || serverPlayState === 'PAUSED' ? 1 : 0,
              transition: 'opacity 0.25s ease',
              zIndex: 20,
            }}
          >
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.9)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 0 30px rgba(239, 68, 68, 0.65)',
                transition: 'transform 0.2s',
                transform: isHoveringControls ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              {serverPlayState === 'PLAYING' ? <Pause size={30} /> : <Play size={30} style={{ marginLeft: '4px' }} />}
            </div>
          </div>
        )}

        {/* Managed by Host Badge for Viewers */}
        {!canControl && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              background: 'rgba(15, 20, 35, 0.88)',
              backdropFilter: 'blur(8px)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              zIndex: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} color="#94a3b8" />
              <span>Managed by Host</span>
            </div>

            <button
              onClick={handleRequestControlClick}
              disabled={hasRequestedControl}
              className="btn-primary"
              style={{
                padding: '3px 10px',
                fontSize: '0.72rem',
                gap: '4px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              <Hand size={12} />
              {hasRequestedControl ? 'Requested!' : 'Request Control'}
            </button>
          </div>
        )}

        {/* Synced Live Badge */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(15, 20, 35, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.78rem',
            fontWeight: 600,
            zIndex: 20,
          }}
        >
          <span className="live-dot" />
          <span>{serverPlayState === 'PLAYING' ? `SYNCED (${serverPlaybackSpeed}x)` : 'PAUSED'}</span>
        </div>

        {/* Player Bottom Control Bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 70%, transparent 100%)',
            padding: '24px 16px 12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 25,
            transition: 'opacity 0.25s ease',
            opacity: isHoveringControls || serverPlayState === 'PAUSED' ? 1 : 0.85,
          }}
        >
          {/* Timeline Scrubber */}
          <div
            style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const pct = Math.max(0, Math.min(1, x / rect.width));
              setScrubberHoverTime(pct * (duration || 0));
              setScrubberHoverX(x);
            }}
            onMouseLeave={() => setScrubberHoverTime(null)}
          >
            {scrubberHoverTime !== null && duration > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: `${scrubberHoverX}px`,
                  transform: 'translateX(-50%)',
                  background: 'rgba(10, 15, 28, 0.92)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontFamily: 'monospace',
                  color: '#fff',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                  zIndex: 30,
                }}
              >
                {formatTime(scrubberHoverTime)}
              </div>
            )}
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={displayTime}
              disabled={!canControl}
              onPointerDown={handleScrubberStart}
              onMouseDown={handleScrubberStart}
              onTouchStart={handleScrubberStart}
              onChange={handleScrubberChange}
              onPointerUp={handleScrubberEnd}
              onMouseUp={handleScrubberEnd}
              onTouchEnd={handleScrubberEnd}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                accentColor: canControl ? '#ef4444' : '#64748b',
                cursor: canControl ? 'pointer' : 'not-allowed',
                background: `linear-gradient(to right, #ef4444 ${progressPercent}%, rgba(255, 255, 255, 0.2) ${progressPercent}%)`,
              }}
            />
          </div>

          {/* Action Buttons Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {canControl ? (
                <button
                  onClick={handleTogglePlay}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={serverPlayState === 'PLAYING' ? 'Pause' : 'Play'}
                >
                  {serverPlayState === 'PLAYING' ? <Pause size={20} /> : <Play size={20} />}
                </button>
              ) : (
                <div style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} />
                </div>
              )}

              {canControl && (
                <button
                  onClick={handleReplay}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Replay from start"
                >
                  <RotateCcw size={17} />
                </button>
              )}

              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {formatTime(displayTime)} / {formatTime(duration)}
              </span>

              {/* Volume & Mute Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
                <button
                  onClick={handleToggleMute}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  style={{
                    width: '60px',
                    height: '4px',
                    accentColor: '#fff',
                    cursor: 'pointer',
                  }}
                />
              </div>

              {/* Playback Speed Selector */}
              {canControl && onSpeedChange && (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '0.74rem', gap: '4px' }}
                    title="Change Playback Speed"
                  >
                    <Gauge size={13} /> {serverPlaybackSpeed}x
                  </button>

                  {showSpeedMenu && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: 0,
                        marginBottom: '6px',
                        background: 'rgba(15, 20, 35, 0.95)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        zIndex: 40,
                        boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
                      }}
                    >
                      {SPEED_OPTIONS.map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedSelect(speed)}
                          style={{
                            background: serverPlaybackSpeed === speed ? 'rgba(239, 68, 68, 0.25)' : 'none',
                            color: serverPlaybackSpeed === speed ? '#ef4444' : '#fff',
                            border: 'none',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '0.76rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontWeight: 600,
                          }}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Action Icons: Change Video, Theater, MiniPlayer, Fullscreen */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {canControl && (
                <button
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                >
                  Change Video
                </button>
              )}

              {onToggleTheater && (
                <button
                  onClick={onToggleTheater}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isTheaterMode ? '#ef4444' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={isTheaterMode ? 'Standard View' : 'Theater Mode'}
                >
                  <Monitor size={17} />
                </button>
              )}

              {onToggleMiniPlayer && (
                <button
                  onClick={onToggleMiniPlayer}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isMiniPlayer ? '#ef4444' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={isMiniPlayer ? 'Exit Mini-Player' : 'Picture-in-Picture Mini-Player'}
                >
                  <PictureInPicture size={17} />
                </button>
              )}

              <button
                onClick={handleFullscreen}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Fullscreen"
              >
                <Maximize size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* URL Input Drawer */}
      {canControl && showUrlInput && (
        <form
          onSubmit={handleVideoSubmit}
          className="glass-panel"
          style={{
            padding: '12px 16px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            className="input-field"
            placeholder="Paste YouTube URL, <iframe> embed code, or Video ID..."
            value={newVideoInput}
            onChange={(e) => setNewVideoInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '9px 16px', fontSize: '0.85rem' }}>
            <Check size={16} /> Load Video
          </button>
        </form>
      )}

      {/* Quick Curated Presets for Hosts */}
      {canControl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Quick Presets:</span>
          {curatedPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onChangeVideo(preset.id)}
              style={{
                background: videoId === preset.id ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${videoId === preset.id ? 'rgba(239, 68, 68, 0.5)' : 'var(--border-subtle)'}`,
                color: videoId === preset.id ? '#fca5a5' : 'var(--text-muted)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 12px',
                fontSize: '0.76rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
