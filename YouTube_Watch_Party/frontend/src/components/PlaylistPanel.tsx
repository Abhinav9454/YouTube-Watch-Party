import React, { useState } from 'react';
import { ListPlus, Play, Trash2, Plus, Sparkles, Layers, Loader2, Check } from 'lucide-react';
import type { QueueItem, Role } from '../types/party';
import { extractYouTubeVideoId } from '../utils/youtube';
import { youtubeSearchService } from '../services/youtubeSearchService';

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

  // Playlist Batch Import State
  const [showPlaylistForm, setShowPlaylistForm] = useState(false);
  const [playlistInput, setPlaylistInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importedItems, setImportedItems] = useState<Array<{ videoId: string; title: string; channel?: string }>>([]);

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

  const handleFetchPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistInput.trim()) return;

    setIsImporting(true);
    setImportStatus(null);
    setImportedItems([]);

    try {
      const res = await youtubeSearchService.fetchPlaylistVideos(playlistInput.trim(), 25);
      if (res.success && res.items.length > 0) {
        setImportedItems(res.items);
        setImportStatus(`Found ${res.items.length} videos in playlist!`);
      } else {
        setImportStatus(res.message || 'No videos found in this playlist.');
      }
    } catch (err: any) {
      setImportStatus(err.message || 'Failed to fetch playlist.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddAllImported = () => {
    if (importedItems.length === 0) return;
    importedItems.forEach((item) => {
      onAddToQueue(item.videoId, item.title);
    });
    setImportedItems([]);
    setPlaylistInput('');
    setImportStatus(`Successfully queued ${importedItems.length} videos!`);
    setTimeout(() => {
      setShowPlaylistForm(false);
      setImportStatus(null);
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      {/* Header and Add button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          <ListPlus size={16} color="#ef4444" />
          <span>Up Next ({playlist.length})</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => {
              setShowPlaylistForm(!showPlaylistForm);
              setShowAddForm(false);
            }}
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.74rem', gap: '4px', color: '#a855f7', borderColor: 'rgba(168, 85, 247, 0.3)' }}
            title="Batch Import YouTube Playlist"
          >
            <Layers size={13} /> Playlist
          </button>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowPlaylistForm(false);
            }}
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.76rem', gap: '4px' }}
          >
            <Plus size={14} /> Add Video
          </button>
        </div>
      </div>

      {/* Playlist Batch Import Form */}
      {showPlaylistForm && (
        <div
          style={{
            background: 'rgba(168, 85, 247, 0.06)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#c084fc' }}>
            <Layers size={14} /> Import YouTube Playlist
          </div>
          <form onSubmit={handleFetchPlaylist} style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Paste Playlist URL or ID (e.g. list=PL...)"
              value={playlistInput}
              onChange={(e) => setPlaylistInput(e.target.value)}
              style={{ fontSize: '0.82rem', padding: '6px 10px', flex: 1 }}
              required
            />
            <button
              type="submit"
              disabled={isImporting}
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.78rem', background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}
            >
              {isImporting ? <Loader2 size={13} className="animate-spin" /> : 'Fetch'}
            </button>
          </form>

          {importStatus && (
            <div style={{ fontSize: '0.75rem', color: importedItems.length > 0 ? '#4ade80' : '#f87171' }}>
              {importStatus}
            </div>
          )}

          {importedItems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Preview (First {importedItems.length} videos):</div>
              {importedItems.slice(0, 5).map((v, i) => (
                <div key={v.videoId + i} style={{ fontSize: '0.74rem', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {i + 1}. {v.title}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddAllImported}
                style={{
                  marginTop: '4px',
                  padding: '6px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Check size={14} /> Add All {importedItems.length} Videos to Queue
              </button>
            </div>
          )}
        </div>
      )}

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
              <span style={{ fontSize: '0.78rem', color: '#fca5a5', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
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
                  <Plus size={13} color="#ef4444" />
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
                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700, minWidth: '18px' }}>
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
