/**
 * YouTube Search & Discovery Service
 * Connects with YouTube Data API v3 and Google's live autocomplete suggestions.
 */
import { extractYouTubeVideoId } from '../utils/youtube';

export interface YouTubeSearchResult {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  description?: string;
  publishedAt?: string;
  category?: string;
}

const STORAGE_KEY = 'watchparty_youtube_api_key';

class YouTubeSearchService {
  /**
   * Retrieve stored API key from localStorage or Vite environment variable
   */
  getStoredApiKey(): string {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored.trim()) return stored.trim();
    }
    const envKey = (import.meta as any).env?.VITE_YOUTUBE_API_KEY;
    return envKey ? String(envKey).trim() : '';
  }

  /**
   * Save custom API key in localStorage
   */
  saveApiKey(key: string): void {
    if (typeof window !== 'undefined') {
      if (key && key.trim()) {
        localStorage.setItem(STORAGE_KEY, key.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  /**
   * Remove stored API key
   */
  clearApiKey(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Fetch live YouTube search autocomplete suggestions (Zero API key required)
   */
  async getLiveSuggestions(query: string): Promise<string[]> {
    if (!query || query.trim().length < 2) return [];

    try {
      const res = await fetch(`/api/youtube/suggest?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch {
      // Fallback direct to Google if proxy is unreachable
      try {
        const res = await fetch(
          `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && Array.isArray(data[1])) {
            return data[1];
          }
        }
      } catch {}
    }

    return [];
  }

  /**
   * Search YouTube videos via backend proxy or direct Google API
   */
  async search(query: string, customKey?: string): Promise<{
    success: boolean;
    hasApiKey: boolean;
    results: YouTubeSearchResult[];
    message?: string;
  }> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { success: true, hasApiKey: true, results: [] };
    }

    // Check if query is a direct URL or video ID
    const extractedId = extractYouTubeVideoId(trimmed);
    if (extractedId && extractedId !== 'jfKfPfyJRdk' && extractedId.length === 11) {
      return {
        success: true,
        hasApiKey: true,
        results: [
          {
            id: extractedId,
            title: `YouTube Video (${extractedId})`,
            channel: 'YouTube',
            thumbnail: `https://i.ytimg.com/vi/${extractedId}/mqdefault.jpg`,
            category: 'Direct Link',
          },
        ],
      };
    }

    const apiKey = customKey?.trim() || this.getStoredApiKey();

    try {
      const url = `/api/youtube/search?q=${encodeURIComponent(trimmed)}${apiKey ? `&key=${encodeURIComponent(apiKey)}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return {
          success: Boolean(data.success),
          hasApiKey: Boolean(data.hasApiKey),
          results: Array.isArray(data.results) ? data.results : [],
          message: data.message || data.error,
        };
      }
    } catch (err: any) {
      console.warn('Backend YouTube search endpoint unreachable, trying client fallback...', err);
    }

    // Direct Google API fallback if client has API key and backend proxy had network issue
    if (apiKey) {
      try {
        const googleUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&type=video&q=${encodeURIComponent(trimmed)}&key=${encodeURIComponent(apiKey)}`;
        const res = await fetch(googleUrl);
        if (res.ok) {
          const data = await res.json();
          const items: YouTubeSearchResult[] = (data.items || []).map((item: any) => ({
            id: item.id?.videoId || '',
            title: item.snippet?.title || 'Untitled',
            channel: item.snippet?.channelTitle || 'Unknown Channel',
            thumbnail: item.snippet?.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${item.id?.videoId}/mqdefault.jpg`,
            description: item.snippet?.description || '',
            publishedAt: item.snippet?.publishedAt || '',
            category: 'YouTube',
          }));

          return {
            success: true,
            hasApiKey: true,
            results: items.filter((i) => Boolean(i.id)),
          };
        } else {
          const errData = await res.json();
          return {
            success: false,
            hasApiKey: true,
            results: [],
            message: errData.error?.message || 'YouTube API error',
          };
        }
      } catch (err: any) {
        return {
          success: false,
          hasApiKey: true,
          results: [],
          message: err.message,
        };
      }
    }

    return {
      success: false,
      hasApiKey: false,
      results: [],
      message: 'No YouTube API Key provided.',
    };
  }

  /**
   * Fetch all videos in a YouTube Playlist by Playlist ID or full YouTube URL
   */
  async fetchPlaylistVideos(playlistIdOrUrl: string, maxResults: number = 25): Promise<{
    success: boolean;
    hasApiKey: boolean;
    items: Array<{ videoId: string; title: string; channel?: string; thumbnail?: string }>;
    message?: string;
  }> {
    let cleanId = playlistIdOrUrl.trim();
    if (cleanId.includes('list=')) {
      const idx = cleanId.indexOf('list=');
      cleanId = cleanId.substring(idx + 5);
      const amp = cleanId.indexOf('&');
      if (amp !== -1) cleanId = cleanId.substring(0, amp);
    }

    const apiKey = this.getStoredApiKey();

    // 1. Try backend endpoint /api/youtube/playlist
    try {
      const url = `/api/youtube/playlist?playlistId=${encodeURIComponent(cleanId)}&maxResults=${maxResults}${apiKey ? `&key=${encodeURIComponent(apiKey)}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          return {
            success: true,
            hasApiKey: data.hasApiKey ?? Boolean(apiKey),
            items: data.items,
          };
        }
      }
    } catch {
      // Backend request failed, fallback to direct client call if key available
    }

    // 2. Direct client call if apiKey is set
    if (apiKey) {
      try {
        const directUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${maxResults}&playlistId=${encodeURIComponent(cleanId)}&key=${encodeURIComponent(apiKey)}`;
        const res = await fetch(directUrl);
        if (res.ok) {
          const data = await res.json();
          const items = (data.items || []).map((i: any) => ({
            videoId: i.snippet?.resourceId?.videoId || '',
            title: i.snippet?.title || 'Untitled',
            channel: i.snippet?.channelTitle || '',
            thumbnail: i.snippet?.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${i.snippet?.resourceId?.videoId}/mqdefault.jpg`,
          })).filter((i: any) => Boolean(i.videoId));

          return {
            success: true,
            hasApiKey: true,
            items,
          };
        }
      } catch (err: any) {
        return {
          success: false,
          hasApiKey: true,
          items: [],
          message: err.message,
        };
      }
    }

    return {
      success: false,
      hasApiKey: false,
      items: [],
      message: 'YouTube API key required to auto-fetch playlist items. Please add your key in Discover settings.',
    };
  }
}

export const youtubeSearchService = new YouTubeSearchService();
