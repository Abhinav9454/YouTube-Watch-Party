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

  const isServerSyncingRef = useRef(false);
  const hasUserInteractedRef = useRef(false);

  const canControl = userRole === 'HOST' || userRole === 'MODERATOR';


  useEffect(() => {
    let checkInterval: any;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
      }

      playerRef.current = new window.YT.Player('yt-player-iframe', {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: canControl ? 0 : 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            setIsPlayerReady(true);
            setDuration(event.target.getDuration() || 0);
            event.target.setVolume(volume);
            if (serverPlaybackSpeed && event.target.setPlaybackRate) {
              event.target.setPlaybackRate(serverPlaybackSpeed);
            }
            syncWithServer(serverPlayState, serverCurrentTime, serverTimestamp, true);
          },
          onStateChange: (event: any) => {
            if (isServerSyncingRef.current) {
              return;
            }

            if (event.data === window.YT.PlayerState.ENDED) {
              if (onVideoEnded) {
                onVideoEnded();
              }
              return;
            }

            if (!canControl) {
              syncWithServer(serverPlayState, serverCurrentTime, serverTimestamp, true);
              return;
            }

            if (event.data === window.YT.PlayerState.PLAYING) {
              onPlay(playerRef.current.getCurrentTime());
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              onPause(playerRef.current.getCurrentTime());
            }
          },
        },
      });
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [videoId]);

  const handleUserUnmute = useCallback(() => {
    hasUserInteractedRef.current = true;
    if (playerRef.current) {
      try {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume > 0 ? volume : 80);
      } catch (e) {
        console.warn('Failed to unmute:', e);
      }
    }
    setIsMuted(false);
    setNeedsUserUnmute(false);
  }, [volume]);

  // Global user activation listener: first click or keypress anywhere on the page un-mutes
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

        // Calculate exact expected video position accounting for elapsed time while playing
        let expectedTime = targetTime;
        if (targetPlayState === 'PLAYING' && targetTimestamp) {
          const speed = serverPlaybackSpeed || 1.0;
          const elapsedSec = ((Date.now() - targetTimestamp) / 1000) * speed;
          if (elapsedSec > 0 && elapsedSec < 86400) {
            expectedTime += elapsedSec;
          }
        }

        const localTime = playerRef.current.getCurrentTime() || 0;
        const drift = Math.abs(localTime - expectedTime);

        // 1.2s Broadcast Drift Tolerance: avoids micro-stuttering and continuous rebuffering
        if (forceSeek || drift > 1.2) {
          playerRef.current.seekTo(expectedTime, true);
          setCurrentTime(expectedTime);
        }

        if (targetPlayState === 'PLAYING') {
          // If user has not yet interacted with this tab, modern browsers block unmuted autoplay.
          // Start muted so playback stays in 100% millisecond sync across all tabs.
          if (!hasUserInteractedRef.current) {
            try {
              playerRef.current.mute();
              setIsMuted(true);
              setNeedsUserUnmute(true);
            } catch {}
          }

          playerRef.current.playVideo();

          // Autoplay fallback check: if browser paused/blocked it anyway, force mute & play
          setTimeout(() => {
            if (playerRef.current) {
              try {
                const state = playerRef.current.getPlayerState();
                // 1 = PLAYING, 3 = BUFFERING. If neither, unmuted autoplay was blocked by browser
                if (state !== 1 && state !== 3) {
                  playerRef.current.mute();
                  playerRef.current.playVideo();
                  setIsMuted(true);
                  setNeedsUserUnmute(true);
                }
              } catch {}
            }
          }, 350);
        } else if (targetPlayState === 'PAUSED') {
          playerRef.current.pauseVideo();
        }

        if (serverPlaybackSpeed && playerRef.current.getPlaybackRate() !== serverPlaybackSpeed) {
          playerRef.current.setPlaybackRate(serverPlaybackSpeed);
        }
      } catch (err) {
        console.warn('Error syncing player:', err);
      } finally {
        setTimeout(() => {
          isServerSyncingRef.current = false;
        }, 300);
      }
    },
    [isPlayerReady, serverPlaybackSpeed]
  );

  // Tab Visibility Catch-up: when user returns from another tab, immediately resync position
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlayerReady) {
        syncWithServer(serverPlayState, serverCurrentTime, serverTimestamp, false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlayerReady, serverPlayState, serverCurrentTime, serverTimestamp, syncWithServer]);


  useEffect(() => {
    if (isPlayerReady) {
      syncWithServer(serverPlayState, serverCurrentTime, serverTimestamp);
    }
  }, [serverPlayState, serverCurrentTime, serverTimestamp, serverPlaybackSpeed, isPlayerReady, syncWithServer]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (playerRef.current && isPlayerReady) {
        try {
          const time = playerRef.current.getCurrentTime() || 0;
          setCurrentTime(time);
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
    }, 500);

    return () => clearInterval(timer);
  }, [isPlayerReady, duration]);

  const handleTogglePlay = () => {
    if (!canControl || !playerRef.current) return;
    const nowTime = playerRef.current.getCurrentTime() || 0;
    if (serverPlayState === 'PLAYING') {
      onPause(nowTime);
    } else {
      onPlay(nowTime);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canControl || !playerRef.current) return;
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    onSeek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    if (playerRef.current) {
      playerRef.current.setVolume(newVol);
      if (newVol > 0 && isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  };

  const handleToggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
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

  // Global Keyboard Shortcuts (Space/K, M, F, T, Left/Right Seek)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') === 'true')) {
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
        onSeek(target);
      } else if (e.key === 'ArrowRight' && canControl) {
        e.preventDefault();
        const target = Math.min(duration, currentTime + 5);
        setCurrentTime(target);
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
        <div
          id="yt-player-iframe"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />

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
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(168, 85, 247, 0.95))',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '30px',
              boxShadow: '0 10px 35px rgba(99, 102, 241, 0.7), 0 0 20px rgba(168, 85, 247, 0.5)',
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
                background: 'rgba(99, 102, 241, 0.85)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 0 25px rgba(99, 102, 241, 0.6)',
                transition: 'transform 0.2s',
                transform: isHoveringControls ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              {serverPlayState === 'PLAYING' ? <Pause size={30} /> : <Play size={30} style={{ marginLeft: '4px' }} />}
            </div>
          </div>
        )}


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
              value={currentTime}
              disabled={!canControl}
              onChange={handleSeekChange}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                accentColor: canControl ? '#6366f1' : '#64748b',
                cursor: canControl ? 'pointer' : 'not-allowed',
                background: `linear-gradient(to right, #6366f1 ${(currentTime / (duration || 1)) * 100}%, rgba(255, 255, 255, 0.2) ${(currentTime / (duration || 1)) * 100}%)`,
              }}
            />
          </div>

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
                  onClick={() => onSeek(0)}
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
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

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

              {/* Speed Selector */}
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
                          onClick={() => {
                            onSpeedChange(speed);
                            setShowSpeedMenu(false);
                          }}
                          style={{
                            background: serverPlaybackSpeed === speed ? 'rgba(99, 102, 241, 0.3)' : 'none',
                            color: serverPlaybackSpeed === speed ? '#818cf8' : '#fff',
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
                    color: isTheaterMode ? '#818cf8' : '#fff',
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
                    color: isMiniPlayer ? '#818cf8' : '#fff',
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

      {canControl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Quick Presets:</span>
          {curatedPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onChangeVideo(preset.id)}
              style={{
                background: videoId === preset.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${videoId === preset.id ? 'rgba(99, 102, 241, 0.5)' : 'var(--border-subtle)'}`,
                color: videoId === preset.id ? '#a5b4fc' : 'var(--text-muted)',
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
