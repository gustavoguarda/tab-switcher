// Generates icons/icon{16,48,128}.png — a row of tab cards with the middle one
// selected (accent), on a dark rounded panel. Pure Node + zlib, no deps.
// Run: /opt/homebrew/bin/node scripts/gen-icon.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

// Layers, back-to-front, in normalized 0..1 coordinates.
const BG = [108, 163, 255]; // not used; kept for reference
const layers = [
  { x0: 0.0, y0: 0.0, x1: 1.0, y1: 1.0, r: 0.225, c: [26, 27, 33] },        // dark panel
  { x0: 0.095, y0: 0.27, x1: 0.355, y1: 0.73, r: 0.065, c: [128, 133, 152] }, // left card
  { x0: 0.645, y0: 0.27, x1: 0.905, y1: 0.73, r: 0.065, c: [128, 133, 152] }, // right card
  { x0: 0.375, y0: 0.15, x1: 0.625, y1: 0.85, r: 0.07, c: [106, 163, 255] },  // middle (selected)
];

function insideRR(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = x < x0 + r ? x0 + r : x > x1 - r ? x1 - r : x;
  const cy = y < y0 + r ? y0 + r : y > y1 - r ? y1 - r : y;
  if (x < x0 + r || x > x1 - r) {
    if (y < y0 + r || y > y1 - r) {
      const dx = x - cx, dy = y - cy;
      return dx * dx + dy * dy <= r * r;
    }
  }
  return true;
}

function render(size) {
  const SS = 4;
  const data = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let Rc = 0, Gc = 0, Bc = 0, cov = 0;
      const n = SS * SS;
      for (let sj = 0; sj < SS; sj++) {
        for (let si = 0; si < SS; si++) {
          const x = (px + (si + 0.5) / SS) / size;
          const y = (py + (sj + 0.5) / SS) / size;
          let col = null;
          for (const L of layers) {
            if (insideRR(x, y, L.x0, L.y0, L.x1, L.y1, L.r)) col = L.c;
          }
          if (col) { Rc += col[0]; Gc += col[1]; Bc += col[2]; cov++; }
        }
      }
      const i = (py * size + px) * 4;
      if (cov > 0) {
        data[i] = Math.round(Rc / cov);
        data[i + 1] = Math.round(Gc / cov);
        data[i + 2] = Math.round(Bc / cov);
        data[i + 3] = Math.round((cov / n) * 255);
      }
    }
  }
  return data;
}

// --- PNG encoding ---
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function toPng(size, data) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    data.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("icons", { recursive: true });
for (const size of [16, 48, 128]) {
  writeFileSync(`icons/icon${size}.png`, toPng(size, render(size)));
  console.log(`wrote icons/icon${size}.png`);
}
// Edge Add-ons store logo (300x300, required for the listing — not shipped).
writeFileSync("icons/store-logo-300.png", toPng(300, render(300)));
console.log("wrote icons/store-logo-300.png");

// Large preview (not shipped) for eyeballing the design.
writeFileSync("icons/preview.png", toPng(512, render(512)));
console.log("wrote icons/preview.png");
