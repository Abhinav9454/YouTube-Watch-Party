/**
 * Sanitizes and extracts clean Room Code from raw input, URLs, or query strings.
 * Handles:
 * - "ABC1234567" -> "ABC1234567"
 * - "https://youtube-watch-party-r2gl.onrender.com/?room=4KX9M2P7WQ" -> "4KX9M2P7WQ"
 * - "https://youtube-watch-party-r2gl.onrender.com/#4KX9M2P7WQ" -> "4KX9M2P7WQ"
 * - "http://localhost:5173/?room=4KX9M2P7WQ" -> "4KX9M2P7WQ"
 * - "?room=4KX9M2P7WQ" -> "4KX9M2P7WQ"
 * - "#4KX9M2P7WQ" -> "4KX9M2P7WQ"
 * - "4kx9-m2p7-wq" -> "4KX9M2P7WQ"
 * - " 4kx9 m2p7 wq " -> "4KX9M2P7WQ"
 */
export function cleanRoomCode(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // 1. Search in query param: ?room=XYZ or &room=XYZ
  const queryMatch = trimmed.match(/[?&]room=([a-zA-Z0-9_-]+)/i);
  if (queryMatch) {
    return queryMatch[1].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  // 2. Search in hash: #room=XYZ or #/?room=XYZ
  const hashParamMatch = trimmed.match(/[#&]room=([a-zA-Z0-9_-]+)/i);
  if (hashParamMatch) {
    return hashParamMatch[1].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  // 3. Search in path: /room/XYZ, /party/XYZ, /watch/XYZ
  const pathMatch = trimmed.match(/(?:\/room\/|\/party\/|\/watch\/)([a-zA-Z0-9_-]{4,24})(?:[?#&]|$)/i);
  if (pathMatch) {
    return pathMatch[1].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  // 4. Raw hash match: #4KX9M2P7WQ
  const rawHashMatch = trimmed.match(/#\/?([a-zA-Z0-9_-]{4,24})(?:[?&]|$)/i);
  if (rawHashMatch && !rawHashMatch[1].toLowerCase().includes('room=')) {
    return rawHashMatch[1].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  // 5. If it starts with http:// or https://, parse safely via URL object
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsedUrl = new URL(trimmed);
      const roomParam = parsedUrl.searchParams.get('room');
      if (roomParam) {
        return roomParam.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      }
      const segments = parsedUrl.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        const last = segments[segments.length - 1];
        if (
          last &&
          /^[a-zA-Z0-9_-]{4,24}$/.test(last) &&
          !['room', 'party', 'watch', 'api', 'index'].includes(last.toLowerCase())
        ) {
          return last.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        }
      }
    } catch {}
    return '';
  }

  // 6. Direct room code entry (strip spaces, hyphens, and punctuation)
  const stripped = trimmed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return stripped;
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

    const rawHash = hash.replace(/^#\/?/, '').trim();
    if (rawHash && /^[a-zA-Z0-9_-]{4,24}$/.test(rawHash)) {
      return cleanRoomCode(rawHash);
    }
  }

  // 3. Pathname: /room/XYZ
  const pathMatch = window.location.pathname.match(/\/(?:room|party|watch)\/([a-zA-Z0-9_-]{4,24})/i);
  if (pathMatch) {
    return cleanRoomCode(pathMatch[1]);
  }

  return '';
}

/**
 * Extracts optional room Passcode from URL search params or hash.
 * Supports: ?passcode=1234, ?pass=1234, ?pwd=1234, &passcode=1234
 */
export function getPasscodeFromUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const searchParams = new URLSearchParams(window.location.search);
    const pass = searchParams.get('passcode') || searchParams.get('pass') || searchParams.get('pwd');
    if (pass) return pass.trim();
  } catch {}

  if (window.location.hash) {
    const match = window.location.hash.match(/[?&#](?:passcode|pass|pwd)=([a-zA-Z0-9_-]+)/i);
    if (match) return match[1].trim();
  }

  return undefined;
}
