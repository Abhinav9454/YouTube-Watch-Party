import React, { useState, useEffect } from 'react';
import type { Role, TriviaEndedPayload, TriviaQuestion } from '../types/party';
import { wsService } from '../services/websocket';

interface TriviaModalProps {
  activeTrivia: TriviaQuestion | null;
  lastTriviaResult: TriviaEndedPayload | null;
  userRole: Role;
  userId: string;
  onClearResult: () => void;
  showButton?: boolean;
}

const PRESET_QUESTIONS = [
  {
    q: 'In what year was YouTube officially launched?',
    opts: ['2003', '2005', '2007', '2010'],
    correct: 1,
  },
  {
    q: 'What is the most viewed video in YouTube history?',
    opts: ['Despacito', 'Baby Shark Dance', 'Shape of You', 'Gangnam Style'],
    correct: 1,
  },
  {
    q: 'Who composed the epic soundtrack for Interstellar and Inception?',
    opts: ['John Williams', 'Hans Zimmer', 'Ennio Morricone', 'Ludwig Göransson'],
    correct: 1,
  },
  {
    q: 'What was the first music video to hit 1 Billion views on YouTube?',
    opts: ['Baby - Justin Bieber', 'Gangnam Style - PSY', 'Bad Romance - Lady Gaga', 'See You Again - Wiz Khalifa'],
    correct: 1,
  },
];

