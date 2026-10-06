import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Loader2,
  Play,
  Plus,
  Check,
  X,
  Compass,
} from 'lucide-react';
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
  duration?: string;
}

const PAGE_SIZE = 6;

const DISCOVER_VIDEOS: SuggestedVideo[] = [
  // Music
  {
    id: 'jfKfPfyJRdk',
    title: 'Lofi Hip Hop Radio - Beats to Relax/Study to',
    channel: 'Lofi Girl',
    category: 'Music',
    badge: '🎵 Chill Lofi',
    duration: 'LIVE',
  },
  {
    id: '4xDzrJKXOOY',
    title: 'Synthwave Radio - Chill Synth / Retrowave Beats to Relax',
    channel: 'Lofi Girl',
    category: 'Music',
    badge: '🌆 Synthwave',
    duration: 'LIVE',
  },
  {
    id: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
    channel: 'Rick Astley',
    category: 'Music',
    badge: '🕺 Classic Meme',
    duration: '3:33',
  },
  {
    id: 'kJQP7kiw5Fk',
    title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
    channel: 'Luis Fonsi',
    category: 'Music',
    badge: '🌴 8B+ Views',
    duration: '4:42',
  },
  {
    id: 'JGwWNGJdvx8',
    title: 'Ed Sheeran - Shape of You (Official Music Video)',
    channel: 'Ed Sheeran',
    category: 'Music',
    badge: '🎸 Pop Hit',
    duration: '4:24',
  },
  {
    id: 'fJ9rUzIMcZQ',
    title: 'Queen - Bohemian Rhapsody (Official Video Remastered)',
    channel: 'Queen Official',
    category: 'Music',
    badge: '👑 Legendary Rock',
    duration: '6:00',
  },
  {
    id: 'hT_nvWreIhg',
    title: 'OneRepublic - Counting Stars (Official Music Video)',
    channel: 'OneRepublic',
    category: 'Music',
    badge: '⭐ Billboard Top',
    duration: '4:44',
  },
  {
    id: 'CevxZvSJLk8',
    title: 'Katy Perry - Roar (Official Music Video)',
    channel: 'Katy Perry',
    category: 'Music',
    badge: '🐯 Pop Anthem',
    duration: '4:30',
  },

  // Trailers & Movies
  {
    id: 'aqz-KE-bpKQ',
    title: 'Big Buck Bunny (Blender Open Movie Project 4K)',
    channel: 'Blender Foundation',
    category: 'Trailers',
    badge: '🎬 4K Film',
    duration: '9:56',
  },
  {
    id: 'Way9Dexny3w',
    title: 'Dune: Part Two - Official Movie Trailer',
    channel: 'Warner Bros. Pictures',
    category: 'Trailers',
    badge: '🏜️ Sci-Fi Epic',
    duration: '2:45',
  },
  {
    id: 'zSWdZVtXT7E',
    title: 'Interstellar - Official Teaser & Main Trailer',
    channel: 'Paramount Pictures',
    category: 'Trailers',
    badge: '🚀 Christopher Nolan',
    duration: '2:32',
  },
  {
    id: 'TcMBFSGVi1c',
    title: 'Marvel Studios Avengers: Endgame - Official Trailer',
    channel: 'Marvel Entertainment',
    category: 'Trailers',
    badge: '🛡️ Marvel MCU',
    duration: '2:27',
  },
  {
    id: '8g1vEAtPcg0',
    title: 'Spider-Man: Across the Spider-Verse - Official Trailer',
    channel: 'Sony Pictures Entertainment',
    category: 'Trailers',
    badge: '🕷️ Oscar Animation',
    duration: '2:39',
  },
  {
    id: 'd9MyW72ELq0',
    title: 'Avatar: The Way of Water - Official 4K Teaser Trailer',
    channel: '20th Century Studios',
    category: 'Trailers',
    badge: '🌊 James Cameron',
    duration: '1:38',
  },

  // Science & Space
  {
    id: 'wb49-oV0F78',
    title: 'SpaceX Falcon Heavy Test Flight Launch & Double Booster Landing',
    channel: 'SpaceX',
    category: 'Science',
    badge: '🚀 Epic Aerospace',
    duration: '3:45',
  },
  {
    id: '21X5lGlDOfg',
    title: 'NASA James Webb Space Telescope - Deep Space Cosmic Journey',
    channel: 'NASA',
    category: 'Science',
    badge: '🔭 Astrophysics',
    duration: '4:15',
  },
  {
    id: '78-1M05GAZ4',
    title: 'The Incredible Scale of the Universe in 4K',
    channel: 'Kurzgesagt – In a Nutshell',
    category: 'Science',
    badge: '🌌 Cosmic Animation',
    duration: '10:48',
  },
  {
    id: '0ZfZK_2jI2c',
    title: 'Mars 2020 Perseverance Rover Landing Animation & Descent',
    channel: 'NASA Jet Propulsion Laboratory',
    category: 'Science',
    badge: '🔴 Red Planet',
    duration: '3:24',
  },

  // Gaming
  {
    id: '2lAe1cqCOXo',
    title: 'Cyberpunk 2077 - Official Cinematic Launch Trailer',
    channel: 'Cyberpunk 2077',
    category: 'Gaming',
    badge: '🎮 Cyber Sci-Fi',
    duration: '2:10',
  },
  {
    id: 'QdBZY2fkU-0',
    title: 'Grand Theft Auto VI - Official Trailer 1 in 4K',
    channel: 'Rockstar Games',
    category: 'Gaming',
    badge: '🌴 Next-Gen Open World',
    duration: '1:31',
  },
  {
    id: 'E3Huy2cdih0',
    title: 'Elden Ring - Official Gameplay Reveal Trailer',
    channel: 'Bandai Namco Entertainment',
    category: 'Gaming',
    badge: '⚔️ FromSoftware',
    duration: '3:00',
  },
  {
    id: 'mm4P7W5_Roc',
    title: 'Minecraft 15th Anniversary Official Celebration Video',
    channel: 'Minecraft',
    category: 'Gaming',
    badge: '⛏️ Sandbox Classic',
    duration: '2:15',
  },
  {
    id: 'e_E9W2vsRbA',
    title: 'Valorant - Official Launch Cinematic Trailer "DUELISTS"',
    channel: 'VALORANT',
    category: 'Gaming',
    badge: '🎯 Riot Games',
    duration: '3:47',
  },

  // Nature & 4K Chill
  {
    id: '1La4QzGeaaQ',
    title: '4K Drone Footage - Switzerland Landscapes & Swiss Alps',
    channel: 'Scenic Relaxation',
    category: 'Nature',
    badge: '🏔️ 4K Ultra HD',
    duration: '10:02',
  },
  {
    id: 'glEN6b5t5-c',
    title: 'Norway in 4K - Ultra HD Relaxation & Fjords Film',
    channel: 'Norway Travel',
    category: 'Nature',
    badge: '❄️ Fjords & Auroras',
    duration: '8:45',
  },
  {
    id: 'rS8oWvH-YnQ',
    title: 'Under the Sea 4K - Coral Reef & Marine Wildlife Odyssey',
    channel: 'Blue Planet Relaxation',
    category: 'Nature',
    badge: '🐠 Ocean 4K',
    duration: '12:10',
  },
  {
    id: '7PIji8OubXU',
    title: 'Cosmic Relaxation 4K - Deep Space Stars & Nebulas',
    channel: 'Space Chill',
    category: 'Nature',
    badge: '✨ Starfields',
    duration: '15:00',
  },
  {
    id: 'LXb3EKWsInQ',
    title: 'Costa Rica 4K - Tropical Wildlife in Ultra HD',
    channel: 'Nature Relaxation Films',
    category: 'Nature',
    badge: '🦜 Rainforest 4K',
    duration: '9:30',
  },

  // Trending & Memes
  {
    id: 'jNQXAC9IVRw',
    title: 'Me at the zoo - The First Video on YouTube',
    channel: 'jawed',
    category: 'Trending',
    badge: '📜 Historic 2005',
    duration: '0:19',
  },
  {
    id: 'MnrJzxm44_8',
    title: 'The Apple Vision Pro Review - Tomorrow\'s Tech Today',
    channel: 'Marques Brownlee',
    category: 'Trending',
    badge: '👓 Tech Review',
    duration: '18:24',
  },
  {
    id: 'V-_O7nl0Ii0',
    title: 'Why the Universe Might Be a Simulation',
    channel: 'Veritasium',
    category: 'Trending',
    badge: '🧠 Mind-Bending',
    duration: '14:52',
  },
  {
    id: '4q1484O41p8',
    title: 'How AI Neural Networks Actually Work',
    channel: '3Blue1Brown',
    category: 'Trending',
    badge: '🤖 Deep Tech',
    duration: '19:13',
  },
];

