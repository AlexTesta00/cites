// Carta procedurale: colore con luce, macchie morbide, grana, fibre, puntini, macchie del tempo,
// la pagina dietro che traspare, scrivanie. Tutto in unità di uscita (1080 px di larghezza = 1).

import { between, mulberry32, seeded, wobble } from './random.js';
import { rgba } from './palette.js';

const tiles = new Map();

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

/** Rumore bianco grigio 256×256 (grana). */
function grainTile() {
  if (tiles.has('grain')) return tiles.get('grain');
  const size = 256;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(size, size);
  const rand = mulberry32(1234567);
  for (let i = 0; i < size * size; i += 1) {
    const v = 128 + (rand() + rand() - 1) * 120;
    image.data[i * 4] = v;
    image.data[i * 4 + 1] = v;
    image.data[i * 4 + 2] = v;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  tiles.set('grain', canvas);
  return canvas;
}

/** Rumore morbido ripetibile (macchie della carta). */
function mottleTile() {
  if (tiles.has('mottle')) return tiles.get('mottle');
  const size = 128;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(size, size);
  const octaves = [
    { cells: 4, weight: 0.55 },
    { cells: 8, weight: 0.3 },
    { cells: 16, weight: 0.15 },
  ].map((octave, o) => {
    const rand = mulberry32(99 + o * 17);
    const grid = Array.from({ length: octave.cells * octave.cells }, () => rand());
    return { ...octave, grid };
  });
  const smooth = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let value = 0;
      for (const { cells, weight, grid } of octaves) {
        const fx = (x / size) * cells;
        const fy = (y / size) * cells;
        const x0 = Math.floor(fx) % cells;
        const y0 = Math.floor(fy) % cells;
        const x1 = (x0 + 1) % cells;
        const y1 = (y0 + 1) % cells;
        const tx = smooth(fx - Math.floor(fx));
        const ty = smooth(fy - Math.floor(fy));
        const a = grid[y0 * cells + x0] + (grid[y0 * cells + x1] - grid[y0 * cells + x0]) * tx;
        const b = grid[y1 * cells + x0] + (grid[y1 * cells + x1] - grid[y1 * cells + x0]) * tx;
        value += (a + (b - a) * ty) * weight;
      }
      const v = Math.round(value * 255);
      const i = (y * size + x) * 4;
      image.data[i] = v;
      image.data[i + 1] = v;
      image.data[i + 2] = v;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  tiles.set('mottle', canvas);
  return canvas;
}

/** Scala attuale del contesto (vale anche se è ruotato). */
export function currentScale(ctx) {
  const m = ctx.getTransform();
  return Math.hypot(m.a, m.b) || 1;
}

function pattern(ctx, tile, scale, ox = 0, oy = 0) {
  const fill = ctx.createPattern(tile, 'repeat');
  if (fill.setTransform && typeof DOMMatrix !== 'undefined') {
    fill.setTransform(new DOMMatrix().translateSelf(ox, oy).scaleSelf(scale, scale));
  }
  return fill;
}

/** Grana sovrapposta (anche sopra al testo, per legare l'inchiostro alla carta). */
export function paintGrain(ctx, rect, amount, rand, mode = 'soft-light') {
  if (amount <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = mode;
  ctx.globalAlpha = Math.min(1, amount);
  ctx.fillStyle = pattern(ctx, grainTile(), 1, between(rand, 0, 256), between(rand, 0, 256));
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function paintFibers(ctx, rect, amount, rand, dark) {
  const count = Math.round(((rect.w * rect.h) / 6000) * amount);
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < count; i += 1) {
    const x = rect.x + rand() * rect.w;
    const y = rect.y + rand() * rect.h;
    const length = between(rand, 5, 26);
    const angle = rand() * Math.PI * 2;
    const bend = between(rand, -0.6, 0.6);
    const light = rand() < 0.45;
    ctx.strokeStyle = light
      ? `rgba(255,255,255,${between(rand, dark ? 0.04 : 0.12, dark ? 0.09 : 0.32).toFixed(3)})`
      : `rgba(${dark ? '0,0,0' : '90,70,45'},${between(rand, 0.05, 0.13).toFixed(3)})`;
    ctx.lineWidth = between(rand, 0.5, 1.3);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(angle + bend) * length * 0.5,
      y + Math.sin(angle + bend) * length * 0.5,
      x + Math.cos(angle) * length,
      y + Math.sin(angle) * length,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function paintSpecks(ctx, rect, amount, rand) {
  const count = Math.round(((rect.w * rect.h) / 3500) * amount);
  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const r = between(rand, 0.4, rand() < 0.08 ? 2.6 : 1.4);
    ctx.fillStyle = `rgba(${rand() < 0.5 ? '70,55,35' : '40,35,30'},${between(rand, 0.15, 0.5).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(rect.x + rand() * rect.w, rect.y + rand() * rect.h, r, r * between(rand, 0.5, 1), rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function paintFoxing(ctx, rect, amount, rand) {
  const count = Math.round(between(rand, 9, 18) * amount);
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  for (let i = 0; i < count; i += 1) {
    const cx = rect.x + rand() * rect.w;
    const cy = rect.y + rand() * rect.h;
    const r = between(rand, 4, rand() < 0.2 ? 46 : 18);
    const spot = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const alpha = between(rand, 0.12, 0.34);
    spot.addColorStop(0, `rgba(150,95,40,${alpha})`);
    spot.addColorStop(0.55, `rgba(160,105,50,${alpha * 0.45})`);
    spot.addColorStop(1, 'rgba(160,105,50,0)');
    ctx.fillStyle = spot;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * between(rand, 0.6, 1), rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function paintBurnt(ctx, rect, rand) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  const depth = Math.min(rect.w, rect.h) * 0.16;
  const sides = [
    [rect.x, rect.y, rect.x + depth, rect.y, rect.x, rect.y, depth, rect.h],
    [rect.x + rect.w, rect.y, rect.x + rect.w - depth, rect.y, rect.x + rect.w - depth, rect.y, depth, rect.h],
    [rect.x, rect.y, rect.x, rect.y + depth, rect.x, rect.y, rect.w, depth],
    [rect.x, rect.y + rect.h, rect.x, rect.y + rect.h - depth, rect.x, rect.y + rect.h - depth, rect.w, depth],
  ];
  for (const [x0, y0, x1, y1, fx, fy, fw, fh] of sides) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, 'rgba(95,55,20,0.55)');
    g.addColorStop(0.35, 'rgba(120,75,30,0.22)');
    g.addColorStop(1, 'rgba(120,75,30,0)');
    ctx.fillStyle = g;
    ctx.fillRect(fx, fy, fw, fh);
  }
  ctx.globalAlpha = 0.5;
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = pattern(ctx, mottleTile(), 5, between(rand, 0, 600), between(rand, 0, 600));
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function paintWood(ctx, rect, rand) {
  ctx.save();
  const count = Math.round(rect.h / 7);
  for (let i = 0; i < count; i += 1) {
    const y = rect.y + rand() * rect.h;
    const amplitude = between(rand, 2, 14);
    const frequency = between(rand, 0.002, 0.006);
    const phase = rand() * 10;
    ctx.strokeStyle = rand() < 0.6 ? `rgba(40,24,10,${between(rand, 0.05, 0.16).toFixed(3)})` : `rgba(255,220,170,${between(rand, 0.03, 0.08).toFixed(3)})`;
    ctx.lineWidth = between(rand, 0.8, 4.5);
    ctx.beginPath();
    for (let x = rect.x; x <= rect.x + rect.w; x += 24) {
      const yy = y + Math.sin(x * frequency + phase) * amplitude;
      if (x === rect.x) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function paintLinen(ctx, rect, rand) {
  ctx.save();
  ctx.lineWidth = 1;
  for (let y = rect.y; y < rect.y + rect.h; y += 3) {
    ctx.strokeStyle = `rgba(80,70,55,${between(rand, 0.02, 0.07).toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(rect.x, y);
    ctx.lineTo(rect.x + rect.w, y);
    ctx.stroke();
  }
  for (let x = rect.x; x < rect.x + rect.w; x += 3) {
    ctx.strokeStyle = `rgba(255,255,255,${between(rand, 0.02, 0.06).toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(x, rect.y);
    ctx.lineTo(x, rect.y + rect.h);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Dipinge una superficie (carta o scrivania) nel rettangolo dato.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{x:number,y:number,w:number,h:number}} rect
 * @param {object} surface preset di PAPERS o DESKS
 * @param {() => number} rand
 * @param {Path2D} [clip]
 */
export function paintSurface(ctx, rect, surface, rand, clip) {
  ctx.save();
  if (clip) ctx.clip(clip);
  const cx = rect.x + rect.w * between(rand, 0.4, 0.5);
  const cy = rect.y + rect.h * between(rand, 0.36, 0.46);
  const base = ctx.createRadialGradient(cx, cy, 0, rect.x + rect.w / 2, rect.y + rect.h / 2, Math.hypot(rect.w, rect.h) * 0.62);
  base.addColorStop(0, surface.base);
  base.addColorStop(0.55, surface.base);
  base.addColorStop(1, surface.edge);
  ctx.fillStyle = base;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  if (surface.mottle) {
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = Math.min(1, surface.mottle * 5);
    ctx.fillStyle = pattern(ctx, mottleTile(), 8, between(rand, 0, 900), between(rand, 0, 900));
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }
  if (surface.wood) paintWood(ctx, rect, rand);
  if (surface.linen) paintLinen(ctx, rect, rand);
  paintGrain(ctx, rect, surface.grain * 4.2, rand);
  if (surface.fiber) paintFibers(ctx, rect, surface.fiber, rand, surface.dark);
  if (surface.specks) paintSpecks(ctx, rect, surface.specks, rand);
  if (surface.foxing) paintFoxing(ctx, rect, surface.foxing, rand);
  if (surface.burnt) paintBurnt(ctx, rect, rand);
  ctx.restore();
}

/** Ombra morbida di un foglio appoggiato. */
export function paintShadow(ctx, path, { blur = 40, offsetY = 18, alpha = 0.38 } = {}) {
  ctx.save();
  const scale = currentScale(ctx);
  ctx.shadowColor = `rgba(20,14,8,${alpha})`;
  ctx.shadowBlur = blur * scale;
  ctx.shadowOffsetY = offsetY * scale;
  ctx.fillStyle = 'rgba(0,0,0,1)';
  ctx.fill(path);
  ctx.restore();
}

const GHOST_TEXT = {
  it: 'Quel ramo del lago di Como, che volge a mezzogiorno, tra due catene non interrotte di monti, tutto a seni e a golfi, a seconda dello sporgere e del rientrare di quelli, vien, quasi a un tratto, a ristringersi, e a prender corso e figura di fiume, tra un promontorio a destra, e un’ampia costiera dall’altra parte; e il ponte, che ivi congiunge le due rive, par che renda ancor più sensibile all’occhio questa trasformazione, e segni il punto in cui il lago cessa, e l’Adda rincomincia, per ripigliar poi nome di lago dove le rive, allontanandosi di nuovo, lascian l’acqua distendersi e rallentarsi in nuovi golfi e in nuovi seni.',
  en: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.',
};

const ghostCache = new Map();

function ghostLines(ctx, lang, size, width, height) {
  const key = `${lang}|${size.toFixed(1)}|${Math.round(width)}|${Math.round(height)}`;
  if (ghostCache.has(key)) return ghostCache.get(key);
  const words = (GHOST_TEXT[lang] ?? GHOST_TEXT.it).split(' ');
  const space = ctx.measureText(' ').width;
  const widths = new Map();
  const measure = (word) => {
    if (!widths.has(word)) widths.set(word, ctx.measureText(word).width);
    return widths.get(word);
  };
  const lines = [];
  const lineHeight = size * 1.62;
  let y = size;
  let index = 0;
  let paragraphStart = true;
  while (y < height + lineHeight) {
    const indent = paragraphStart ? size * 1.6 : 0;
    const line = [];
    let used = indent;
    while (true) {
      const word = words[index % words.length];
      const w = measure(word);
      if (line.length && used + space + w > width) break;
      line.push({ word, w });
      used += (line.length > 1 ? space : 0) + w;
      index += 1;
      if (index % words.length === 0) break;
    }
    const endOfParagraph = index % words.length === 0;
    const natural = line.reduce((sum, item) => sum + item.w, 0);
    const gap = !endOfParagraph && line.length > 1 ? (width - indent - natural) / (line.length - 1) : space;
    let x = indent;
    lines.push({
      y,
      words: line.map((item) => {
        const placed = { text: item.word, x };
        x += item.w + gap;
        return placed;
      }),
    });
    paragraphStart = endOfParagraph;
    if (endOfParagraph) y += lineHeight * 0.4;
    y += lineHeight;
  }
  ghostCache.set(key, lines);
  if (ghostCache.size > 40) ghostCache.delete(ghostCache.keys().next().value);
  return lines;
}

/**
 * Il testo della pagina successiva che traspare, specchiato e sfocato.
 * @param {{alpha:number, lang:string, size:number, mirrored?:boolean, blur?:number, ink?:string}} options
 */
export function paintGhost(ctx, rect, { alpha, lang = 'it', size, mirrored = true, blur = 1.6, ink = '#000000' }) {
  if (!alpha) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.font = `400 ${size}px "EB Garamond", Georgia, serif`;
  ctx.fillStyle = ink;
  ctx.textBaseline = 'alphabetic';
  const scale = currentScale(ctx);
  const canFilter = 'filter' in ctx;
  if (canFilter) ctx.filter = `blur(${(blur * scale).toFixed(2)}px)`;
  ctx.globalAlpha = canFilter ? alpha : alpha * 0.6;
  ctx.globalCompositeOperation = 'multiply';
  if (mirrored) {
    ctx.translate(rect.x * 2 + rect.w, 0);
    ctx.scale(-1, 1);
  }
  const lines = ghostLines(ctx, lang, size, rect.w, rect.h);
  for (const line of lines) {
    for (const word of line.words) {
      ctx.fillText(word.text, rect.x + word.x, rect.y + line.y);
      if (!canFilter) ctx.fillText(word.text, rect.x + word.x + size * 0.04, rect.y + line.y + size * 0.03);
    }
  }
  ctx.restore();
}

/** Luce della fotografia: alone chiaro, vignettatura, penombra o lampada. */
export function paintLighting(ctx, W, H, mode, rand) {
  if (!mode || mode === 'none') return;
  ctx.save();
  const diag = Math.hypot(W, H);
  const lx = W * between(rand, 0.22, 0.42);
  const ly = H * between(rand, 0.12, 0.3);
  const glow = (strength) => {
    const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, diag * 0.6);
    g.addColorStop(0, `rgba(255,255,255,${strength})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };
  const vignette = (strength, inner = 0.32) => {
    const g = ctx.createRadialGradient(W * 0.5, H * 0.47, diag * inner * 0.5, W * 0.5, H * 0.5, diag * 0.62);
    g.addColorStop(0, 'rgba(45,32,18,0)');
    g.addColorStop(1, `rgba(45,32,18,${strength})`);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };
  switch (mode) {
    case 'flat':
      vignette(0.12, 0.5);
      break;
    case 'dim':
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(120,100,78,0.32)';
      ctx.fillRect(0, 0, W, H);
      glow(0.35);
      vignette(0.62, 0.22);
      break;
    case 'lamp': {
      const g = ctx.createRadialGradient(W * 0.5, H * 0.45, diag * 0.04, W * 0.5, H * 0.47, diag * 0.5);
      g.addColorStop(0, 'rgba(255,236,200,0)');
      g.addColorStop(0.45, 'rgba(70,52,30,0.25)');
      g.addColorStop(0.75, 'rgba(18,13,8,0.82)');
      g.addColorStop(1, 'rgba(8,6,4,0.95)');
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = 'rgba(255,190,110,0.35)';
      ctx.fillRect(0, 0, W, H);
      break;
    }
    case 'warm':
      glow(0.3);
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = 'rgba(255,200,130,0.18)';
      ctx.fillRect(0, 0, W, H);
      vignette(0.26);
      break;
    default:
      glow(0.28);
      vignette(0.22);
      break;
  }
  ctx.restore();
}

/** Ombra della piega del libro (dorso) su un lato o al centro. */
export function paintGutter(ctx, rect, side, strength = 1) {
  ctx.save();
  const width = rect.w * (side === 'center' ? 0.12 : 0.07);
  const draw = (x0, x1) => {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, `rgba(60,45,28,${0.34 * strength})`);
    g.addColorStop(0.35, `rgba(60,45,28,${0.12 * strength})`);
    g.addColorStop(1, 'rgba(60,45,28,0)');
    ctx.fillStyle = g;
    ctx.fillRect(Math.min(x0, x1), rect.y, Math.abs(x1 - x0), rect.h);
  };
  ctx.globalCompositeOperation = 'multiply';
  if (side === 'left') draw(rect.x, rect.x + width);
  else if (side === 'right') draw(rect.x + rect.w, rect.x + rect.w - width);
  else {
    const mid = rect.x + rect.w / 2;
    draw(mid, mid - width);
    draw(mid, mid + width);
    ctx.fillStyle = `rgba(40,30,18,${0.35 * strength})`;
    ctx.fillRect(mid - 1.2, rect.y, 2.4, rect.h);
  }
  ctx.restore();
}

export { seeded, wobble, rgba };
