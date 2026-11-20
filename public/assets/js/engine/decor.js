// Dettagli fisici: righe e quadretti, orecchia, nastro adesivo, graffetta, caffè, timbro,
// pieghe, bordi strappati o sfrangiati, cartolina, scheda di biblioteca, segnalibro.

import { between, wobble } from './random.js';
import { rgba } from './palette.js';

/* ---------- Forme dei fogli ---------- */

export function rectPath(rect) {
  const path = new Path2D();
  path.rect(rect.x, rect.y, rect.w, rect.h);
  return path;
}

export function roundedPath(rect, radius) {
  const path = new Path2D();
  if (path.roundRect) path.roundRect(rect.x, rect.y, rect.w, rect.h, radius);
  else path.rect(rect.x, rect.y, rect.w, rect.h);
  return path;
}

/** Bordi strappati sui lati indicati ('top', 'right', 'bottom', 'left'). */
export function tornPath(rect, sides, rand, depth = 14) {
  const path = new Path2D();
  const { x, y, w, h } = rect;
  const edge = (x0, y0, x1, y1, torn, nx, ny) => {
    const length = Math.hypot(x1 - x0, y1 - y0);
    const steps = torn ? Math.max(6, Math.round(length / 9)) : 1;
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      const amount = torn && i < steps ? (rand() * 0.7 + Math.sin(t * 23 + rand()) * 0.3) * depth : 0;
      path.lineTo(x0 + (x1 - x0) * t + nx * amount, y0 + (y1 - y0) * t + ny * amount);
    }
  };
  path.moveTo(x, y);
  edge(x, y, x + w, y, sides.includes('top'), 0, 1);
  edge(x + w, y, x + w, y + h, sides.includes('right'), -1, 0);
  edge(x + w, y + h, x, y + h, sides.includes('bottom'), 0, -1);
  edge(x, y + h, x, y, sides.includes('left'), 1, 0);
  path.closePath();
  return path;
}

/** Bordo sfrangiato della carta fatta a mano (solo lato destro). */
export function decklePath(rect, rand) {
  return tornPath(rect, ['right'], rand, 6);
}

/* ---------- Righe ---------- */

