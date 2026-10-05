/**
 * Universal YouTube Video ID Extractor
 * Supports:
 * - Direct 11-char Video ID (e.g., "dQw4w9WgXcQ")
 * - Standard Watch URL (e.g., "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
 * - Short URL (e.g., "https://youtu.be/dQw4w9WgXcQ")
 * - Embed URL (e.g., "https://www.youtube.com/embed/dQw4w9WgXcQ")
 * - NoCookie Embed URL (e.g., "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")
 * - YouTube Shorts (e.g., "https://www.youtube.com/shorts/dQw4w9WgXcQ")
 * - YouTube Live (e.g., "https://www.youtube.com/live/dQw4w9WgXcQ")
 * - Full HTML <iframe> Embed Code (e.g., '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" ...></iframe>')
 */
export function extractYouTubeVideoId(input: string): string {
  if (!input) return 'jfKfPfyJRdk';
  const trimmed = input.trim();

  // If already clean 11-char alphanumeric ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // 1. If it's an iframe embed code, extract the src URL first
  let target = trimmed;
  const iframeSrcMatch = trimmed.match(/<iframe[^>]*\s+src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    target = iframeSrcMatch[1];
  }

  // 2. Extract 11-character video ID from any YouTube URL format (embed, watch, shorts, live, youtu.be, etc.)
  const regex = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/i;
  const match = target.match(regex);
  if (match && match[1]) {
    return match[1];
  }

  // 3. Fallback: if any 11-character sequence exists after "embed/" or "v="
  const secondary = target.match(/(?:embed\/|v=|v\/)([a-zA-Z0-9_-]{11})/i);
  if (secondary && secondary[1]) {
    return secondary[1];
  }

  return trimmed || 'jfKfPfyJRdk';
}

/**
 * Returns the thumbnail URL for any YouTube video input (URL, iframe, or ID).
 */
export function getYouTubeThumbnail(
  input: string,
  quality: 'default' | 'mqdefault' | 'hqdefault' | 'maxresdefault' = 'hqdefault'
): string {
  const videoId = extractYouTubeVideoId(input);
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}