const CATEGORIES = ['All', 'Music', 'Trailers', 'Gaming', 'Science', 'Nature', 'Trending'];

export const DiscoverModal: React.FC<DiscoverModalProps> = ({ isOpen, onClose, userRole }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchInput, setSearchInput] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [addedQueueId, setAddedQueueId] = useState<string | null>(null);

  // Reset page when switching categories or search query
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, searchInput]);

  if (!isOpen) return null;

  const canPlayNow = userRole === 'HOST' || userRole === 'MODERATOR';

  // Check if input is a direct YouTube URL or 11-char Video ID
  const isDirectUrl = (() => {
    const trimmed = searchInput.trim();
    if (!trimmed) return false;
    return (
      trimmed.includes('youtube.com') ||
      trimmed.includes('youtu.be') ||
      trimmed.includes('<iframe') ||
      /^[a-zA-Z0-9_-]{11}$/.test(trimmed)
    );
  })();

  const directVideoId = isDirectUrl ? extractYouTubeVideoId(searchInput.trim()) : null;

  // Filter videos by category and search keyword
  const filteredVideos = useMemo(() => {
    let list = DISCOVER_VIDEOS;
    if (selectedCategory !== 'All') {
      list = list.filter((v) => v.category === selectedCategory);
    }
    if (searchInput.trim() && !isDirectUrl) {
      const q = searchInput.toLowerCase().trim();
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.channel.toLowerCase().includes(q) ||
          v.badge.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedCategory, searchInput, isDirectUrl]);

  // Paginated visible slice
  const visibleVideos = useMemo(() => {
    return filteredVideos.slice(0, page * PAGE_SIZE);
  }, [filteredVideos, page]);

  const hasMore = visibleVideos.length < filteredVideos.length;

  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setPage((prev) => prev + 1);
      setIsLoadingMore(false);
    }, 280);
  };

  // Infinite Scroll Trigger
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + clientHeight) < 70 && hasMore && !isLoadingMore) {
      handleLoadMore();
    }
  };

  const handlePlayNow = (videoId: string) => {
    wsService.changeVideo(videoId);
    onClose();
  };

  const handleAddToQueue = (videoId: string, title: string) => {
    wsService.addToQueue(videoId, title);
    setAddedQueueId(videoId);
    setTimeout(() => setAddedQueueId(null), 1400);
  };

  const handleDirectPlay = () => {
    if (!directVideoId) return;
    wsService.changeVideo(directVideoId);
    setSearchInput('');
    onClose();
  };

  const handleDirectQueue = () => {
    if (!directVideoId) return;
    wsService.addToQueue(directVideoId, 'Direct YouTube Video');
    setSearchInput('');
    onClose();
  };

  return (
    <div
      className="modal-backdrop animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="discover-modal-content glass-card animate-scale-up"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '88vh',
          background: 'rgba(15, 19, 32, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(239, 68, 68, 0.15)',
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
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Compass size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 700 }}>
                Discover & Quick Pick Videos
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                Curated music, trailers, 4K nature, and live streams for your watch party
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '8px',
              width: '30px',
              height: '30px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Search & URL Input Bar */}
        <div style={{ padding: '12px 20px', background: 'rgba(0, 0, 0, 0.3)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: '12px',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <Search size={15} />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, genre, artist, or paste any YouTube URL / embed code..."
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '9px 12px 9px 36px',
                color: '#fff',
                fontSize: '12px',
                outline: 'none',
              }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                style={{
                  position: 'absolute',
                  right: isDirectUrl ? '195px' : '10px',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            )}

            {isDirectUrl && (
              <div style={{ display: 'flex', gap: '6px' }}>
                {canPlayNow && (
                  <button
                    type="button"
                    onClick={handleDirectPlay}
                    className="btn-primary"
                    style={{ padding: '8px 12px', fontSize: '11px', whiteSpace: 'nowrap', gap: '4px' }}
                  >
                    <Play size={12} /> Play URL
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDirectQueue}
                  className="btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '11px', whiteSpace: 'nowrap', gap: '4px' }}
                >
                  <Plus size={12} /> + Queue
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Category Pills Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', flex: 1, paddingBottom: '2px' }}>
            {CATEGORIES.map((cat) => {
              const count = cat === 'All' ? DISCOVER_VIDEOS.length : DISCOVER_VIDEOS.filter((v) => v.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background: isSelected ? '#ef4444' : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid ' + (isSelected ? '#ef4444' : 'rgba(255, 255, 255, 0.08)'),
                    borderRadius: '20px',
                    padding: '4px 10px',
                    color: isSelected ? '#fff' : '#cbd5e1',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>{cat}</span>
                  <span
                    style={{
                      fontSize: '9px',
                      opacity: 0.8,
                      background: isSelected ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                      padding: '1px 5px',
                      borderRadius: '8px',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
            Showing {visibleVideos.length} of {filteredVideos.length}
          </span>
        </div>

        {/* Suggestions Grid with Infinite Scroll */}
        <div
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {filteredVideos.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#94a3b8',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '28px' }}>🔍</span>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>No videos found</div>
              <p style={{ margin: 0, fontSize: '12px', maxWidth: '340px' }}>
                Try searching for &quot;lofi&quot;, &quot;space&quot;, &quot;trailer&quot;, or paste any YouTube video link directly in the top search bar.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchInput('');
                }}
                className="btn-secondary"
                style={{ marginTop: '6px', fontSize: '11px', padding: '6px 12px' }}
              >
                Reset Search
              </button>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '12px',
                }}
              >
                {visibleVideos.map((video) => {
                  const isJustAdded = addedQueueId === video.id;
                  return (
                    <div
                      key={video.id}
                      className="glass-card"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Video Thumbnail */}
                      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#090d16' }}>
                        <img
                          src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                          alt={video.title}
                          loading="lazy"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />

                        {/* Top-Right Category Pill */}
                        <span
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            background: 'rgba(10, 15, 28, 0.82)',
                            backdropFilter: 'blur(4px)',
                            color: '#e2e8f0',
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          {video.badge}
                        </span>

                        {/* Bottom-Right Duration */}
                        {video.duration && (
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '6px',
                              right: '6px',
                              background: video.duration === 'LIVE' ? '#ef4444' : 'rgba(0, 0, 0, 0.85)',
                              color: '#fff',
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              letterSpacing: '0.3px',
                            }}
                          >
                            {video.duration}
                          </span>
                        )}
                      </div>

                      {/* Info & Action Buttons */}
                      <div
                        style={{
                          padding: '10px 12px 12px 12px',
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '10px',
                        }}
                      >
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
                            title={video.title}
                          >
                            {video.title}
                          </h4>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {video.channel}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          {canPlayNow && (
                            <button
                              type="button"
                              onClick={() => handlePlayNow(video.id)}
                              className="btn-primary"
                              style={{
                                flex: 1,
                                padding: '6px 8px',
                                fontSize: '11px',
                                fontWeight: 700,
                                gap: '4px',
                              }}
                            >
                              <Play size={12} />
                              <span>Play Now</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleAddToQueue(video.id, video.title)}
                            className="btn-secondary"
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              gap: '4px',
                              borderColor: isJustAdded ? '#10b981' : undefined,
                              color: isJustAdded ? '#34d399' : undefined,
                            }}
                          >
                            {isJustAdded ? <Check size={12} /> : <Plus size={12} />}
                            <span>{isJustAdded ? 'Added!' : '+ Queue'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Infinite Scroll & Pagination Footer */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px 0 6px 0',
                  gap: '8px',
                }}
              >
                {hasMore ? (
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="btn-secondary"
                    style={{
                      padding: '8px 20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      gap: '6px',
                      borderRadius: '20px',
                    }}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Loading next batch...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} style={{ color: '#f87171' }} />
                        <span>Load More Videos ({filteredVideos.length - visibleVideos.length} remaining)</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✨</span>
                    <span>You&apos;ve viewed all {filteredVideos.length} videos in {selectedCategory}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
