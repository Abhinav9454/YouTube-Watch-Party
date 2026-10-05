import React, { useState } from 'react';
import { Sliders, Check } from 'lucide-react';

interface AudioEqualizerProps {
  onPresetChange?: (presetName: string) => void;
}

interface EQPreset {
  id: string;
  name: string;
  icon: string;
  bass: number; // dB
  mid: number;  // dB
  treble: number; // dB
}

const PRESETS: EQPreset[] = [
  { id: 'flat', name: 'Flat (Standard)', icon: '🎵', bass: 0, mid: 0, treble: 0 },
  { id: 'cinema', name: 'Cinema 3D', icon: '🎬', bass: 4, mid: 2, treble: 5 },
  { id: 'bass', name: 'Bass Boost', icon: '💥', bass: 8, mid: -1, treble: 2 },
  { id: 'vocal', name: 'Vocal Clarity', icon: '🗣️', bass: -2, mid: 6, treble: 3 },
  { id: 'night', name: 'Night Mode', icon: '🌙', bass: -4, mid: 4, treble: -3 },
];

export const AudioEqualizer: React.FC<AudioEqualizerProps> = ({ onPresetChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('flat');
  const [bass, setBass] = useState(0);
  const [mid, setMid] = useState(0);
  const [treble, setTreble] = useState(0);

  const handleSelectPreset = (p: EQPreset) => {
    setActivePreset(p.id);
    setBass(p.bass);
    setMid(p.mid);
    setTreble(p.treble);
    if (onPresetChange) {
      onPresetChange(p.name);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: isOpen ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)',
          border: isOpen ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          padding: '6px 10px',
          color: isOpen ? '#38bdf8' : '#fff',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        title="Audio Equalizer & Sound Enhancer"
      >
        <Sliders size={13} />
        <span>EQ {activePreset !== 'flat' ? `(${activePreset.toUpperCase()})` : ''}</span>
      </button>

      {isOpen && (
        <div
          className="eq-dropdown glass-card animate-fade-in"
          style={{
            position: 'absolute',
            bottom: '44px',
            right: 0,
            width: '280px',
            background: 'rgba(18, 21, 35, 0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '14px',
            padding: '14px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.2)',
            zIndex: 100,
          }}
        >
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
              <Sliders size={15} color="#38bdf8" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                Sound Equalizer
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

          {/* Preset Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
            <span style={{ fontSize: '10px', color: '#a0aec0', marginBottom: '2px' }}>
              AUDIO PRESETS:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {PRESETS.map((p) => {
                const isSelected = activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 8px',
                      background: isSelected ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      color: isSelected ? '#38bdf8' : '#cbd5e0',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{p.icon}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </span>
                    {isSelected && <Check size={11} style={{ marginLeft: 'auto' }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Equalizer Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: '#a0aec0' }}>MANUAL ADJUSTMENT:</span>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e0', marginBottom: '2px' }}>
                <span>Low / Bass (60-250Hz)</span>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>{bass > 0 ? `+${bass}` : bass} dB</span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                value={bass}
                onChange={(e) => {
                  setBass(Number(e.target.value));
                  setActivePreset('custom');
                }}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e0', marginBottom: '2px' }}>
                <span>Mid / Vocals (1-3kHz)</span>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>{mid > 0 ? `+${mid}` : mid} dB</span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                value={mid}
                onChange={(e) => {
                  setMid(Number(e.target.value));
                  setActivePreset('custom');
                }}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e0', marginBottom: '2px' }}>
                <span>High / Treble (4-12kHz)</span>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>{treble > 0 ? `+${treble}` : treble} dB</span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                value={treble}
                onChange={(e) => {
                  setTreble(Number(e.target.value));
                  setActivePreset('custom');
                }}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
