import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { deflateSync } from "node:zlib";

const out = (...parts) => join(new URL("..", import.meta.url).pathname, "public", ...parts);

const C = {
  navy: "#071f5c",
  royal: "#1340c0",
  blue: "#1f54e6",
  azure: "#03a6e8",
  sky: "#4ac4ff",
  gold: "#ffb547",
  green: "#18b27a",
  ink: "#0b1733",
  white: "#ffffff",
};

function hex(hex, alpha = 255) {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, alpha];
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
    Math.round(a[3] + (b[3] - a[3]) * t),
  ];
}

function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

class Canvas {
  constructor(width, height, bg = [0, 0, 0, 0]) {
    this.width = width;
    this.height = height;
    this.px = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i += 1) {
      this.px[i * 4] = bg[0];
      this.px[i * 4 + 1] = bg[1];
      this.px[i * 4 + 2] = bg[2];
      this.px[i * 4 + 3] = bg[3];
    }
  }

  blend(x, y, rgba) {
    x = x | 0;
    y = y | 0;
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = (y * this.width + x) * 4;
    const sa = rgba[3] / 255;
    const da = this.px[i + 3] / 255;
    const oa = sa + da * (1 - sa);
    if (oa <= 0) return;
    this.px[i] = Math.round((rgba[0] * sa + this.px[i] * da * (1 - sa)) / oa);
    this.px[i + 1] = Math.round((rgba[1] * sa + this.px[i + 1] * da * (1 - sa)) / oa);
    this.px[i + 2] = Math.round((rgba[2] * sa + this.px[i + 2] * da * (1 - sa)) / oa);
    this.px[i + 3] = Math.round(oa * 255);
  }

  linearGradient(colors, x0 = 0, y0 = 0, x1 = this.width, y1 = this.height) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const denom = dx * dx + dy * dy;
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const t = clamp(((x - x0) * dx + (y - y0) * dy) / denom);
        const scaled = t * (colors.length - 1);
        const idx = Math.min(colors.length - 2, Math.floor(scaled));
        const local = scaled - idx;
        const col = mix(colors[idx], colors[idx + 1], local);
        const i = (y * this.width + x) * 4;
        this.px[i] = col[0];
        this.px[i + 1] = col[1];
        this.px[i + 2] = col[2];
        this.px[i + 3] = col[3];
      }
    }
  }

  rect(x, y, w, h, col) {
    const x2 = Math.min(this.width, Math.ceil(x + w));
    const y2 = Math.min(this.height, Math.ceil(y + h));
    for (let yy = Math.max(0, Math.floor(y)); yy < y2; yy += 1) {
      for (let xx = Math.max(0, Math.floor(x)); xx < x2; xx += 1) this.blend(xx, yy, col);
    }
  }

  roundRect(x, y, w, h, r, col) {
    const x2 = Math.min(this.width, Math.ceil(x + w + 1));
    const y2 = Math.min(this.height, Math.ceil(y + h + 1));
    const cx = x + w / 2;
    const cy = y + h / 2;
    for (let yy = Math.max(0, Math.floor(y - 1)); yy < y2; yy += 1) {
      for (let xx = Math.max(0, Math.floor(x - 1)); xx < x2; xx += 1) {
        const qx = Math.abs(xx + 0.5 - cx) - (w / 2 - r);
        const qy = Math.abs(yy + 0.5 - cy) - (h / 2 - r);
        const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
        const inside = Math.min(Math.max(qx, qy), 0);
        const d = outside + inside - r;
        const cov = clamp(0.5 - d);
        if (cov > 0) this.blend(xx, yy, [col[0], col[1], col[2], Math.round(col[3] * cov)]);
      }
    }
  }

  circle(cx, cy, r, col) {
    const x1 = Math.floor(cx - r - 2);
    const x2 = Math.ceil(cx + r + 2);
    const y1 = Math.floor(cy - r - 2);
    const y2 = Math.ceil(cy + r + 2);
    for (let y = y1; y <= y2; y += 1) {
      for (let x = x1; x <= x2; x += 1) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) - r;
        const cov = clamp(0.5 - d);
        if (cov > 0) this.blend(x, y, [col[0], col[1], col[2], Math.round(col[3] * cov)]);
      }
    }
  }

  polygon(points, col) {
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const minX = Math.max(0, Math.floor(Math.min(...xs)));
    const maxX = Math.min(this.width - 1, Math.ceil(Math.max(...xs)));
    const minY = Math.max(0, Math.floor(Math.min(...ys)));
    const maxY = Math.min(this.height - 1, Math.ceil(Math.max(...ys)));
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const xi = points[i][0], yi = points[i][1];
          const xj = points[j][0], yj = points[j][1];
          if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) this.blend(x, y, col);
      }
    }
  }

  curve(points, width, col, step = 0.025) {
    for (let t = 0; t <= 1; t += step) {
      const p = bezier(points, t);
      this.circle(p[0], p[1], width / 2, col);
    }
  }
}

