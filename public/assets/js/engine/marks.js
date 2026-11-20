// Segni a mano: evidenziatore a punta tronca, penna o matita, doppia sottolineatura, cerchio.

import { between, wobble } from './random.js';
import { rgba, rgb } from './palette.js';

function darker(hex, amount) {
  const [r, g, b] = rgb(hex).map((v) => Math.round(v * (1 - amount)));
  return `rgb(${r},${g},${b})`;
}

/**
 * Evidenziatore su una riga: bordi leggermente irregolari, estremità tagliate in diagonale,
 * inchiostro più carico alle estremità e strisce lasciate dalla punta.
 */
export function drawHighlight(ctx, x1, top, x2, bottom, color, rand, { dark = false } = {}) {
  const h = bottom - top;
  const w = x2 - x1;
  if (w <= 0 || h <= 0) return;
  const slant = h * 0.26;
  const jitter = h * 0.045;
  const steps = Math.max(3, Math.round(w / (h * 0.85)));
  const tilt = between(rand, -0.006, 0.006) * w;
  const lift = between(rand, -0.05, 0.05) * h;

  const path = new Path2D();
  const topY = (t) => top + lift + tilt * t + wobble(rand) * jitter;
  const bottomY = (t) => bottom + lift + tilt * t + wobble(rand) * jitter;
  const startTop = x1 + slant * 0.35;
  const endTop = x2 + slant * 0.25;
  const endBottom = x2 - slant * 0.25;
  const startBottom = x1 - slant * 0.3;
  path.moveTo(startTop, topY(0));
  for (let s = 1; s <= steps; s += 1) {
    const t = s / steps;
    path.lineTo(startTop + (endTop - startTop) * t, topY(t));
  }
  path.quadraticCurveTo(x2 + slant * 0.32, top + lift + tilt + h * 0.55, endBottom, bottomY(1));
  for (let s = steps - 1; s >= 0; s -= 1) {
    const t = s / steps;
    path.lineTo(startBottom + (endBottom - startBottom) * t, bottomY(t));
  }
  path.quadraticCurveTo(x1 - slant * 0.35, top + lift + h * 0.45, startTop, topY(0));
  path.closePath();

  ctx.save();
  ctx.globalCompositeOperation = dark ? 'source-over' : 'multiply';
  const fill = ctx.createLinearGradient(x1 - slant, 0, x2 + slant, 0);
  const edge = Math.min(0.2, (h * 0.6) / (w + slant * 2));
  fill.addColorStop(0, rgba(color, 0.92));
  fill.addColorStop(edge, rgba(color, 0.8));
  fill.addColorStop(0.5, rgba(color, 0.74));
  fill.addColorStop(1 - edge, rgba(color, 0.8));
  fill.addColorStop(1, rgba(color, 0.92));
  ctx.fillStyle = fill;
  ctx.fill(path);

  // Strisce della punta: alcune più cariche, altre più chiare.
  ctx.clip(path);
  const streaks = Math.max(4, Math.round(h / 5));
  for (let i = 0; i < streaks; i += 1) {
    const y = top + lift + (h * (i + rand())) / streaks;
    const thickness = between(rand, 0.6, 2.2);
    const strong = rand() < 0.55;
    ctx.globalCompositeOperation = strong && !dark ? 'multiply' : 'source-over';
    ctx.strokeStyle = strong ? rgba(darker(color, 0.25), between(rand, 0.05, 0.14)) : `rgba(255,255,255,${between(rand, 0.04, 0.12).toFixed(3)})`;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(x1 - slant, y + tilt * 0.1);
    ctx.lineTo(x2 + slant, y + tilt);
    ctx.stroke();
  }
  ctx.restore();
}

/** Nastro di inchiostro con spessore variabile lungo una serie di punti. */
function ribbon(ctx, points, widthAt, color, { alpha = 1, mode = 'multiply' } = {}) {
  if (points.length < 2) return;
  const left = [];
  const right = [];
  points.forEach((point, i) => {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    const half = widthAt(i / (points.length - 1)) / 2;
    left.push({ x: point.x + nx * half, y: point.y + ny * half });
    right.push({ x: point.x - nx * half, y: point.y - ny * half });
  });
  const path = new Path2D();
  path.moveTo(left[0].x, left[0].y);
  for (let i = 1; i < left.length - 1; i += 1) {
    const mx = (left[i].x + left[i + 1].x) / 2;
    const my = (left[i].y + left[i + 1].y) / 2;
    path.quadraticCurveTo(left[i].x, left[i].y, mx, my);
  }
  path.lineTo(left[left.length - 1].x, left[left.length - 1].y);
  const tip = points[points.length - 1];
  path.quadraticCurveTo(tip.x + (tip.x - points[points.length - 2].x) * 0.3, tip.y, right[right.length - 1].x, right[right.length - 1].y);
  for (let i = right.length - 2; i > 0; i -= 1) {
    const mx = (right[i].x + right[i - 1].x) / 2;
    const my = (right[i].y + right[i - 1].y) / 2;
    path.quadraticCurveTo(right[i].x, right[i].y, mx, my);
  }
  path.lineTo(right[0].x, right[0].y);
  path.closePath();
  ctx.save();
  ctx.globalCompositeOperation = mode;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fill(path);
  ctx.restore();
}

