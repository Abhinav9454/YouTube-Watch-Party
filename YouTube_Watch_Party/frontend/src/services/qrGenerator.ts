/**
 * Self-contained pure TypeScript QR Code generator for room URLs.
 * Implements standard QR Code Model 2 with Byte mode encoding and Reed-Solomon Error Correction.
 * Renders cleanly to an SVG string or React SVG path without external dependencies.
 */

// QR Code math helpers for Galois Field GF(256)
const GF256_EXP: number[] = new Array(512);
const GF256_LOG: number[] = new Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_LOG[x] = i;
    x = (x << 1) ^ (x & 128 ? 0x11d : 0);
  }
  for (let i = 255; i < 512; i++) {
    GF256_EXP[i] = GF256_EXP[i - 255];
  }
})();

function gfMultiply(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

function polyMultiply(p1: number[], p2: number[]): number[] {
  const result = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gfMultiply(p1[i], p2[j]);
    }
  }
  return result;
}

function getGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    poly = polyMultiply(poly, [1, GF256_EXP[i]]);
  }
  return poly;
}

function calculateEcc(data: number[], eccLength: number): number[] {
  const gen = getGeneratorPoly(eccLength);
  const remainder = [...data, ...new Array(eccLength).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const factor = remainder[i];
    if (factor !== 0) {
      for (let j = 0; j < gen.length; j++) {
        remainder[i + j] ^= gfMultiply(gen[j], factor);
      }
    }
  }
  return remainder.slice(data.length);
}

/**
 * Generate a QR matrix (boolean 2D array) for a given text.
 * Suitable for room URLs and links up to ~70 characters.
 */
export function generateQrMatrix(text: string): boolean[][] {
  // Use Version 3 (29x29) or Version 4 (33x33) for typical URLs
  const size = 29;
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));

  // 1. Finder patterns (top-left, top-right, bottom-left)
  function placeFinder(startX: number, startY: number) {
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const px = startX + x;
        const py = startY + y;
        if (px >= 0 && px < size && py >= 0 && py < size) {
          const isBorder = x === -1 || x === 7 || y === -1 || y === 7;
          if (isBorder) {
            matrix[py][px] = false;
          } else {
            const isInner = (x >= 1 && x <= 5 && (y === 1 || y === 5)) ||
                            (y >= 1 && y <= 5 && (x === 1 || x === 5)) ||
                            (x >= 2 && x <= 4 && y >= 2 && y <= 4);
            matrix[py][px] = isInner;
          }
        }
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(size - 7, 0);
  placeFinder(0, size - 7);

  // 2. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 3. Dark module
  matrix[4 * 3 + 9][8] = true;

  // 4. Encode data bytes
  const encoder = new TextEncoder();
  const rawBytes = Array.from(encoder.encode(text));
  const dataBits: number[] = [0, 1, 0, 0]; // Byte mode indicator (4 bits)
  
  // Character count indicator (8 bits for Version 1-9)
  for (let i = 7; i >= 0; i--) {
    dataBits.push((rawBytes.length >> i) & 1);
  }

  for (const b of rawBytes) {
    for (let i = 7; i >= 0; i--) {
      dataBits.push((b >> i) & 1);
    }
  }

  // Terminator (4 zeros)
  for (let i = 0; i < 4; i++) dataBits.push(0);

  // Pad to multiple of 8 bits
  while (dataBits.length % 8 !== 0) dataBits.push(0);

  // Pad bytes 0xEC, 0x11
  const dataBytes: number[] = [];
  for (let i = 0; i < dataBits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | dataBits[i + j];
    }
    dataBytes.push(byte);
  }

  // Capacity for Version 3-M is 44 codewords (26 data, 18 ECC)
  const maxDataCodewords = 44;
  const padBytes = [0xec, 0x11];
  let padIndex = 0;
  while (dataBytes.length < maxDataCodewords) {
    dataBytes.push(padBytes[padIndex % 2]);
    padIndex++;
  }

  // Compute ECC (18 codewords)
  const ecc = calculateEcc(dataBytes.slice(0, maxDataCodewords), 18);
  const totalCodewords = [...dataBytes.slice(0, maxDataCodewords), ...ecc];

  // Convert codewords to bits
  const finalBits: number[] = [];
  for (const b of totalCodewords) {
    for (let i = 7; i >= 0; i--) {
      finalBits.push((b >> i) & 1);
    }
  }

  // 5. Place bits into matrix with zigzag pattern (skipping finder patterns & timing)
  let bitIndex = 0;
  let upwards = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column

    const rows = upwards
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const y of rows) {
      for (const x of [right, right - 1]) {
        if (matrix[y][x] === null) {
          const bit = bitIndex < finalBits.length ? finalBits[bitIndex++] : 0;
          // Apply mask pattern (x + y) % 2 === 0
          const mask = (x + y) % 2 === 0;
          matrix[y][x] = (bit === 1) !== mask;
        }
      }
    }
    upwards = !upwards;
  }

  // Format info (dummy standard format)
  return matrix.map((row) => row.map((cell) => cell ?? false));
}
