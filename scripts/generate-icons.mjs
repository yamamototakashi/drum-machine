import { deflateSync } from 'node:zlib';
import { writeFileSync, existsSync } from 'node:fs';

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const buf = Buffer.alloc(12 + data.length);
  buf.writeUInt32BE(data.length, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  buf.writeUInt32BE(crc32(buf.subarray(4, 8 + data.length)), 8 + data.length);
  return buf;
}

function createIcon(size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

  const raw = Buffer.alloc((size * 4 + 1) * size);
  const cx = size / 2, cy = size / 2;
  const rOuter = size * 0.38;
  const rInner = size * 0.22;
  const rCore = size * 0.1;

  for (let y = 0; y < size; y++) {
    const off = y * (size * 4 + 1);
    raw[off] = 0;
    for (let x = 0; x < size; x++) {
      const px = off + 1 + x * 4;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let r = 8, g = 8, b = 18, a = 255;

      // Glow halo
      if (dist < rOuter + size * 0.12) {
        const glowT = Math.max(0, 1 - Math.abs(dist - rOuter * 0.95) / (size * 0.15));
        r += Math.floor(0 * glowT);
        g += Math.floor(120 * glowT);
        b += Math.floor(180 * glowT);
      }

      // Ring
      const ringDist = Math.abs(dist - (rOuter + rInner) / 2);
      const ringWidth = (rOuter - rInner) / 2;
      if (ringDist < ringWidth) {
        const t = 1 - ringDist / ringWidth;
        const smooth = t * t * (3 - 2 * t);
        r = Math.min(255, r + Math.floor(0 * smooth));
        g = Math.min(255, g + Math.floor(200 * smooth));
        b = Math.min(255, b + Math.floor(255 * smooth));
      }

      // Core glow
      if (dist < rInner) {
        const t = 1 - dist / rInner;
        r = Math.min(255, r + Math.floor(50 * t));
        g = Math.min(255, g + Math.floor(220 * t));
        b = Math.min(255, b + Math.floor(255 * t));
      }

      // Center dot
      if (dist < rCore) {
        const t = 1 - dist / rCore;
        r = Math.min(255, Math.floor(100 + 155 * t));
        g = Math.min(255, Math.floor(240 + 15 * t));
        b = 255;
      }

      raw[px] = r; raw[px + 1] = g; raw[px + 2] = b; raw[px + 3] = a;
    }
  }

  const compressed = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

if (!existsSync('public/icon-192.png') || process.argv.includes('--force')) {
  writeFileSync('public/icon-192.png', createIcon(192));
  console.log('Generated public/icon-192.png');
}
if (!existsSync('public/icon-512.png') || process.argv.includes('--force')) {
  writeFileSync('public/icon-512.png', createIcon(512));
  console.log('Generated public/icon-512.png');
}
