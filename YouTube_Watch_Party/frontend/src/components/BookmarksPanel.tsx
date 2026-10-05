import React, { useState } from 'react';
import type { Bookmark, Role } from '../types/party';
import { wsService } from '../services/websocket';

interface BookmarksPanelProps {
  bookmarks: Bookmark[];
  currentTime: number;
  userRole: Role;
  onSeek?: (time: number) => void;
  onSendMessage?: (text: string) => void;
}

export const BookmarksPanel: React.FC<BookmarksPanelProps> = ({
  bookmarks = [],
  currentTime,
  userRole,
  onSeek,
  onSendMessage,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [copiedHighlights, setCopiedHighlights] = useState(false);

  const canSeek = userRole === 'HOST' || userRole === 'MODERATOR';

  const formatSeconds = (sec: number) => {
    const total = Math.floor(sec);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const generateMarkdown = () => {
    const lines = [
      '# 🎬 Watch Party Session Highlights',
      `*Total Moments: ${bookmarks.length}*\n`,
      ...bookmarks.map(
        (b) => `- **${b.formattedTime || formatSeconds(b.time)}** : ${b.title} *(by ${b.createdBy})*`
      ),
    ];
    return lines.join('\n');
  };

  const handleCopyHighlights = () => {
    navigator.clipboard.writeText(generateMarkdown()).then(() => {
      setCopiedHighlights(true);
      setTimeout(() => setCopiedHighlights(false), 2000);
    });
  };

  const handleDownloadHighlights = () => {
    const blob = new Blob([generateMarkdown()], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watchparty-highlights-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePostToChat = () => {
    if (onSendMessage && bookmarks.length > 0) {
      const summary = `🔖 [Party Highlights]: ` + bookmarks.map(b => `[${b.formattedTime || formatSeconds(b.time)}] ${b.title}`).join(' | ');
      onSendMessage(summary);
    }
  };

  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || `Moment at ${formatSeconds(currentTime)}`;
    wsService.addBookmark(currentTime, finalTitle);
    setTitle('');
    setIsAdding(false);
  };

  const handleJump = (time: number) => {
    if (canSeek) {
      wsService.jumpBookmark(time);
    } else if (onSeek) {
      // Local seek preview
      onSeek(time);
    }
  };

  const handleDelete = (id: string) => {
    wsService.deleteBookmark(id);
  };

  return (
    <div className="bookmarks-panel" style={{ padding: '12px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px' }}>🔖</span>
          <span style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>
            Key Moments ({bookmarks.length})
          </span>
        </div>

        {!isAdding && (
          <button
            type="button"
            className="ctrl-btn"
            onClick={() => setIsAdding(true)}
            style={{
              background: 'rgba(255, 75, 43, 0.15)',
              border: '1px solid rgba(255, 75, 43, 0.3)',
              borderRadius: '6px',
              padding: '4px 10px',
              color: '#ff4b2b',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Bookmark ({formatSeconds(currentTime)})
          </button>
        )}
      </div>

      {isAdding && (
        <form
          onSubmit={handleAddBookmark}
          className="glass-card animate-fade-in"
          style={{
            marginBottom: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            padding: '10px',
          }}
        >
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            <span
              style={{
                background: '#ff4b2b',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '6px',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {formatSeconds(currentTime)}
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Moment description (e.g. Best solo, plot twist)"
              autoFocus
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
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#a0aec0',
                fontSize: '11px',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-btn"
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Save Moment
            </button>
          </div>
        </form>
      )}

      {bookmarks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 8px', color: '#a0aec0' }}>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>📍</div>
          <p style={{ margin: 0, fontSize: '12px' }}>
            No key moments bookmarked yet. Click the button above while watching to save highlights!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
          {bookmarks.map((bm) => (
            <div
              key={bm.id}
              className="bookmark-item glass-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                transition: 'background 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                <button
                  type="button"
                  onClick={() => handleJump(bm.time)}
                  title={canSeek ? 'Jump everyone to this moment' : 'Seek to this moment'}
                  style={{
                    background: 'rgba(255, 75, 43, 0.2)',
                    border: '1px solid rgba(255, 75, 43, 0.4)',
                    color: '#ff4b2b',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ▶ {bm.formattedTime || formatSeconds(bm.time)}
                </button>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {bm.title}
                  </div>
                  <div style={{ fontSize: '10px', color: '#718096' }}>
                    By {bm.createdBy}
                  </div>
                </div>
              </div>

              {(userRole === 'HOST' || userRole === 'MODERATOR') && (
                <button
                  type="button"
                  onClick={() => handleDelete(bm.id)}
                  title="Remove moment"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#a0aec0',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '4px',
                    marginLeft: '6px',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Session Highlights Export & Share Bar */}
      {bookmarks.length > 0 && (
        <div
          style={{
            marginTop: '14px',
            padding: '10px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#a0aec0' }}>
            EXPORT PARTY HIGHLIGHTS:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <button
              type="button"
              onClick={handleCopyHighlights}
              style={{
                padding: '6px 4px',
                background: copiedHighlights ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: copiedHighlights ? '1px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: copiedHighlights ? '#4ade80' : '#e2e8f0',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {copiedHighlights ? 'Copied!' : '📋 Copy MD'}
            </button>

            <button
              type="button"
              onClick={handleDownloadHighlights}
              style={{
                padding: '6px 4px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '6px',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              💾 Save .md
            </button>

            {onSendMessage && (
              <button
                type="button"
                onClick={handlePostToChat}
                style={{
                  padding: '6px 4px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '6px',
                  color: '#c084fc',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                💬 Post Chat
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