/** Sottolineatura a penna o a matita sotto un tratto di testo. */
export function drawUnderline(ctx, x1, x2, y, size, color, rand, { pencil = false, dark = false, offset = 0 } = {}) {
  const length = x2 - x1;
  if (length <= 0) return;
  const startOver = size * between(rand, -0.02, 0.07);
  const endOver = size * between(rand, 0.02, 0.12);
  const slope = size * between(rand, -0.04, 0.03);
  const phase = rand() * Math.PI * 2;
  const frequency = between(rand, 0.7, 1.6);
  const steps = Math.max(10, Math.round(length / (size * 0.22)));
  const base = y + offset;
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    points.push({
      x: x1 - startOver + (length + startOver + endOver) * t,
      y: base + slope * t + Math.sin(phase + t * Math.PI * frequency) * size * 0.014 + wobble(rand) * size * 0.003,
    });
  }
  const width = size * (pencil ? 0.034 : 0.052);
  const profile = (t) => width * (0.45 + 0.55 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.5));
  const mode = dark ? 'source-over' : 'multiply';
  if (pencil) {
    ribbon(ctx, points, profile, color, { alpha: 0.42, mode });
    ribbon(ctx, points.map((p) => ({ x: p.x + size * 0.004, y: p.y + size * 0.006 })), (t) => profile(t) * 0.7, color, { alpha: 0.32, mode });
  } else {
    ribbon(ctx, points, profile, color, { alpha: 0.94, mode });
  }
}

export function drawDoubleUnderline(ctx, x1, x2, y, size, color, rand, options = {}) {
  drawUnderline(ctx, x1, x2, y, size, color, rand, options);
  drawUnderline(ctx, x1 + size * 0.05, x2 - size * 0.02, y + size * 0.12, size, color, rand, options);
}

/** Cerchio fatto a mano attorno a una parola: non si chiude mai perfettamente. */
export function drawCircle(ctx, cx, cy, rx, ry, size, color, rand, { dark = false, pencil = false } = {}) {
  const start = between(rand, -2.2, -1.6);
  const turn = Math.PI * 2 * between(rand, 1.04, 1.12);
  const tilt = between(rand, -0.09, 0.09);
  const steps = 64;
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = start + turn * t;
    const grow = 1 + (t - 0.5) * 0.08 + wobble(rand) * 0.012;
    const x = Math.cos(angle) * rx * grow;
    const y = Math.sin(angle) * ry * grow;
    points.push({
      x: cx + x * Math.cos(tilt) - y * Math.sin(tilt),
      y: cy + x * Math.sin(tilt) + y * Math.cos(tilt),
    });
  }
  const width = size * (pencil ? 0.03 : 0.045);
  ribbon(ctx, points, (t) => width * (0.4 + 0.6 * Math.sin(Math.PI * t)), color, { alpha: pencil ? 0.5 : 0.92, mode: dark ? 'source-over' : 'multiply' });
}

/** Linea verticale a margine accanto a un passo, come fa chi legge con la matita. */
export function drawMarginLine(ctx, x, y1, y2, size, color, rand, options = {}) {
  const steps = 14;
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    points.push({ x: x + Math.sin(t * Math.PI * between(rand, 0.6, 1.2)) * size * 0.04 + wobble(rand) * size * 0.006, y: y1 + (y2 - y1) * t });
  }
  ribbon(ctx, points, (t) => size * 0.036 * (0.5 + 0.5 * Math.sin(Math.PI * t)), color, { alpha: options.pencil ? 0.45 : 0.85, mode: options.dark ? 'source-over' : 'multiply' });
}

/** Freccia a mano per il carosello ("scorri"). */
export function drawArrow(ctx, x, y, length, size, color, rand, { dark = false } = {}) {
  const points = [];
  const steps = 12;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    points.push({ x: x + length * t, y: y + Math.sin(t * Math.PI) * -size * 0.12 + wobble(rand) * size * 0.01 });
  }
  const mode = dark ? 'source-over' : 'multiply';
  ribbon(ctx, points, (t) => size * 0.05 * (0.5 + 0.5 * t), color, { mode });
  const tip = points[points.length - 1];
  const head = size * 0.32;
  ribbon(ctx, [{ x: tip.x - head, y: tip.y - head * 0.75 }, { x: tip.x - head * 0.4, y: tip.y - head * 0.3 }, tip], () => size * 0.05, color, { mode });
  ribbon(ctx, [{ x: tip.x - head, y: tip.y + head * 0.7 }, { x: tip.x - head * 0.45, y: tip.y + head * 0.3 }, tip], () => size * 0.05, color, { mode });
}