export const TriviaModal: React.FC<TriviaModalProps> = ({
  activeTrivia,
  lastTriviaResult,
  userRole,
  userId,
  onClearResult,
  showButton = true,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [isCreating, setIsCreating] = useState(false);

  // Custom question state
  const [customQ, setCustomQ] = useState('');
  const [customOpts, setCustomOpts] = useState(['', '', '', '']);
  const [customCorrect, setCustomCorrect] = useState(0);

  const canHostTrivia = userRole === 'HOST' || userRole === 'MODERATOR';

  useEffect(() => {
    if (activeTrivia) {
      setSelectedOption(null);
      const totalSec = activeTrivia.durationSeconds || 15;
      const elapsed = Math.floor((Date.now() - activeTrivia.startTime) / 1000);
      setTimeLeft(Math.max(0, totalSec - elapsed));

      const timer = setInterval(() => {
        const remaining = Math.max(0, totalSec - Math.floor((Date.now() - activeTrivia.startTime) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(timer);
          if (canHostTrivia) {
            wsService.endTrivia();
          }
        }
      }, 500);

      return () => clearInterval(timer);
    }
  }, [activeTrivia, canHostTrivia]);

  const handleSelectAnswer = (index: number) => {
    if (!activeTrivia || selectedOption !== null) return;
    setSelectedOption(index);
    wsService.answerTrivia(index);
  };

  const handleStartPreset = (idx: number) => {
    const item = PRESET_QUESTIONS[idx];
    wsService.startTrivia(item.q, item.opts, item.correct, 15);
    setIsCreating(false);
  };

  const handleStartCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQ.trim()) return;
    const validOpts = customOpts.map((o) => o.trim());
    wsService.startTrivia(customQ.trim(), validOpts, customCorrect, 15);
    setIsCreating(false);
    setCustomQ('');
    setCustomOpts(['', '', '', '']);
  };

  return (
    <>
      {/* Active Trivia Card */}
      {activeTrivia && (
        <div
          className="active-trivia-banner glass-card animate-fade-in"
          style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '92%',
            maxWidth: '560px',
            background: 'rgba(17, 24, 39, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '2px solid #8b5cf6',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(139, 92, 246, 0.3)',
            zIndex: 60,
          }}
        >
          {/* Header & Timer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '12px',
                letterSpacing: '0.5px',
              }}
            >
              🧠 LIVE TRIVIA QUIZ
            </span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: timeLeft <= 5 ? '#ef4444' : '#fbbf24',
                animation: timeLeft <= 5 ? 'pulse 0.5s infinite' : 'none',
              }}
            >
              ⏱️ {timeLeft}s left
            </span>
          </div>

          {/* Timer Progress Bar */}
          <div
            style={{
              width: '100%',
              height: '5px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                width: `${(timeLeft / (activeTrivia.durationSeconds || 15)) * 100}%`,
                height: '100%',
                background: timeLeft <= 5 ? '#ef4444' : 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                transition: 'width 0.5s linear',
              }}
            />
          </div>

          <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#fff', lineHeight: 1.4 }}>
            {activeTrivia.question}
          </h4>

          {/* Options Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {activeTrivia.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectAnswer(idx)}
                  disabled={selectedOption !== null}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    background: isSelected ? 'rgba(139, 92, 246, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                    border: isSelected ? '2px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: selectedOption !== null ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: isSelected ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#a0aec0' }}>
            <span>{selectedOption !== null ? '✓ Answer locked in!' : 'Select your answer now!'}</span>
            {canHostTrivia && (
              <button
                type="button"
                onClick={() => wsService.endTrivia()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                End Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Trivia Ended Result & Leaderboard Banner */}
      {lastTriviaResult && (
        <div
          className="trivia-results-card glass-card animate-fade-in"
          style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '92%',
            maxWidth: '520px',
            background: 'rgba(15, 18, 30, 0.96)',
            backdropFilter: 'blur(16px)',
            border: '2px solid #10b981',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(16, 185, 129, 0.3)',
            zIndex: 60,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 800 }}>
              🏆 TRIVIA RESULTS
            </span>
            <button
              type="button"
              onClick={onClearResult}
              style={{
                background: 'none',
                border: 'none',
                color: '#a0aec0',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', color: '#a0aec0' }}>Question:</span>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
              {lastTriviaResult.question}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: '8px',
              padding: '8px 12px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>✅</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>
              Correct Answer: {lastTriviaResult.correctOption}
            </span>
          </div>

          {/* Leaderboard Section */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', marginBottom: '6px' }}>
              🏅 Room Leaderboard:
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Object.entries(lastTriviaResult.leaderboard || {}).map(([uId, score], idx) => (
                <span
                  key={uId}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#fff',
                  }}
                >
                  {idx === 0 ? '👑' : `#${idx + 1}`} {uId === userId ? 'You' : uId.substring(0, 6)}: {score} XP
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Host Trivia Launch Button & Modal */}
      {canHostTrivia && showButton && (
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsCreating(!isCreating)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: isCreating ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.08)',
              border: isCreating ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Host a Live Trivia Quiz"
          >
            <span>🧠</span>
            <span>Trivia Quiz</span>
          </button>

          {isCreating && (
            <div
              className="trivia-creator-dropdown glass-card animate-fade-in"
              style={{
                position: 'absolute',
                bottom: '44px',
                left: 0,
                width: '320px',
                background: 'rgba(22, 25, 40, 0.98)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '14px',
                padding: '14px',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(139, 92, 246, 0.25)',
                zIndex: 100,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🧠</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Start Trivia Quiz</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: '14px' }}
                >
                  ✕
                </button>
              </div>

              {/* Quick Presets */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '6px' }}>
                  Quick Presets (1-Click Start):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {PRESET_QUESTIONS.map((pq, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleStartPreset(idx)}
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#cbd5e0',
                        fontSize: '11px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      ▶ {pq.q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Trivia Form */}
              <form onSubmit={handleStartCustom}>
                <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '4px' }}>
                  Or Create Custom Question:
                </div>
                <input
                  type="text"
                  value={customQ}
                  onChange={(e) => setCustomQ(e.target.value)}
                  placeholder="Question text..."
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    color: '#fff',
                    fontSize: '11px',
                    marginBottom: '8px',
                  }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', marginBottom: '8px' }}>
                  {customOpts.map((opt, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const updated = [...customOpts];
                        updated[idx] = e.target.value;
                        setCustomOpts(updated);
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      style={{
                        background: customCorrect === idx ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: customCorrect === idx ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '4px 6px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <label style={{ fontSize: '10px', color: '#a0aec0' }}>
                    Correct:
                    <select
                      value={customCorrect}
                      onChange={(e) => setCustomCorrect(Number(e.target.value))}
                      style={{
                        marginLeft: '4px',
                        background: '#1a1f30',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                        padding: '2px',
                        fontSize: '11px',
                      }}
                    >
                      <option value={0}>A</option>
                      <option value={1}>B</option>
                      <option value={2}>C</option>
                      <option value={3}>D</option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    className="primary-btn"
                    style={{
                      padding: '4px 12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '6px',
                    }}
                  >
                    Launch 🚀
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
};
