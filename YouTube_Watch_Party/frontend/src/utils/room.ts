/**
 * Sanitizes and extracts clean Room Code from raw input, URLs, or query strings.
 * Handles:
 * - "ABC123" -> "ABC123"
 * - "https://youtube-watch-party-r2gl.onrender.com/?room=ABC123" -> "ABC123"
 * - "https://youtube-watch-party-r2gl.onrender.com/#ABC123" -> "ABC123"
 * - "?room=ABC123" -> "ABC123"
 * - "#ABC123" -> "ABC123"
 * - " abc123 " -> "ABC123"
 */
export function cleanRoomCode(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // 1. Search in query param: ?room=XYZ or &room=XYZ
  const queryMatch = trimmed.match(/[?&]room=([a-zA-Z0-9_-]+)/i);
  if (queryMatch) return queryMatch[1].toUpperCase();

  // 2. Search in hash: #room=XYZ or #/?room=XYZ
  const hashMatch = trimmed.match(/[#&]room=([a-zA-Z0-9_-]+)/i);
  if (hashMatch) return hashMatch[1].toUpperCase();

  // 3. Search in path: /room/XYZ, /party/XYZ, /watch/XYZ
  const pathMatch = trimmed.match(/(?:\/room\/|\/party\/|\/watch\/|\/)([a-zA-Z0-9_-]{4,12})(?:[?#&]|$)/i);
  if (pathMatch && !trimmed.toLowerCase().endsWith('.com') && !trimmed.toLowerCase().endsWith('.com/')) {
    const candidate = pathMatch[1].toUpperCase();
    if (!['HTTP', 'HTTPS', 'WWW', 'COM', 'PARTY', 'ROOM', 'WATCH', 'API'].includes(candidate)) {
      return candidate;
    }
  }

  // 4. Default: strip leading / or # and return uppercase
  return trimmed.replace(/^[#/]+/, '').trim().toUpperCase();
}

/**
 * Extracts Room Code from current window URL across search params, hash, and path.
 */
export function getRoomFromUrl(): string {
  if (typeof window === 'undefined') return '';

  // 1. Query param: ?room=XYZ
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const roomFromSearch = searchParams.get('room');
    if (roomFromSearch) {
      const clean = cleanRoomCode(roomFromSearch);
      if (clean) return clean;
    }
  } catch {}

  // 2. Hash: #/?room=XYZ or #room=XYZ or #XYZ
  if (window.location.hash) {
    const hash = window.location.hash;
    const match = hash.match(/[?&#]room=([a-zA-Z0-9_-]+)/i);
    if (match) return cleanRoomCode(match[1]);

    const rawHash = hash.replace(/^#\/?/, '');
    if (rawHash && /^[a-zA-Z0-9_-]{4,12}$/.test(rawHash)) {
      return cleanRoomCode(rawHash);
    }
  }

  // 3. Pathname: /room/XYZ
  const pathMatch = window.location.pathname.match(/\/(?:room|party|watch)\/([a-zA-Z0-9_-]{4,12})/i);
  if (pathMatch) {
    return cleanRoomCode(pathMatch[1]);
  }

  return '';
}
