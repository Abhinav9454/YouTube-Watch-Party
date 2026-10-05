import React, { useState, useEffect } from 'react';
import { Repeat, RotateCcw } from 'lucide-react';

interface ABLoopControlProps {
  currentTime: number;
  onSeek: (time: number) => void;
  canControl?: boolean;
}

export const ABLoopControl: React.FC<ABLoopControlProps> = ({
  currentTime,
  onSeek,
  canControl: _canControl = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pointA, setPointA] = useState<number | null>(null);
  const [pointB, setPointB] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(false);

  // Monitor loop bounds and loop back to point A when reaching point B
  useEffect(() => {
    if (!isLooping || pointA === null || pointB === null) return;

    if (currentTime >= pointB) {
      onSeek(pointA);
    }
  }, [currentTime, isLooping, pointA, pointB, onSeek]);

  const handleSetPointA = () => {
    setPointA(Math.floor(currentTime));
    if (pointB !== null && Math.floor(currentTime) >= pointB) {
      setPointB(null); // Reset B if A is after B
    }
  };

  const handleSetPointB = () => {
    const candidateB = Math.ceil(currentTime);
    if (pointA === null || candidateB > pointA) {
      setPointB(candidateB);
      setIsLooping(true);
    }
  };

  const handleToggleLoop = () => {
    if (pointA !== null && pointB !== null && pointB > pointA) {
      setIsLooping(!isLooping);
    }
  };

  const handleClear = () => {
    setPointA(null);
    setPointB(null);
    setIsLooping(false);
  };

  const handleQuickLoop = (seconds: number) => {
    const start = Math.max(0, Math.floor(currentTime));
    const end = start + seconds;
    setPointA(start);
    setPointB(end);
    setIsLooping(true);
  };

  const formatTime = (secs: number | null) => {
    if (secs === null) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: isLooping
            ? 'linear-gradient(135deg, #ff2a2a, #dc2626)'
            : pointA !== null
            ? 'rgba(239, 68, 68, 0.2)'
            : 'rgba(255, 255, 255, 0.05)',
          border: isLooping
            ? '1px solid #ef4444'
            : pointA !== null
            ? '1px solid rgba(239, 68, 68, 0.5)'
            : '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '8px',
          padding: '6px 10px',
          color: isLooping ? '#fff' : '#a0aec0',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        title="A-B Segment Loop Repeater"
      >
        <Repeat size={13} style={{ animation: isLooping ? 'spin 6s linear infinite' : 'none' }} />
        <span>
          {isLooping
            ? `Looping [${formatTime(pointA)} - ${formatTime(pointB)}]`
            : pointA !== null
            ? `Loop A:${formatTime(pointA)}`
            : 'A-B Loop'}
        </span>
      </button>

      {/* A-B Loop Controls Dropdown */}
      {isOpen && (
        <div
          className="glass-card animate-fade-in"
          style={{
            position: 'absolute',
            bottom: '44px',
            right: 0,
            width: '290px',
            background: 'rgba(15, 20, 32, 0.98)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '14px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(239, 68, 68, 0.18)',
            zIndex: 100,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Repeat size={15} color="#c084fc" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                A-B Segment Repeat
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#a0aec0',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ✕
            </button>
          </div>

          <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
            Set Point A and Point B to loop a memorable chorus, dance sequence, or tutorial scene.
          </p>

          {/* Current Status Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '8px',
              marginBottom: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#a0aec0' }}>Segment:</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#e9d5ff', fontFamily: 'monospace' }}>
                {formatTime(pointA)} ➔ {formatTime(pointB)}
              </span>
            </div>

            {isLooping && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                }}
              >
                ACTIVE
              </span>
            )}
          </div>

          {/* Point A and Point B Setting Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <button
              type="button"
              onClick={handleSetPointA}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '8px',
                background: pointA !== null ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                border: pointA !== null ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: pointA !== null ? '#38bdf8' : '#e2e8f0',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span>[ A ]</span>
              <span>Set Start ({formatTime(currentTime)})</span>
            </button>

            <button
              type="button"
              onClick={handleSetPointB}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '8px',
                background: pointB !== null ? 'rgba(236, 72, 153, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                border: pointB !== null ? '1px solid #ec4899' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: pointB !== null ? '#f472b6' : '#e2e8f0',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span>[ B ]</span>
              <span>Set End ({formatTime(currentTime)})</span>
            </button>
          </div>

          {/* Loop Toggle and Clear Actions */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={handleToggleLoop}
              disabled={pointA === null || pointB === null}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 12px',
                background: isLooping
                  ? 'linear-gradient(135deg, #ff2a2a, #dc2626)'
                  : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: pointA !== null && pointB !== null ? 'pointer' : 'not-allowed',
                opacity: pointA !== null && pointB !== null ? 1 : 0.5,
              }}
            >
              <Repeat size={13} />
              <span>{isLooping ? 'Pause Loop' : 'Start Looping'}</span>
            </button>

            {(pointA !== null || pointB !== null) && (
              <button
                type="button"
                onClick={handleClear}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 10px',
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: '8px',
                  color: '#f87171',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Clear loop points"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Quick Presets */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              QUICK LOOP FROM HERE:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleQuickLoop(5)}
                style={{
                  padding: '4px 0',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#cbd5e0',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                +5s
              </button>
              <button
                type="button"
                onClick={() => handleQuickLoop(15)}
                style={{
                  padding: '4px 0',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#cbd5e0',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                +15s
              </button>
              <button
                type="button"
                onClick={() => handleQuickLoop(30)}
                style={{
                  padding: '4px 0',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#cbd5e0',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                +30s
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