export function drawLines(ctx, rect, { spacing, phase, color, width = 1.6, from = rect.y, to = rect.y + rect.h }) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  let y = phase;
  while (y > from) y -= spacing;
  for (; y <= to; y += spacing) {
    if (y < from + spacing * 0.4) continue;
    ctx.beginPath();
    ctx.moveTo(rect.x, y);
    ctx.lineTo(rect.x + rect.w, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawGrid(ctx, rect, spacing, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let x = rect.x + (rect.w % spacing) / 2; x <= rect.x + rect.w; x += spacing) {
    ctx.moveTo(x, rect.y);
    ctx.lineTo(x, rect.y + rect.h);
  }
  for (let y = rect.y + (rect.h % spacing) / 2; y <= rect.y + rect.h; y += spacing) {
    ctx.moveTo(rect.x, y);
    ctx.lineTo(rect.x + rect.w, y);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawDots(ctx, rect, spacing, color) {
  ctx.save();
  ctx.fillStyle = color;
  for (let x = rect.x + spacing / 2; x < rect.x + rect.w; x += spacing) {
    for (let y = rect.y + spacing / 2; y < rect.y + rect.h; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawMarginRule(ctx, x, rect, color = 'rgba(214,64,64,0.62)', double = false) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x, rect.y);
  ctx.lineTo(x, rect.y + rect.h);
  if (double) {
    ctx.moveTo(x + 5, rect.y);
    ctx.lineTo(x + 5, rect.y + rect.h);
  }
  ctx.stroke();
  ctx.restore();
}

/* ---------- Oggetti ---------- */

/** Angolo in alto a destra piegato verso l'interno. */
export function drawDogEar(ctx, rect, size, under, rand) {
  const x = rect.x + rect.w;
  const y = rect.y;
  const s = size * between(rand, 0.9, 1.1);
  ctx.save();
  // L'angolo mancante mostra cosa c'è sotto (pagina successiva o scrivania).
  ctx.fillStyle = under;
  ctx.beginPath();
  ctx.moveTo(x - s, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + s);
  ctx.closePath();
  ctx.fill();
  // Ombra della piega.
  ctx.shadowColor = 'rgba(20,14,8,0.3)';
  ctx.shadowBlur = s * 0.18;
  ctx.shadowOffsetX = -s * 0.04;
  ctx.shadowOffsetY = s * 0.05;
  const flap = ctx.createLinearGradient(x - s, y, x - s * 0.5, y + s * 0.5);
  flap.addColorStop(0, 'rgba(255,255,255,0.9)');
  flap.addColorStop(1, 'rgba(215,205,188,0.95)');
  ctx.fillStyle = flap;
  ctx.beginPath();
  ctx.moveTo(x - s, y);
  ctx.lineTo(x - s * 0.02, y + s * 0.98);
  ctx.lineTo(x - s * 0.06, y + s);
  ctx.quadraticCurveTo(x - s * 0.62, y + s * 0.62, x - s, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Striscia di nastro adesivo semitrasparente con le estremità frastagliate. */
export function drawTape(ctx, cx, cy, w, h, angle, rand) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  const path = new Path2D();
  const zig = (x, fromY, toY, dir) => {
    const steps = 7;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      path.lineTo(x + dir * (i % 2 ? 1 : -1) * between(rand, 1.5, 4), fromY + (toY - fromY) * t);
    }
  };
  path.moveTo(-w / 2, -h / 2);
  path.lineTo(w / 2, -h / 2);
  zig(w / 2, -h / 2, h / 2, 1);
  path.lineTo(-w / 2, h / 2);
  zig(-w / 2, h / 2, -h / 2, -1);
  path.closePath();
  ctx.shadowColor = 'rgba(0,0,0,0.12)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = 'rgba(246,240,214,0.62)';
  ctx.fill(path);
  ctx.shadowColor = 'transparent';
  ctx.clip(path);
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 14; i += 1) {
    ctx.fillStyle = rand() < 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(170,160,130,0.18)';
    ctx.fillRect(-w / 2, -h / 2 + rand() * h, w, between(rand, 0.6, 2.4));
  }
  ctx.restore();
}

/** Graffetta metallica. */
export function drawPaperClip(ctx, x, y, size, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(size / 80, size / 80);
  const metal = ctx.createLinearGradient(-15, 0, 15, 0);
  metal.addColorStop(0, '#7d7f82');
  metal.addColorStop(0.45, '#e6e7e9');
  metal.addColorStop(0.6, '#a7a9ad');
  metal.addColorStop(1, '#6a6c70');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const shape = new Path2D('M -6 34 V -26 a 9 9 0 0 1 18 0 V 44 a 14 14 0 0 1 -28 0 V -14');
  ctx.shadowColor = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;
  ctx.strokeStyle = metal;
  ctx.lineWidth = 4.2;
  ctx.stroke(shape);
  ctx.restore();
}

/** Alone lasciato da una tazza di caffè. */
export function drawCoffeeRing(ctx, cx, cy, r, rand) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  const fill = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
  fill.addColorStop(0, 'rgba(150,95,45,0.05)');
  fill.addColorStop(0.85, 'rgba(150,95,45,0.09)');
  fill.addColorStop(1, 'rgba(150,95,45,0)');
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  const start = rand() * Math.PI * 2;
  const segments = 90;
  for (let pass = 0; pass < 3; pass += 1) {
    ctx.beginPath();
    for (let i = 0; i <= segments; i += 1) {
      const a = start + (i / segments) * Math.PI * 2 * between(rand, 0.86, 1);
      const rr = r * (0.97 + wobble(rand) * 0.012) - pass * 2;
      if (i === 0) ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      else ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    ctx.strokeStyle = `rgba(120,70,25,${(0.28 - pass * 0.08).toFixed(2)})`;
    ctx.lineWidth = between(rand, 2, 5) - pass;
    ctx.stroke();
  }
  ctx.restore();
}

/** Timbro rotondo (ex libris) con testo lungo il bordo. */
export function drawStamp(ctx, cx, cy, r, { top, bottom, center }, color, rand, font = '"EB Garamond", serif') {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(between(rand, -0.32, -0.12));
  ctx.globalCompositeOperation = 'multiply';
  ctx.strokeStyle = rgba(color, 0.82);
  ctx.fillStyle = rgba(color, 0.86);
  ctx.lineWidth = r * 0.045;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = r * 0.018;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2);
  ctx.stroke();
  const arcText = (text, radius, startAngle, direction) => {
    const size = r * 0.17;
    ctx.font = `600 ${size}px ${font}`;
    const chars = [...text];
    const spread = Math.min(Math.PI * 1.1, chars.length * 0.19);
    chars.forEach((char, i) => {
      const angle = startAngle + direction * (-spread / 2 + (spread * (i + 0.5)) / chars.length);
      ctx.save();
      ctx.rotate(angle);
      ctx.translate(0, -radius * direction);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (direction < 0) ctx.rotate(Math.PI);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });
  };
  if (top) arcText(top.toUpperCase(), r * 0.87, 0, 1);
  if (bottom) arcText(bottom.toUpperCase(), r * 0.87, Math.PI, -1);
  if (center) {
    ctx.font = `italic 500 ${r * 0.3}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(center, 0, r * 0.02);
  }
  // Inchiostro irregolare: qualche "buco" nel timbro.
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 70; i += 1) {
    ctx.fillStyle = `rgba(0,0,0,${between(rand, 0.15, 0.6).toFixed(2)})`;
    const a = rand() * Math.PI * 2;
    const d = rand() * r * 1.05;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * d, Math.sin(a) * d, between(rand, 0.6, r * 0.04), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Pieghe di una lettera piegata in tre. */
export function drawFolds(ctx, rect, rand) {
  ctx.save();
  for (const t of [1 / 3, 2 / 3]) {
    const y = rect.y + rect.h * t + wobble(rand) * 3;
    const shade = ctx.createLinearGradient(0, y - 10, 0, y + 10);
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(0.48, 'rgba(70,60,45,0.12)');
    shade.addColorStop(0.52, 'rgba(255,255,255,0.45)');
    shade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shade;
    ctx.fillRect(rect.x, y - 10, rect.w, 20);
  }
  ctx.restore();
}

/** Foro e cordino del segnalibro. */
export function drawBookmarkHole(ctx, x, y, r, under) {
  ctx.save();
  ctx.fillStyle = under;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = '#8c2f2f';
  ctx.lineWidth = r * 0.42;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y - r * 0.2);
  ctx.bezierCurveTo(x + r * 2, y - r * 6, x - r * 3, y - r * 10, x + r * 1.5, y - r * 16);
  ctx.stroke();
  ctx.restore();
}

/** Retro di cartolina: linea centrale, riquadro del francobollo con annullo, righe dell'indirizzo. */
export function drawPostcardBack(ctx, rect, rand, { ink = '#5a4a3a', lang = 'it' } = {}) {
  ctx.save();
  const divider = rect.x + rect.w * 0.56;
  ctx.strokeStyle = rgba(ink, 0.45);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(divider, rect.y + rect.h * 0.1);
  ctx.lineTo(divider, rect.y + rect.h * 0.9);
  ctx.stroke();
  const stampW = rect.w * 0.15;
  const stampH = stampW * 1.2;
  const sx = rect.x + rect.w - stampW - rect.w * 0.05;
  const sy = rect.y + rect.h * 0.08;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(sx, sy, stampW, stampH);
  ctx.setLineDash([]);
  ctx.strokeStyle = rgba('#3a3a6a', 0.45);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(sx - stampW * 0.1, sy + stampH * 0.55, stampW * 0.42, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    const yy = sy + stampH * (0.3 + i * 0.14);
    ctx.moveTo(sx - stampW * 0.9, yy);
    for (let x = 0; x <= stampW * 0.9; x += 6) ctx.lineTo(sx - stampW * 0.9 + x, yy + Math.sin(x * 0.18) * 2.5);
    ctx.stroke();
  }
  ctx.font = `400 ${rect.w * 0.022}px "Special Elite", monospace`;
  ctx.fillStyle = rgba('#3a3a6a', 0.55);
  ctx.textAlign = 'center';
  ctx.fillText(lang === 'it' ? 'POSTE' : 'POST', sx - stampW * 0.1, sy + stampH * 0.58);
  ctx.textAlign = 'left';
  ctx.strokeStyle = rgba(ink, 0.4);
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 4; i += 1) {
    const yy = rect.y + rect.h * (0.52 + i * 0.1);
    ctx.beginPath();
    ctx.moveTo(divider + rect.w * 0.04, yy);
    ctx.lineTo(rect.x + rect.w * 0.94, yy + wobble(rand));
    ctx.stroke();
  }
  ctx.restore();
}

/** Scheda di biblioteca: intestazione, tabella delle restituzioni, date timbrate. */
export function drawLibraryCard(ctx, rect, rand, { lang = 'it', from }) {
  ctx.save();
  const ink = '#5a3c1e';
  const top = from;
  ctx.font = `500 ${rect.w * 0.034}px "Geist Mono", ui-monospace, monospace`;
  ctx.fillStyle = rgba(ink, 0.85);
  ctx.fillText(lang === 'it' ? 'DATA DI RESTITUZIONE' : 'DATE DUE', rect.x + rect.w * 0.08, top);
  ctx.strokeStyle = rgba(ink, 0.6);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(rect.x + rect.w * 0.06, top + rect.w * 0.025);
  ctx.lineTo(rect.x + rect.w * 0.94, top + rect.w * 0.025);
  ctx.stroke();
  const rowH = rect.w * 0.085;
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = rgba(ink, 0.38);
  for (let y = top + rect.w * 0.025 + rowH; y < rect.y + rect.h - rect.w * 0.05; y += rowH) {
    ctx.beginPath();
    ctx.moveTo(rect.x + rect.w * 0.06, y);
    ctx.lineTo(rect.x + rect.w * 0.94, y);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(rect.x + rect.w * 0.5, top + rect.w * 0.025);
  ctx.lineTo(rect.x + rect.w * 0.5, rect.y + rect.h - rect.w * 0.05);
  ctx.stroke();
  const months = lang === 'it' ? ['GEN', 'MAR', 'MAG', 'OTT', 'DIC'] : ['JAN', 'MAR', 'MAY', 'OCT', 'DEC'];
  ctx.font = `400 ${rect.w * 0.05}px "Special Elite", monospace`;
  for (let i = 0; i < 3; i += 1) {
    const day = String(Math.floor(between(rand, 1, 28))).padStart(2, '0');
    const label = `${day} ${months[Math.floor(rand() * months.length)]} ${Math.floor(between(rand, 1968, 1999))}`;
    const x = rect.x + rect.w * (i % 2 ? 0.55 : 0.1);
    const y = top + rect.w * 0.025 + rowH * (i + 1) - rowH * 0.22;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(between(rand, -0.07, 0.07));
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = rgba('#5b2a8c', between(rand, 0.55, 0.8));
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

/** Intestazione di capitolo: numero romano e filetto. */
export function drawChapterHeading(ctx, cx, y, size, numeral, ink) {
  ctx.save();
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.font = `500 ${size}px "Cormorant Garamond", "EB Garamond", serif`;
  ctx.fillText(numeral, cx, y);
  ctx.strokeStyle = rgba(ink, 0.55);
  ctx.lineWidth = Math.max(1, size * 0.025);
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.55, y + size * 0.42);
  ctx.lineTo(cx + size * 0.55, y + size * 0.42);
  ctx.stroke();
  ctx.restore();
}

export function toRoman(value) {
  const table = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let n = Math.max(1, Math.min(3999, Math.floor(value)));
  let out = '';
  for (const [amount, letters] of table) {
    while (n >= amount) {
      out += letters;
      n -= amount;
    }
  }
  return out;
}

/** Testo con spaziatura tra le lettere (per maiuscoletti e testatine). */
export function fillSpaced(ctx, text, x, y, spacing, align = 'left') {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
  let cursor = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const previousAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  chars.forEach((char, i) => {
    ctx.fillText(char, cursor, y);
    cursor += widths[i] + spacing;
  });
  ctx.textAlign = previousAlign;
  return total;
}
