import React, { useState } from 'react';
import type { Role } from '../types/party';
import { wsService } from '../services/websocket';
import { extractYouTubeVideoId } from '../utils/youtube';

interface DiscoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: Role;
}

interface SuggestedVideo {
  id: string;
  title: string;
  channel: string;
  category: string;
  badge: string;
}

const DISCOVER_VIDEOS: SuggestedVideo[] = [
  {
    id: 'jfKfPfyJRdk',
    title: 'Lofi Hip Hop Radio - Beats to Relax/Study to',
    channel: 'Lofi Girl',
    category: 'Music',
    badge: '🎵 Chill Vibes',
  },
  {
    id: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
    channel: 'Rick Astley',
    category: 'Music',
    badge: '🕺 Classic Meme',
  },
  {
    id: 'aqz-KE-bpKQ',
    title: 'Big Buck Bunny (Blender Open Movie Project 4K)',
    channel: 'Blender Foundation',
    category: 'Animation',
    badge: '🎬 4K Film',
  },
  {
    id: 'wb49-oV0F78',
    title: 'Falcon Heavy Test Flight Launch & Double Booster Landing',
    channel: 'SpaceX',
    category: 'Science',
    badge: '🚀 Epic Space',
  },
  {
    id: '2lAe1cqCOXo',
    title: 'Cyberpunk 2077 - Official Cinematic Launch Trailer',
    channel: 'Cyberpunk 2077',
    category: 'Gaming',
    badge: '🎮 Cyber Sci-Fi',
  },
  {
    id: '1La4QzGeaaQ',
    title: '4K Drone Footage - Switzerland Landscapes & Swiss Alps',
    channel: 'Scenic Relaxation',
    category: 'Nature',
    badge: '🏔️ 4K Ultra HD',
  },
];

export const DiscoverModal: React.FC<DiscoverModalProps> = ({ isOpen, onClose, userRole }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [customInput, setCustomInput] = useState<string>('');

  if (!isOpen) return null;

  const canPlayNow = userRole === 'HOST' || userRole === 'MODERATOR';

  const categories = ['All', 'Music', 'Animation', 'Science', 'Gaming', 'Nature'];

  const filtered = selectedCategory === 'All'
    ? DISCOVER_VIDEOS
    : DISCOVER_VIDEOS.filter((v) => v.category === selectedCategory);

  const handlePlayNow = (videoId: string) => {
    wsService.changeVideo(videoId);
    onClose();
  };

  const handleAddToQueue = (videoId: string, title: string) => {
    wsService.addToQueue(videoId, title);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const parsedId = extractYouTubeVideoId(customInput.trim());
    if (canPlayNow) {
      wsService.changeVideo(parsedId);
    } else {
      wsService.addToQueue(parsedId, 'Custom YouTube Video');
    }
    setCustomInput('');
    onClose();
  };


  return (
    <div
      className="modal-backdrop animate-fade-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="discover-modal-content glass-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          background: 'rgba(18, 20, 32, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 75, 43, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>✨</span>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 700 }}>
              Discover & Quick Pick Videos
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#a0aec0',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Custom URL Input Bar */}
        <div style={{ padding: '14px 20px', background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <form onSubmit={handleCustomSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Paste any YouTube URL, <iframe> embed code, or Video ID..."
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '13px',
              }}
            />
            {canPlayNow && (
              <button
                type="submit"
                className="primary-btn"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                Play Now
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (customInput.trim()) {
                  handleAddToQueue(customInput.trim(), 'Custom Video');
                  setCustomInput('');
                }
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '8px 14px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              + Queue
            </button>
          </form>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '6px', padding: '12px 20px', overflowX: 'auto' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? '#ff4b2b' : 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                borderRadius: '20px',
                padding: '5px 12px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Suggestions Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px 20px 20px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px',
          }}
        >
          {filtered.map((video) => (
            <div
              key={video.id}
              className="video-suggestion-card glass-card"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
            >
              {/* Thumbnail */}
              <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
                <img
                  src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                  alt={video.title}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    // Fallback thumbnail
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: '6px',
                    right: '6px',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {video.badge}
                </span>
              </div>

              {/* Info & Actions */}
              <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4
                    style={{
                      margin: '0 0 4px 0',
                      fontSize: '12px',
                      color: '#fff',
                      fontWeight: 600,
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {video.title}
                  </h4>
                  <span style={{ fontSize: '11px', color: '#a0aec0' }}>{video.channel}</span>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                  {canPlayNow && (
                    <button
                      type="button"
                      onClick={() => handlePlayNow(video.id)}
                      className="primary-btn"
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      ▶ Play Now
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddToQueue(video.id, video.title)}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    + Add to Queue
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
