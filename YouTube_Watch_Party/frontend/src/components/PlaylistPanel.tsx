import React, { useState } from 'react';
import { ListPlus, Play, Trash2, Plus, Sparkles } from 'lucide-react';
import type { QueueItem, Role } from '../types/party';
import { extractYouTubeVideoId } from '../utils/youtube';

interface PlaylistPanelProps {
  playlist: QueueItem[];
  userRole: Role;
  onAddToQueue: (videoId: string, title?: string) => void;
  onRemoveFromQueue: (queueItemId: string) => void;
  onPlayQueueItem: (queueItemId: string) => void;
}

const POPULAR_SUGGESTIONS = [
  { title: 'Lofi Girl - Study Chill Beats', id: 'jfKfPfyJRdk' },
  { title: 'Synthwave Chill - 80s Retro', id: '4xDzrJKXOOY' },
  { title: 'Big Buck Bunny 4K Animation', id: 'aqz-KE-bpKQ' },
  { title: 'Nature 4K Relaxing Wildlife', id: 'LXb3EKWsInQ' },
];

export const PlaylistPanel: React.FC<PlaylistPanelProps> = ({
  playlist,
  userRole,
  onAddToQueue,
  onRemoveFromQueue,
  onPlayQueueItem,
}) => {
  const [videoInput, setVideoInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const canControl = userRole === 'HOST' || userRole === 'MODERATOR';

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (videoInput.trim()) {
      const parsedId = extractYouTubeVideoId(videoInput.trim());
      onAddToQueue(parsedId, titleInput.trim() || undefined);
      setVideoInput('');
      setTitleInput('');
      setShowAddForm(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      {/* Header and Add button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          <ListPlus size={16} color="#818cf8" />
          <span>Up Next ({playlist.length})</span>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-secondary"
          style={{ padding: '4px 10px', fontSize: '0.76rem', gap: '4px' }}
        >
          <Plus size={14} /> Add Video
        </button>
      </div>

      {/* Add to Queue Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <input
            type="text"
            className="input-field"
            placeholder="YouTube URL, <iframe> embed, or Video ID..."
            value={videoInput}
            onChange={(e) => setVideoInput(e.target.value)}
            style={{ fontSize: '0.85rem', padding: '8px 10px' }}
            required
          />

          <input
            type="text"
            className="input-field"
            placeholder="Custom title (optional)..."
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            style={{ fontSize: '0.85rem', padding: '8px 10px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '4px 12px', fontSize: '0.78rem' }}>
              Add to Queue
            </button>
          </div>
        </form>
      )}

      {/* Queue List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
        {playlist.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', margin: 'auto', padding: '20px 0' }}>
            <p style={{ marginBottom: '12px' }}>Queue is empty. Videos in queue will auto-play next!</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: '#a5b4fc', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Sparkles size={13} /> Quick Suggestions:
              </span>
              {POPULAR_SUGGESTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onAddToQueue(s.id, s.title)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 10px',
                    textAlign: 'left',
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                  <Plus size={13} color="#818cf8" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          playlist.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 700, minWidth: '18px' }}>
                  #{index + 1}
                </span>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    Added by: {item.addedBy}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {canControl && (
                  <button
                    onClick={() => onPlayQueueItem(item.id)}
                    className="btn-primary"
                    style={{ padding: '4px 8px', fontSize: '0.72rem', gap: '4px' }}
                    title="Play this video now"
                  >
                    <Play size={12} /> Play
                  </button>
                )}
                <button
                  onClick={() => onRemoveFromQueue(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Remove from queue"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