function bezier(points, t) {
  let work = points.map((p) => [...p]);
  for (let k = points.length - 1; k > 0; k -= 1) {
    for (let i = 0; i < k; i += 1) {
      work[i][0] = work[i][0] * (1 - t) + work[i + 1][0] * t;
      work[i][1] = work[i][1] * (1 - t) + work[i + 1][1] * t;
    }
  }
  return work[0];
}

function writePng(path, canvas) {
  mkdirSync(dirname(path), { recursive: true });
  const scanline = canvas.width * 4 + 1;
  const raw = Buffer.alloc(scanline * canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    raw[y * scanline] = 0;
    Buffer.from(canvas.px.buffer, y * canvas.width * 4, canvas.width * 4).copy(raw, y * scanline + 1);
  }
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(canvas.width, 0);
  ihdr.writeUInt32BE(canvas.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
  writeFileSync(path, png);
  return png;
}

function writeIco(path, canvas) {
  mkdirSync(dirname(path), { recursive: true });
  const png = pngBuffer(canvas);
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const dir = Buffer.alloc(16);
  dir[0] = canvas.width >= 256 ? 0 : canvas.width;
  dir[1] = canvas.height >= 256 ? 0 : canvas.height;
  dir[2] = 0;
  dir[3] = 0;
  dir.writeUInt16LE(1, 4);
  dir.writeUInt16LE(32, 6);
  dir.writeUInt32LE(png.length, 8);
  dir.writeUInt32LE(22, 12);
  writeFileSync(path, Buffer.concat([header, dir, png]));
}

function pngBuffer(canvas) {
  const scanline = canvas.width * 4 + 1;
  const raw = Buffer.alloc(scanline * canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    raw[y * scanline] = 0;
    Buffer.from(canvas.px.buffer, y * canvas.width * 4, canvas.width * 4).copy(raw, y * scanline + 1);
  }
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(canvas.width, 0);
  ihdr.writeUInt32BE(canvas.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])), 0);
  return Buffer.concat([len, name, data, crc]);
}

function bannerBase() {
  const c = new Canvas(1600, 640, hex(C.white));
  c.linearGradient([hex("#fbfdff"), hex("#eef6ff"), hex("#ffffff")], 0, 0, 1600, 640);
  c.circle(1380, 40, 280, [3, 166, 232, 28]);
  c.circle(1160, 610, 380, [31, 84, 230, 18]);
  c.circle(310, 70, 220, [255, 181, 71, 18]);
  c.curve([[80, 520], [360, 365], [650, 440], [930, 240], [1500, 300]], 28, [3, 166, 232, 38], 0.012);
  c.curve([[160, 535], [465, 410], [780, 465], [1070, 280], [1540, 330]], 8, [255, 181, 71, 60], 0.012);
  return c;
}

function softShadow(c, x, y, w, h, r, a = 28) {
  c.roundRect(x + 12, y + 18, w, h, r, [7, 31, 92, a]);
}

function drawBuilding(c, x, y) {
  softShadow(c, x, y, 230, 250, 24);
  c.roundRect(x, y, 230, 250, 24, hex("#eaf5ff"));
  c.roundRect(x + 26, y + 32, 178, 190, 18, hex("#ffffff"));
  for (let r = 0; r < 4; r += 1) {
    for (let col = 0; col < 3; col += 1) c.roundRect(x + 48 + col * 45, y + 58 + r * 36, 24, 18, 6, hex(C.azure, 170));
  }
  c.roundRect(x + 84, y + 176, 62, 46, 10, hex(C.royal));
}

