import React, { useState, useEffect } from 'react';
import { Subtitles, Upload, Trash2, Sparkles, Globe, Radio } from 'lucide-react';
import { parseSubtitles, getActiveCue, DEMO_SUBTITLES, type SubtitleCue } from '../services/subtitleParser';
import { wsService } from '../services/websocket';
import type { Role, SubtitlesSyncPayload } from '../types/party';

interface SubtitlesOverlayProps {
  currentTime: number;
  userRole?: Role;
  initialSubtitles?: SubtitlesSyncPayload | null;
  showFloatingButton?: boolean;
}

export const SubtitlesOverlay: React.FC<SubtitlesOverlayProps> = ({
  currentTime,
  userRole = 'PARTICIPANT',
  initialSubtitles = null,
  showFloatingButton = true,
}) => {
  const [cues, setCues] = useState<SubtitleCue[]>(initialSubtitles?.cues || []);
  const [isEnabled, setIsEnabled] = useState<boolean>(initialSubtitles?.isEnabled ?? false);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [rawText, setRawText] = useState('');
  const [offsetSeconds, setOffsetSeconds] = useState<number>(initialSubtitles?.offsetSeconds || 0);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [colorTheme, setColorTheme] = useState<'white' | 'yellow' | 'cyan'>('yellow');
  const [fileName, setFileName] = useState<string | null>(initialSubtitles?.fileName || null);
  const [broadcastToRoom, setBroadcastToRoom] = useState(true);
  const [isHostSynced, setIsHostSynced] = useState(Boolean(initialSubtitles));

  const isHostOrMod = userRole === 'HOST' || userRole === 'MODERATOR';

  // Listen for real-time room subtitles sync from host
  useEffect(() => {
    const unsub = wsService.on('subtitles_updated', (payload: any) => {
      if (payload) {
        setCues(payload.cues || []);
        setIsEnabled(payload.isEnabled ?? false);
        if (payload.fileName !== undefined) setFileName(payload.fileName);
        if (typeof payload.offsetSeconds === 'number') setOffsetSeconds(payload.offsetSeconds);
        setIsHostSynced(true);
      }
    });
    return unsub;
  }, []);

  // Update if initialSubtitles prop changes
  useEffect(() => {
    if (initialSubtitles) {
      setCues(initialSubtitles.cues || []);
      setIsEnabled(initialSubtitles.isEnabled ?? false);
      if (initialSubtitles.fileName) setFileName(initialSubtitles.fileName);
      if (typeof initialSubtitles.offsetSeconds === 'number') setOffsetSeconds(initialSubtitles.offsetSeconds);
      setIsHostSynced(true);
    }
  }, [initialSubtitles]);

  const activeCue = isEnabled ? getActiveCue(cues, currentTime) : null;

  const broadcastIfHost = (newCues: SubtitleCue[], newEnabled: boolean, name: string | null, offset: number) => {
    if (isHostOrMod && broadcastToRoom) {
      wsService.syncSubtitles(newCues, newEnabled, name || undefined, offset);
      setIsHostSynced(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        const parsed = parseSubtitles(content, offsetSeconds);
        setCues(parsed);
        setIsEnabled(true);
        broadcastIfHost(parsed, true, file.name, offsetSeconds);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyRawText = () => {
    if (!rawText.trim()) return;
    const parsed = parseSubtitles(rawText, offsetSeconds);
    setCues(parsed);
    setIsEnabled(true);
    setFileName('Pasted Subtitles');
    broadcastIfHost(parsed, true, 'Pasted Subtitles', offsetSeconds);
  };

  const handleLoadDemo = () => {
    setRawText(DEMO_SUBTITLES);
    const parsed = parseSubtitles(DEMO_SUBTITLES, offsetSeconds);
    setCues(parsed);
    setIsEnabled(true);
    setFileName('Demo Subtitles (Sample)');
    broadcastIfHost(parsed, true, 'Demo Subtitles (Sample)', offsetSeconds);
  };

  const handleClear = () => {
    setCues([]);
    setRawText('');
    setFileName(null);
    setIsEnabled(false);
    broadcastIfHost([], false, null, 0);
  };

  const handleToggleEnable = () => {
    const nextState = !isEnabled;
    setIsEnabled(nextState);
    broadcastIfHost(cues, nextState, fileName, offsetSeconds);
  };

  const handleOffsetChange = (delta: number) => {
    const newOffset = Math.round((offsetSeconds + delta) * 10) / 10;
    setOffsetSeconds(newOffset);
    if (rawText.trim()) {
      const parsed = parseSubtitles(rawText, newOffset);
      setCues(parsed);
      broadcastIfHost(parsed, isEnabled, fileName, newOffset);
    } else if (cues.length > 0) {
      broadcastIfHost(cues, isEnabled, fileName, newOffset);
    }
  };

  const getFontSizePx = () => {
    switch (fontSize) {
      case 'sm': return '14px';
      case 'md': return '18px';
      case 'lg': return '24px';
      case 'xl': return '30px';
      default: return '18px';
    }
  };

  const getTextColor = () => {
    switch (colorTheme) {
      case 'yellow': return '#fef08a'; // cinema yellow
      case 'cyan': return '#67e8f9';   // sci-fi cyan
      case 'white': return '#ffffff';
      default: return '#fef08a';
    }
  };

  return (
    <>
      {/* Active Subtitle Display on top of YouTube Player */}
      {isEnabled && activeCue && (
        <div
          style={{
            position: 'absolute',
            bottom: '68px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '85%',
            textAlign: 'center',
            zIndex: 22,
            pointerEvents: 'none',
            transition: 'opacity 0.15s ease',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(0, 0, 0, 0.82)',
              backdropFilter: 'blur(5px)',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: getTextColor(),
              fontSize: getFontSizePx(),
              fontWeight: 600,
              lineHeight: 1.35,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.9), 0 0 2px #000',
              letterSpacing: '0.2px',
              whiteSpace: 'pre-wrap',
            }}
          >
            {activeCue.text}
          </div>
        </div>
      )}

      {/* Floating Subtitles Trigger Button on Player Top-Right */}
      {showFloatingButton && (
        <button
          type="button"
          onClick={() => setIsOpenModal(true)}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 28,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: isEnabled ? 'rgba(234, 179, 8, 0.28)' : 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            border: isEnabled ? '1px solid #facc15' : '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '8px',
            padding: '5px 10px',
            color: isEnabled ? '#fef08a' : '#cbd5e1',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          }}
          title="Subtitle & Closed Captions (SRT / VTT)"
        >
          <Subtitles size={13} color={isEnabled ? '#facc15' : '#94a3b8'} />
          <span>CC {isEnabled ? 'ON' : 'OFF'}</span>
          {isHostSynced && (
            <span
              style={{
                fontSize: '9px',
                background: 'rgba(234, 179, 8, 0.35)',
                color: '#fef08a',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 700,
              }}
            >
              SYNCED
            </span>
          )}
        </button>
      )}

      {/* Modal / Popout for Subtitle Configuration */}
      {isOpenModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpenModal(false);
          }}
        >
          <div
            className="glass-card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '540px',
              background: 'rgba(18, 22, 38, 0.98)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: '16px',
              padding: '22px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(234, 179, 8, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(234, 179, 8, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#facc15',
                  }}
                >
                  <Subtitles size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                    Subtitles & Closed Captions
                  </h3>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                    Synchronized .SRT & .VTT caption engine
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '18px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Toggle Status Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
              }}
            >
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                  Enable Subtitles
                </span>
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                  {fileName ? `${fileName} (${cues.length} cues)` : 'No file currently loaded'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleEnable}
                disabled={cues.length === 0}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  background: isEnabled
                    ? 'linear-gradient(135deg, #eab308, #ca8a04)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: isEnabled ? '#000' : '#a0aec0',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: cues.length > 0 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                }}
              >
                {isEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Room Sync Control / Status Banner */}
            {isHostOrMod ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={15} color="#38bdf8" />
                  <span style={{ fontSize: '12px', color: '#bae6fd', fontWeight: 600 }}>
                    Broadcast subtitles to all viewers in room
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={broadcastToRoom}
                  onChange={(e) => setBroadcastToRoom(e.target.checked)}
                  style={{ accentColor: '#38bdf8', cursor: 'pointer', width: '16px', height: '16px' }}
                />
              </div>
            ) : isHostSynced ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: 'rgba(234, 179, 8, 0.1)',
                  border: '1px solid rgba(234, 179, 8, 0.28)',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#fef08a',
                  fontWeight: 600,
                }}
              >
                <Radio size={14} color="#facc15" />
                <span>Synchronized by Host. Captions will play automatically for you.</span>
              </div>
            ) : null}

            {/* Quick Demo & File Upload */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px dashed rgba(255, 255, 255, 0.25)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  color: '#e2e8f0',
                  fontSize: '12px',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                <Upload size={14} color="#38bdf8" />
                <span>Upload .SRT / .VTT</span>
                <input
                  type="file"
                  accept=".srt,.vtt,text/plain"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>

              <button
                type="button"
                onClick={handleLoadDemo}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '10px',
                  color: '#fca5a5',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Sparkles size={14} />
                <span>Load Demo Subtitles</span>
              </button>
            </div>

            {/* Paste SRT/VTT textarea */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Or paste raw SRT / VTT timestamped text:
                </span>
                {cues.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f87171',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Trash2 size={11} /> Clear
                  </button>
                )}
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`1\n00:00:01,000 --> 00:00:04,000\nHello world!\n\n2\n00:00:05,000 --> 00:00:09,000\nWelcome to Watch Party!`}
                rows={3}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '8px',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  resize: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleApplyRawText}
                disabled={!rawText.trim()}
                style={{
                  padding: '6px 12px',
                  background: rawText.trim() ? '#eab308' : 'rgba(255, 255, 255, 0.05)',
                  color: rawText.trim() ? '#000' : '#64748b',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: rawText.trim() ? 'pointer' : 'default',
                  alignSelf: 'flex-end',
                }}
              >
                Parse & Apply Text
              </button>
            </div>

            {/* Styling and Delay Adjustments */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* Font Size */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>FONT SIZE:</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['sm', 'md', 'lg', 'xl'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setFontSize(sz)}
                      style={{
                        flex: 1,
                        padding: '4px 0',
                        background: fontSize === sz ? 'rgba(234, 179, 8, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        border: fontSize === sz ? '1px solid #eab308' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: fontSize === sz ? '#facc15' : '#cbd5e0',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                      }}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>COLOR:</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setColorTheme('yellow')}
                    style={{
                      flex: 1,
                      padding: '4px 0',
                      background: colorTheme === 'yellow' ? 'rgba(254, 240, 138, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: colorTheme === 'yellow' ? '1px solid #fde047' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fef08a',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Yellow
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorTheme('white')}
                    style={{
                      flex: 1,
                      padding: '4px 0',
                      background: colorTheme === 'white' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: colorTheme === 'white' ? '1px solid #fff' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    White
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorTheme('cyan')}
                    style={{
                      flex: 1,
                      padding: '4px 0',
                      background: colorTheme === 'cyan' ? 'rgba(103, 232, 249, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: colorTheme === 'cyan' ? '1px solid #67e8f9' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#67e8f9',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Cyan
                  </button>
                </div>
              </div>

              {/* Timing Delay Offset */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  SYNC OFFSET ({offsetSeconds > 0 ? `+${offsetSeconds}` : offsetSeconds}s):
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleOffsetChange(-0.5)}
                    style={{
                      flex: 1,
                      padding: '4px 0',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#cbd5e0',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="Shift earlier by 0.5s"
                  >
                    -0.5s
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOffsetChange(0.5)}
                    style={{
                      flex: 1,
                      padding: '4px 0',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#cbd5e0',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="Shift later by 0.5s"
                  >
                    +0.5s
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
