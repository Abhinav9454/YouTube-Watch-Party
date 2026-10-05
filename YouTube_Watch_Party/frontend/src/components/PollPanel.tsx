import React, { useState } from 'react';
import type { Poll, Role } from '../types/party';
import { wsService } from '../services/websocket';

interface PollPanelProps {
  poll: Poll | null;
  userRole: Role;
  userId: string;
}

export const PollPanel: React.FC<PollPanelProps> = ({ poll, userRole, userId }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const canManagePoll = userRole === 'HOST' || userRole === 'MODERATOR';

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleLaunchPoll = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || validOptions.length < 2) return;

    wsService.createPoll(question.trim(), validOptions);
    setIsCreating(false);
    setQuestion('');
    setOptions(['', '']);
  };

  const handleVote = (optionIndex: number) => {
    if (!poll || !poll.active) return;
    setSelectedOption(optionIndex);
    wsService.votePoll(poll.id, optionIndex);
  };

  const handleEndPoll = () => {
    if (window.confirm('Are you sure you want to end this poll?')) {
      wsService.endPoll();
    }
  };

  const totalVotes = poll
    ? poll.options.reduce((sum, opt) => sum + (opt.voteCount || 0), 0)
    : 0;

  return (
    <div className="poll-panel" style={{ padding: '12px' }}>
      {poll && poll.active ? (
        <div
          className="active-poll-card glass-card"
          style={{
            background: 'rgba(255, 75, 43, 0.08)',
            border: '1px solid rgba(255, 75, 43, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '10px',
            }}
          >
            <div>
              <span
                style={{
                  background: '#ff4b2b',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  letterSpacing: '0.5px',
                }}
              >
                🔴 Live Poll
              </span>
              <h4 style={{ margin: '8px 0 2px 0', fontSize: '15px', color: '#fff' }}>
                {poll.question}
              </h4>
              <span style={{ fontSize: '11px', color: '#a0aec0' }}>
                Created by {poll.creatorName} • {totalVotes} total votes
              </span>
            </div>

            {canManagePoll && (
              <button
                type="button"
                onClick={handleEndPoll}
                title="End this poll"
                style={{
                  background: 'rgba(255, 77, 79, 0.2)',
                  border: '1px solid rgba(255, 77, 79, 0.4)',
                  color: '#ff4d4f',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                End Poll
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {poll.options.map((opt) => {
              const votePercent = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
              const hasVoted =
                selectedOption === opt.index ||
                (opt.voterUserIds && opt.voterUserIds.includes(userId));

              return (
                <button
                  key={opt.index}
                  type="button"
                  onClick={() => handleVote(opt.index)}
                  style={{
                    position: 'relative',
                    width: '100%',
                    background: hasVoted ? 'rgba(255, 75, 43, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: hasVoted ? '1px solid #ff4b2b' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Progress background bar */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${votePercent}%`,
                      background: hasVoted ? 'rgba(255, 75, 43, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                      transition: 'width 0.4s ease',
                      zIndex: 1,
                    }}
                  />

                  <div
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>
                      {hasVoted && '✓ '}
                      {opt.text}
                    </span>
                    <span style={{ fontSize: '12px', color: '#cbd5e0', fontWeight: 700 }}>
                      {votePercent}% ({opt.voteCount})
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '16px 8px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#fff' }}>No Active Poll</h4>
          <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#a0aec0' }}>
            {canManagePoll
              ? 'Create a live poll to ask room participants for their vote!'
              : 'Waiting for the Host or Moderator to start a poll.'}
          </p>

          {canManagePoll && !isCreating && (
            <button
              type="button"
              className="primary-btn"
              onClick={() => setIsCreating(true)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              + Create Live Poll
            </button>
          )}
        </div>
      )}

      {/* Poll Creation Modal / Inline Form */}
      {isCreating && (
        <form
          onSubmit={handleLaunchPoll}
          className="glass-card animate-fade-in"
          style={{
            marginTop: '12px',
            background: 'rgba(25, 28, 45, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <h4 style={{ margin: 0, fontSize: '14px', color: '#fff' }}>Create New Poll</h4>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
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
            <label style={{ display: 'block', fontSize: '11px', color: '#a0aec0', marginBottom: '4px' }}>
              Question:
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Which video should we watch next?"
              required
              className="text-input"
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                padding: '8px 10px',
                color: '#fff',
                fontSize: '13px',
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#a0aec0', marginBottom: '4px' }}>
              Options (2 to 5):
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {options.map((opt, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    required
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      style={{
                        background: 'rgba(255, 77, 79, 0.2)',
                        border: 'none',
                        color: '#ff4d4f',
                        borderRadius: '6px',
                        padding: '0 8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 5 && (
              <button
                type="button"
                onClick={handleAddOption}
                style={{
                  marginTop: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#ff4b2b',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: '2px 0',
                }}
              >
                + Add Option
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#cbd5e0',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-btn"
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Launch Poll 🚀
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