function drawTruck(c, x, y) {
  softShadow(c, x, y + 10, 260, 116, 18);
  c.roundRect(x, y + 40, 164, 82, 16, hex(C.blue));
  c.roundRect(x + 144, y + 62, 92, 60, 14, hex(C.azure));
  c.roundRect(x + 164, y + 76, 36, 24, 6, hex("#dff7ff"));
  c.circle(x + 55, y + 130, 28, hex(C.navy));
  c.circle(x + 190, y + 130, 28, hex(C.navy));
  c.circle(x + 55, y + 130, 12, hex(C.sky));
  c.circle(x + 190, y + 130, 12, hex(C.sky));
}

function leaseHero() {
  const c = bannerBase();
  c.curve([[290, 390], [520, 250], [805, 458], [1088, 300], [1310, 350]], 54, hex(C.azure, 180), 0.01);
  c.curve([[290, 390], [520, 250], [805, 458], [1088, 300], [1310, 350]], 24, hex("#ffffff", 130), 0.01);
  drawBuilding(c, 355, 188);
  drawTruck(c, 950, 262);
  c.circle(760, 360, 54, hex(C.gold, 235));
  c.circle(760, 360, 26, hex("#fff7dc", 255));
  return c;
}

function taxHero() {
  const c = bannerBase();
  for (let i = 0; i < 2; i += 1) {
    const y = 190 + i * 95;
    softShadow(c, 500 + i * 34, y, 610, 150, 28, 22);
    c.roundRect(500 + i * 34, y, 610, 150, 28, i ? hex("#eaf8ff", 225) : hex("#ffffff", 238));
    c.roundRect(548 + i * 34, y + 38, 330, 18, 8, hex(C.blue, 140));
    c.roundRect(548 + i * 34, y + 78, 470, 14, 7, hex(C.azure, 105));
    c.roundRect(548 + i * 34, y + 110, 390, 14, 7, hex(C.navy, 70));
  }
  c.curve([[440, 326], [640, 264], [920, 385], [1215, 300]], 16, hex(C.gold, 180), 0.012);
  c.circle(1195, 285, 18, hex(C.gold));
  c.circle(1228, 324, 8, hex(C.gold, 180));
  return c;
}

function consolidationHero() {
  const c = bannerBase();
  const blocks = [[470, 275, 190, 150], [710, 210, 215, 190], [995, 278, 190, 145]];
  for (const [x, y, w, h] of blocks) {
    softShadow(c, x, y, w, h, 28, 24);
    c.roundRect(x, y, w, h, 28, hex("#eaf8ff"));
    c.roundRect(x + 24, y + 28, w - 48, 44, 14, hex(C.azure, 150));
    c.roundRect(x + 38, y + 92, w - 76, 20, 9, hex(C.blue, 90));
  }
  c.roundRect(720, 360, 430, 78, 32, hex(C.royal, 218));
  c.curve([[600, 300], [730, 250], [815, 305]], 24, hex(C.azure, 180), 0.012);
  c.curve([[1100, 315], [965, 246], [828, 306]], 24, hex(C.azure, 180), 0.012);
  c.circle(845, 305, 30, hex(C.gold));
  return c;
}

function impairmentHero() {
  const c = bannerBase();
  softShadow(c, 555, 260, 520, 160, 32, 24);
  c.roundRect(555, 260, 520, 160, 32, hex("#eaf8ff"));
  c.roundRect(600, 312, 330, 70, 20, hex(C.blue));
  c.roundRect(600, 312, 190, 70, 20, hex(C.azure));
  c.curve([[562, 236], [760, 155], [935, 205], [1112, 145]], 12, hex(C.gold, 120), 0.012);
  const particles = [
    [960, 300, 18], [1015, 276, 15], [1060, 326, 12], [1098, 288, 10], [1140, 348, 8],
    [1050, 220, 8], [1118, 236, 7], [1180, 270, 6], [1215, 315, 5],
  ];
  for (const [x, y, r] of particles) c.circle(x, y, r, hex(C.sky, 185));
  return c;
}

