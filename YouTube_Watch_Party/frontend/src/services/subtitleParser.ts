export interface SubtitleCue {
  id: number;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

export function parseSubtitles(content: string, offsetSeconds: number = 0): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  // Normalize line breaks
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\s*\n/);

  let idCounter = 1;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;
    if (block.startsWith('WEBVTT') || block.startsWith('NOTE') || block.startsWith('STYLE')) {
      continue;
    }

    const lines = block.split('\n');
    let timeIndex = -1;

    for (let l = 0; l < lines.length; l++) {
      if (lines[l].includes('-->')) {
        timeIndex = l;
        break;
      }
    }

    if (timeIndex === -1) continue;

    const timeLine = lines[timeIndex];
    const match = timeLine.match(/(\d{1,2}:)?(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{1,2}:)?(\d{2}):(\d{2})[,.](\d{3})/);
    if (!match) continue;

    const rawStart = parseTimestamp(match[1], match[2], match[3], match[4]);
    const rawEnd = parseTimestamp(match[5], match[6], match[7], match[8]);

    const start = Math.max(0, rawStart + offsetSeconds);
    const end = Math.max(start + 0.1, rawEnd + offsetSeconds);

    const textLines = lines.slice(timeIndex + 1);
    const text = textLines.join('\n').replace(/<[^>]+>/g, '').trim();

    if (text) {
      cues.push({
        id: idCounter++,
        start,
        end,
        text,
      });
    }
  }

  return cues.sort((a, b) => a.start - b.start);
}

// Backwards-compatible parseSrt alias
export function parseSrt(content: string, offsetSeconds: number = 0): SubtitleCue[] {
  return parseSubtitles(content, offsetSeconds);
}

function parseTimestamp(hours: string | undefined, minutes: string, seconds: string, millis: string): number {
  const h = hours ? parseInt(hours.replace(':', ''), 10) : 0;
  const m = parseInt(minutes, 10);
  const s = parseInt(seconds, 10);
  const ms = parseInt(millis, 10);

  return h * 3600 + m * 60 + s + ms / 1000;
}

export function getActiveCue(cues: SubtitleCue[], currentTime: number): SubtitleCue | null {
  for (let i = 0; i < cues.length; i++) {
    if (currentTime >= cues[i].start && currentTime <= cues[i].end) {
      return cues[i];
    }
  }
  return null;
}

// Demo subtitles for instant testing
export const DEMO_SUBTITLES = `1
00:00:01,000 --> 00:00:05,000
Welcome to the Synchronized YouTube Watch Party! 🍿

2
00:00:05,500 --> 00:00:10,000
Enjoy real-time high-fidelity video sync with friends across the world.

3
00:00:10,500 --> 00:00:16,000
Use the Audio Equalizer to boost bass or cinema 3D surround sound 🎧

4
00:00:16,500 --> 00:00:22,000
Activate A-B Loop to repeat your favorite segments effortlessly 🔁

5
00:00:22,500 --> 00:00:28,000
Send virtual snacks, challenge each other to trivia quizzes, and enjoy the party! 🎉
`;