function revenueHero() {
  const c = bannerBase();
  const startX = 450;
  for (let i = 0; i < 5; i += 1) {
    const x = startX + i * 135;
    const y = 390 - i * 46;
    softShadow(c, x, y, 150, 64, 18, 20);
    c.roundRect(x, y, 150, 64, 18, i % 2 ? hex(C.blue) : hex(C.azure));
  }
  c.curve([[450, 390], [620, 330], [760, 355], [905, 250], [1140, 180]], 34, hex(C.gold, 220), 0.01);
  c.curve([[450, 390], [620, 330], [760, 355], [905, 250], [1140, 180]], 12, hex("#fff6d7", 210), 0.01);
  c.roundRect(1040, 295, 210, 110, 26, hex("#ffffff", 230));
  c.roundRect(1074, 326, 142, 14, 7, hex(C.blue, 120));
  c.roundRect(1074, 358, 108, 12, 6, hex(C.azure, 100));
  c.circle(1230, 296, 24, hex(C.gold));
  return c;
}

function mapHero() {
  const c = new Canvas(720, 560);
  c.circle(600, 85, 120, [255, 255, 255, 28]);
  c.curve([[65, 455], [165, 345], [275, 415], [382, 270], [548, 170], [640, 86]], 58, hex(C.sky, 205), 0.01);
  c.curve([[65, 455], [165, 345], [275, 415], [382, 270], [548, 170], [640, 86]], 24, hex("#ffffff", 120), 0.01);
  const nodes = [[95, 428], [235, 372], [382, 272], [522, 190], [628, 96]];
  for (const [x, y] of nodes) {
    c.circle(x, y, 29, hex("#ffffff", 225));
    c.circle(x, y, 15, hex(C.azure));
  }
  star(c, 635, 85, 42, hex(C.gold));
  return c;
}

function authAside() {
  const c = new Canvas(900, 1000);
  c.linearGradient([hex(C.navy), hex(C.royal), hex(C.azure)], 0, 0, 900, 1000);
  c.circle(760, 120, 260, [255, 255, 255, 28]);
  c.circle(150, 850, 310, [74, 196, 255, 30]);
  for (let x = 170; x <= 650; x += 48) c.rect(x, 450, 2, 250, [255, 255, 255, 38]);
  for (let y = 450; y <= 700; y += 42) c.rect(170, y, 480, 2, [255, 255, 255, 38]);
  c.curve([[180, 700], [320, 650], [430, 600], [540, 515], [675, 360]], 26, hex(C.gold, 210), 0.01);
  c.curve([[180, 700], [320, 650], [430, 600], [540, 515], [675, 360]], 10, hex("#fff6d7", 210), 0.01);
  const cards = [[520, 210, 230, 118], [610, 655, 190, 100], [215, 260, 240, 116]];
  for (const [x, y, w, h] of cards) {
    c.roundRect(x + 10, y + 16, w, h, 22, [0, 0, 0, 28]);
    c.roundRect(x, y, w, h, 22, [255, 255, 255, 52]);
    c.roundRect(x + 28, y + 32, w - 74, 12, 6, [255, 255, 255, 120]);
    c.roundRect(x + 28, y + 64, w - 118, 10, 5, [74, 196, 255, 120]);
  }
  star(c, 692, 344, 42, hex(C.gold));
  return c;
}

function courseCover() {
  const c = new Canvas(640, 360);
  c.linearGradient([hex(C.navy), hex(C.royal), hex(C.azure)], 0, 0, 640, 360);
  c.circle(548, 10, 150, [255, 255, 255, 34]);
  c.circle(95, 342, 150, [74, 196, 255, 26]);
  c.roundRect(88, 94, 146, 130, 24, [255, 255, 255, 238]);
  c.roundRect(116, 124, 88, 18, 8, hex(C.azure, 180));
  c.roundRect(116, 162, 72, 14, 7, hex(C.blue, 130));
  c.roundRect(366, 96, 160, 48, 16, hex(C.azure));
  c.roundRect(402, 156, 160, 48, 16, hex(C.blue));
  c.roundRect(438, 216, 160, 48, 16, hex(C.azure));
  c.curve([[206, 175], [290, 100], [390, 250], [520, 156]], 22, hex(C.gold, 220), 0.012);
  star(c, 532, 146, 32, hex(C.gold));
  return c;
}

function levelMedal() {
  const c = new Canvas(264, 264);
  c.circle(132, 132, 114, hex(C.gold, 235));
  c.circle(132, 132, 96, hex("#fff2c7", 245));
  c.circle(132, 132, 70, hex(C.royal, 235));
  c.circle(132, 132, 53, hex("#ffffff", 235));
  star(c, 132, 132, 44, hex(C.gold));
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    c.circle(132 + Math.cos(a) * 112, 132 + Math.sin(a) * 112, i % 3 === 0 ? 5 : 3, hex(C.sky, 175));
  }
  return c;
}

function favicon() {
  const c = new Canvas(256, 256);
  c.linearGradient([hex(C.navy), hex(C.royal), hex(C.azure)], 0, 0, 256, 256);
  c.roundRect(0, 0, 256, 256, 52, hex(C.navy, 30));
  wing(c, 48, 86, 160, 84, hex(C.white));
  return c;
}

function faviconSmall() {
  const c = new Canvas(32, 32);
  c.linearGradient([hex(C.navy), hex(C.royal), hex(C.azure)], 0, 0, 32, 32);
  c.roundRect(0, 0, 32, 32, 7, hex(C.navy, 30));
  wing(c, 6, 11, 20, 10, hex(C.white));
  return c;
}

function ogCover() {
  const c = new Canvas(1200, 630);
  c.linearGradient([hex(C.navy), hex(C.royal), hex(C.azure)], 0, 0, 1200, 630);
  c.circle(1050, 60, 220, [255, 255, 255, 32]);
  c.circle(130, 585, 260, [74, 196, 255, 28]);
  c.curve([[720, 470], [820, 350], [900, 410], [992, 270], [1105, 150]], 46, hex(C.sky, 210), 0.01);
  c.curve([[720, 470], [820, 350], [900, 410], [992, 270], [1105, 150]], 18, hex("#ffffff", 110), 0.01);
  for (const [x, y] of [[735, 455], [885, 382], [992, 270], [1090, 160]]) {
    c.circle(x, y, 23, hex("#ffffff", 220));
    c.circle(x, y, 11, hex(C.azure));
  }
  star(c, 1104, 145, 42, hex(C.gold));
  return c;
}

function star(c, cx, cy, r, col) {
  const pts = [];
  for (let i = 0; i < 10; i += 1) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  c.polygon(pts, col);
}

function wing(c, x, y, w, h, col) {
  c.polygon([[x, y + h * 0.72], [x + w * 0.9, y], [x + w, y + h * 0.18], [x + w * 0.18, y + h]], col);
  c.polygon([[x + w * 0.32, y + h], [x + w, y + h * 0.34], [x + w, y + h * 0.56], [x + w * 0.5, y + h]], col);
}

const assets = [
  ["lesson-images/ifrs-16-lease-hero.png", leaseHero],
  ["lesson-images/ias-12-tax-hero.png", taxHero],
  ["lesson-images/ifrs-10-consolidation-hero.png", consolidationHero],
  ["lesson-images/ias-36-impairment-hero.png", impairmentHero],
  ["lesson-images/ifrs-15-revenue-hero.png", revenueHero],
  ["brand/map-hero.png", mapHero],
  ["brand/auth-aside.png", authAside],
  ["brand/level-medal.png", levelMedal],
  ["brand/favicon.png", favicon],
  ["brand/og-cover.png", ogCover],
  ["courses/personal-finance-basics.png", courseCover],
];

for (const [path, make] of assets) {
  const file = out(path);
  writePng(file, make());
  console.log(file);
}

const ico = out("favicon.ico");
writeIco(ico, faviconSmall());
console.log(ico);
