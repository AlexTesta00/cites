// Disegna una pagina della citazione su un canvas. Tutte le misure sono in unità di uscita
// (le dimensioni del formato, per esempio 1080×1350); `scale` converte in pixel del canvas.

import { getFormat } from './formats.js';
import { FONTS, getFont, fontString, loadFonts } from './fonts.js';
import { DESKS, HIGHLIGHTERS, INKS, PAPERS, PENS, luminance, rgba } from './palette.js';
import { paintGhost, paintGrain, paintGutter, paintLighting, paintShadow, paintSurface } from './paper.js';
import { drawArrow, drawCircle, drawDoubleUnderline, drawHighlight, drawMarginLine, drawUnderline } from './marks.js';
import {
  decklePath, drawBookmarkHole, drawChapterHeading, drawCoffeeRing, drawDogEar, drawDots, drawFolds, drawGrid,
  drawLibraryCard, drawLines, drawMarginRule, drawPaperClip, drawPostcardBack, drawStamp, drawTape, fillSpaced,
  rectPath, roundedPath, toRoman, tornPath,
} from './decor.js';
import { autoMarks, displayWords, punctuationSpan, smarten, tokenize } from './text.js';
import { REF_SIZE, fitText, placeLines } from './layout.js';
import { between, seeded, wobble } from './random.js';
import { getTemplate } from './templates.js';

const DEG = Math.PI / 180;

/* ---------- Impostazioni effettive (template + scelte dell'utente) ---------- */

export function resolveSettings(doc) {
  const template = getTemplate(doc.template);
  const o = doc.overrides ?? {};
  const paperId = PAPERS[o.paper] ? o.paper : template.paper;
  const paper = PAPERS[paperId];
  const fontId = FONTS[o.font] ? o.font : template.font;
  const font = getFont(fontId);
  const paperLum = luminance(paper.base);
  let ink = (INKS[o.ink] ?? INKS[template.ink] ?? INKS.black).color;
  if (paperLum < 0.2 && luminance(ink) < 0.35) ink = INKS.white.color;
  if (paperLum > 0.45 && luminance(ink) > 0.7) ink = INKS.black.color;
  return {
    template,
    paperId,
    paper,
    dark: paperLum < 0.2,
    fontId,
    font,
    italic: template.italic && font.italic,
    weight: template.weight && font.kind === 'book' ? template.weight : font.weight,
    upper: template.upper,
    ink,
    hl: (HIGHLIGHTERS[o.hl] ?? HIGHLIGHTERS[template.hl]).color,
    pen: PENS[o.pen] ?? PENS[template.pen],
    align: o.align ?? template.align,
    sizeFactor: ((o.size ?? 100) / 100) * template.size,
    pageNumber: o.pageNumber ?? template.pageNumber,
    runningHead: o.runningHead ?? template.runningHead,
    arrow: o.arrow ?? false,
    light: template.light,
  };
}

/** Elenco dei caratteri da caricare prima di disegnare il documento. */
export function fontsFor(doc) {
  const s = resolveSettings(doc);
  const t = s.template;
  const list = [
    [s.font, { weight: s.weight }],
    [FONTS.garamond, { weight: 400 }],
    [FONTS.garamond, { weight: 400, italic: true }],
  ];
  if (s.font.italic) list.push([s.font, { italic: true, weight: s.weight }], [s.font, { italic: true }]);
  if (['hand', 'note'].includes(t.author) || t.decor.includes('date') || s.arrow) list.push([FONTS.caveat, {}]);
  if (t.author === 'typed' || t.decor.includes('libcard') || t.decor.includes('postcard')) list.push([FONTS.typewriter, {}]);
  if (t.layout === 'chapter' || t.decor.includes('stamp')) list.push([FONTS.cormorant, {}], [FONTS.cormorant, { italic: true }]);
  if (t.author === 'sign') list.push([s.font.kind === 'hand' ? s.font : FONTS.homemade, {}]);
  return list;
}

export async function prepareFonts(doc) {
  await loadFonts(fontsFor(doc));
  if (getTemplate(doc.template).decor.includes('libcard') && typeof document !== 'undefined') {
    await document.fonts.load('500 20px "Geist Mono"').catch(() => []);
  }
}

/* ---------- Geometria ---------- */

function objectGeometry(t, W, H, rand) {
  if (t.surface !== 'object') return { w: W, h: H, cx: W / 2, cy: H / 2, angle: 0 };
  const portrait = H >= W;
  const m = Math.min(W, H);
  let w;
  let h;
  switch (t.shape) {
    case 'sticky':
      w = m * 0.74;
      h = w * 1.02;
      break;
    case 'card':
      w = Math.min(W * 0.88, H * 0.88 * (5 / 3));
      h = w * 0.6;
      break;
    case 'postcard':
      w = Math.min(W * 0.9, H * 0.9 * 1.5);
      h = w / 1.5;
      break;
    case 'libcard':
      h = Math.min(H * 0.86, W * 0.84 * 1.62);
      w = h / 1.62;
      break;
    case 'bookmark':
      if (portrait) {
        w = W * 0.36;
        h = H * 0.86;
      } else {
        w = W * 0.86;
        h = H * 0.36;
      }
      break;
    case 'clipping':
      w = W * 0.82;
      h = Math.min(H * 0.76, w * 1.2);
      break;
    case 'torn':
      w = W * 0.88;
      h = H * 0.95;
      break;
    case 'cotton':
      w = W * 0.84;
      h = H * 0.86;
      break;
    default:
      w = W * 0.82;
      h = H * 0.82;
  }
  const angle = (t.rotate + between(rand, -0.6, 0.6)) * DEG;
  let cy = H / 2 + between(rand, -0.008, 0.008) * H;
  if (t.shape === 'torn') cy = H / 2 + H * 0.06;
  return { w, h, cx: W / 2 + between(rand, -0.01, 0.01) * W, cy, angle };
}

function objectPath(t, geo, rand) {
  const rect = { x: 0, y: 0, w: geo.w, h: geo.h };
  switch (t.shape) {
    case 'card':
    case 'postcard':
    case 'libcard':
      return roundedPath(rect, geo.w * 0.012);
    case 'bookmark':
      return roundedPath(rect, Math.min(geo.w, geo.h) * 0.05);
    case 'clipping':
      return tornPath(rect, ['top', 'right', 'bottom', 'left'], rand, geo.w * 0.012);
    case 'torn':
      return tornPath(rect, ['top'], rand, geo.w * 0.024);
    case 'cotton':
      return decklePath(rect, rand);
    default:
      return rectPath(rect);
  }
}

function applyObject(ctx, geo) {
  ctx.translate(geo.cx, geo.cy);
  ctx.rotate(geo.angle);
  ctx.translate(-geo.w / 2, -geo.h / 2);
}

function bookMargins(rect) {
  return { x: rect.x + rect.w * 0.1, y: rect.y + rect.h * 0.065, w: rect.w * 0.8, h: rect.h * 0.87 };
}

/** Riquadro del testo, in coordinate del foglio. */
function contentBox(s, fmt, geo) {
  const t = s.template;
  const W = geo.w;
  const H = geo.h;
  let side = W * 0.12;
  let top = H * 0.11;
  let bottom = H * 0.11;
  const fullPage = t.surface !== 'object';
  if (fullPage && fmt.safe) {
    side = W * 0.11;
    top = fmt.safe.top + H * 0.035;
    bottom = fmt.safe.bottom + H * 0.03;
  }
  if (fullPage && W > H * 1.3) {
    side = W * 0.17;
    top = H * 0.14;
    bottom = H * 0.14;
  }
  switch (t.shape) {
    case 'sticky':
      side = W * 0.12;
      top = H * 0.13;
      bottom = H * 0.13;
      break;
    case 'card':
      side = W * 0.07;
      top = H * 0.3;
      bottom = H * 0.08;
      break;
    case 'postcard':
      return { x: W * 0.06, y: H * 0.13, w: W * 0.45, h: H * 0.74 };
    case 'libcard':
      return { x: W * 0.09, y: H * 0.07, w: W * 0.82, h: H * 0.27 };
    case 'bookmark':
      side = W * 0.13;
      top = H > W ? H * 0.16 : H * 0.2;
      bottom = H * 0.09;
      break;
    case 'clipping':
      side = W * 0.09;
      top = H * 0.1;
      bottom = H * 0.3;
      break;
    case 'torn':
      top = H * 0.16;
      bottom = H * 0.16;
      break;
    default:
      break;
  }
  if (t.surface === 'spread') {
    if (W >= H) return { x: W * 0.57, y: top, w: W * 0.33, h: H - top - bottom };
    return { x: W * 0.17, y: top, w: W * 0.72, h: H - top - bottom };
  }
  if (t.layout === 'epigraph') return { x: W * 0.4, y: top + H * 0.05, w: W * 0.48, h: (H - top - bottom) * 0.42 };
  if (t.layout === 'chapter') top += H * 0.17;
  if (t.margin) side = Math.max(side, W * 0.1);
  const box = { x: side, y: top, w: W - side * 2, h: H - top - bottom };
  if (t.margin) {
    box.x = W * 0.2;
    box.w = W * 0.7;
  }
  return box;
}

/* ---------- Sfondo (memorizzato: cambia solo con template, carta, formato e seme) ---------- */

// Due cache: anteprime grandi (poche) e miniature dei template (molte, piccole).
const largeCache = new Map();
const smallCache = new Map();

function paintBackground(ctx, s, fmt, geo, rand, lang) {
  const t = s.template;
  const W = fmt.w;
  const H = fmt.h;
  const full = { x: 0, y: 0, w: W, h: H };
  if (t.surface === 'object') {
    if (t.desk === 'page') {
      paintSurface(ctx, full, PAPERS.gray, rand);
      paintGhost(ctx, bookMargins(full), { alpha: 0.085, lang, size: W * 0.026 });
      paintGutter(ctx, full, rand() < 0.5 ? 'left' : 'right', 0.7);
    } else {
      paintSurface(ctx, full, DESKS[t.desk] ?? DESKS.kraft, rand);
    }
    ctx.save();
    applyObject(ctx, geo);
    const path = objectPath(t, geo, rand);
    const m = Math.min(W, H);
    paintShadow(ctx, path, { blur: m * 0.035, offsetY: m * 0.016, alpha: t.desk === 'dark' || t.desk === 'green' ? 0.6 : 0.36 });
    paintSurface(ctx, { x: 0, y: 0, w: geo.w, h: geo.h }, s.paper, rand, path);
    if (t.shape === 'sticky') {
      const curl = ctx.createLinearGradient(0, geo.h * 0.78, 0, geo.h);
      curl.addColorStop(0, 'rgba(120,90,20,0)');
      curl.addColorStop(1, 'rgba(120,90,20,0.16)');
      ctx.fillStyle = curl;
      ctx.fill(path);
      const glue = ctx.createLinearGradient(0, 0, 0, geo.h * 0.2);
      glue.addColorStop(0, 'rgba(255,255,255,0.18)');
      glue.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glue;
      ctx.fill(path);
    }
    if (t.shape === 'torn') {
      ctx.save();
      ctx.clip(path);
      const fibers = ctx.createLinearGradient(0, 0, 0, geo.h * 0.05);
      fibers.addColorStop(0, 'rgba(255,255,255,0.8)');
      fibers.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = fibers;
      ctx.fillRect(0, 0, geo.w, geo.h * 0.05);
      ctx.restore();
    }
    ctx.restore();
    return;
  }
  paintSurface(ctx, full, s.paper, rand);
  const ghost = t.ghost ?? s.paper.ghost;
  if (t.surface === 'spread') {
    if (W >= H) {
      paintGhost(ctx, { x: W * 0.06, y: H * 0.1, w: W * 0.36, h: H * 0.8 }, { alpha: Math.max(ghost, 0.06) * 2.4, lang, size: W * 0.0135, mirrored: false, blur: 0.5 });
      paintGhost(ctx, { x: W * 0.57, y: H * 0.1, w: W * 0.33, h: H * 0.8 }, { alpha: ghost, lang, size: W * 0.0135 });
      paintGutter(ctx, full, 'center', 1);
    } else {
      paintGhost(ctx, bookMargins(full), { alpha: ghost, lang, size: W * 0.026 });
      paintGutter(ctx, full, 'left', 1.2);
    }
  } else {
    if (ghost) paintGhost(ctx, bookMargins(full), { alpha: ghost, lang, size: W * 0.026 });
    if (t.gutter) paintGutter(ctx, full, rand() < 0.5 ? 'left' : 'right', 0.55);
  }
}

function cachedBackground(s, fmt, geo, seed, pageIndex, scale, lang) {
  const key = [s.template.id, s.paperId, fmt.id, seed, pageIndex, scale.toFixed(3), lang].join('|');
  const backgroundCache = scale < 0.4 ? smallCache : largeCache;
  const limit = scale < 0.4 ? 48 : 6;
  if (backgroundCache.has(key)) {
    const hit = backgroundCache.get(key);
    backgroundCache.delete(key);
    backgroundCache.set(key, hit);
    return hit;
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(fmt.w * scale);
  canvas.height = Math.round(fmt.h * scale);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  paintBackground(ctx, s, fmt, geo, seeded(seed, s.template.id, 'background', pageIndex), lang);
  backgroundCache.set(key, canvas);
  while (backgroundCache.size > limit) backgroundCache.delete(backgroundCache.keys().next().value);
  return canvas;
}

/* ---------- Testo ---------- */

function authorParts(page, s) {
  const author = (page.author ?? '').trim();
  const work = (page.work ?? '').trim();
  if (s.template.author === 'none' || (!author && !work)) return null;
  return { author, work };
}

function authorSizeFor(style, size, W) {
  if (style === 'caps') return Math.min(Math.max(size * 0.3, W * 0.019), W * 0.027);
  if (style === 'note' || style === 'hand' || style === 'sign') return Math.min(Math.max(size * 0.55, W * 0.032), W * 0.05);
  return Math.min(Math.max(size * 0.46, W * 0.024), W * 0.04);
}

function measureWith(ctx, font) {
  ctx.font = font;
  const cache = new Map();
  return (text) => {
    if (!cache.has(text)) cache.set(text, ctx.measureText(text).width);
    return cache.get(text);
  };
}

/**
 * Disegna una pagina. Restituisce le aree delle parole (per segnarle toccandole) e la trasformazione del foglio.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} doc stato completo del documento
 * @param {number} pageIndex
 * @param {{scale:number, lang?:string, total?:number}} options
 */
export function renderPage(ctx, doc, pageIndex, { scale, lang = 'it', total = 1 }) {
  const fmt = getFormat(doc.format);
  const W = fmt.w;
  const H = fmt.h;
  const s = resolveSettings(doc);
  const t = s.template;
  const page = doc.pages[pageIndex] ?? doc.pages[0];
  const seed = doc.seed ?? 1;
  const rand = seeded(seed, t.id, 'page', pageIndex);
  const geo = objectGeometry(t, W, H, seeded(seed, t.id, 'geometry', pageIndex));

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(cachedBackground(s, fmt, geo, seed, pageIndex, scale, lang), 0, 0);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  ctx.save();
  applyObject(ctx, geo);
  const sheet = { x: 0, y: 0, w: geo.w, h: geo.h };
  const box = contentBox(s, fmt, geo);
  const words = drawText(ctx, s, page, sheet, box, rand, { fmt, pageIndex, total, doc, lang });
  ctx.restore();

  paintLighting(ctx, W, H, s.light, seeded(seed, t.id, 'light'));
  paintGrain(ctx, { x: 0, y: 0, w: W, h: H }, s.dark ? 0.12 : 0.22, seeded(seed, 'post', pageIndex));
  ctx.restore();

  return { width: W, height: H, scale, geo, words };
}

function drawText(ctx, s, page, sheet, box, rand, { fmt, pageIndex, total, doc, lang }) {
  const t = s.template;
  const font = s.font;
  const text = smarten(page.text ?? '');
  const { lines: rawLines, tokens } = tokenize(s.upper ? text.toUpperCase() : text);
  const display = displayWords(tokens, doc.quoteMarks ?? 'none');
  const marks = page.marks ?? autoMarks(tokens, t.marks);
  const parts = authorParts(page, s);
  const showAuthor = doc.showAuthor !== false && parts;
  const authorStyle = t.author;
  const W = sheet.w;
  const H = sheet.h;
  const dark = s.dark;

  // Misure a corpo di riferimento.
  const refFont = fontString(font, REF_SIZE, { italic: s.italic, weight: s.weight });
  const measure = measureWith(ctx, refFont);
  const space = measure(' ') * (font.kind === 'hand' ? 1.15 : 1);

  let dropLetter = '';
  let drop = null;
  if (t.layout === 'chapter' && tokens.length) {
    const first = display[0];
    const lead = first.match(/^[«“"‘'(]*/u)[0];
    dropLetter = first.slice(lead.length, lead.length + 1);
    if (dropLetter) {
      display[0] = lead + first.slice(lead.length + 1);
      const lineHeight = t.lineHeight ?? font.lh;
      const dropSize = REF_SIZE * lineHeight * 2 * 0.86;
      ctx.font = fontString(font, dropSize, { weight: s.weight });
      drop = { lines: 2, width: ctx.measureText(dropLetter).width + REF_SIZE * 0.22, size: dropSize };
      ctx.font = refFont;
    }
  }

  const paragraphs = rawLines.map((line) => line.map((token) => ({ index: token.index, text: display[token.index], w: measure(display[token.index]) })));
  const lineHeight = t.lineHeight ?? (t.layout === 'big' ? 1.02 : t.layout === 'word' ? 1.15 : font.lh);
  const layoutMode = t.layout === 'poem' ? 'poem' : t.layout === 'chapter' ? 'greedy' : 'balanced';
  const unit = Math.min(box.w, W);
  let maxSize;
  switch (t.layout) {
    case 'word':
      maxSize = unit * 0.2;
      break;
    case 'big':
      maxSize = unit * 0.16;
      break;
    case 'epigraph':
      maxSize = W * 0.036;
      break;
    case 'poem':
      maxSize = unit * 0.07;
      break;
    case 'chapter':
      maxSize = unit * 0.07;
      break;
    default:
      maxSize = Math.min(unit * (tokens.length <= 3 ? 0.13 : 0.1), box.h * 0.22);
      // Riquadri stretti e alti (segnalibro, storie): il testo può andare a capo di più.
      if (box.h > box.w * 1.6) maxSize = Math.min(unit * 0.15, box.h * 0.12);
  }
  maxSize *= font.scale * s.sizeFactor;
  const minSize = Math.min(maxSize, W * 0.02);
  const authorGap = (size) => size * (t.layout === 'big' ? 0.55 : 0.8);
  const extraHeight = (size) => (showAuthor && authorStyle !== 'note' ? authorGap(size) + authorSizeFor(authorStyle, size, W) * 1.25 : 0);

  const layout = fitText({ paragraphs, space, box, lineHeight, minSize, maxSize, mode: layoutMode, extraHeight, drop });
  const size = layout.size;
  const align = t.layout === 'poem' && !doc.overrides?.align ? 'poem' : s.align;
  const valign = t.layout === 'epigraph' || t.layout === 'chapter' ? 'top' : t.valign;
  const block = placeLines(layout, { box, align, valign, lineHeight, space, extraHeight: extraHeight(size), optical: t.layout === 'block' ? 0.02 : 0 });

  ctx.font = fontString(font, size, { italic: s.italic, weight: s.weight });
  const metrics = ctx.measureText('Hgjy');
  const ascent = metrics.actualBoundingBoxAscent || size * 0.72;
  const descent = metrics.actualBoundingBoxDescent || size * 0.22;

  // Righe e quadretti allineati al testo.
  const rule = { x: 0, y: 0, w: W, h: H };
  const lineStep = size * lineHeight;
  if (t.ruling === 'lines' || t.ruling === 'diary') {
    drawLines(ctx, rule, {
      spacing: lineStep,
      phase: (layout.lines[0]?.y ?? box.y) + size * 0.14,
      color: t.ruling === 'diary' ? 'rgba(120,100,70,0.28)' : 'rgba(70,110,185,0.42)',
      width: Math.max(1.2, W * 0.0016),
      from: H * 0.06,
    });
  } else if (t.ruling === 'grid') {
    drawGrid(ctx, rule, W * 0.045, 'rgba(70,110,170,0.28)');
  } else if (t.ruling === 'dots') {
    drawDots(ctx, rule, W * 0.05, 'rgba(40,40,40,0.32)');
  } else if (t.ruling === 'index') {
    drawLines(ctx, rule, { spacing: lineStep, phase: (layout.lines[0]?.y ?? box.y) + size * 0.14, color: 'rgba(70,110,185,0.36)', width: 1.6, from: H * 0.22 });
    ctx.save();
    ctx.strokeStyle = 'rgba(214,64,64,0.65)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.21);
    ctx.lineTo(W, H * 0.21);
    ctx.stroke();
    ctx.restore();
  }
  if (t.margin) drawMarginRule(ctx, W * 0.16, rule);
  if (t.decor.includes('folds')) drawFolds(ctx, rule, rand);
  if (t.decor.includes('postcard')) drawPostcardBack(ctx, rule, rand, { lang });

  const hand = font.kind === 'hand';
  const typed = font.kind === 'type';
  const pen = s.pen;
  const placedWords = layout.lines.flatMap((line) => line.words.map((word) => ({ ...word, line })));

  // Evidenziatore (sotto il testo).
  layout.lines.forEach((line) => {
    let run = null;
    const flush = () => {
      if (!run) return;
      const first = run[0];
      const last = run[run.length - 1];
      const pad = size * 0.09;
      drawHighlight(ctx, first.x - pad, line.y - Math.min(ascent * 1.04, size * 0.86), last.x + last.w + pad, line.y + Math.max(descent * 0.5, size * 0.16), s.hl, rand, { dark });
      run = null;
    };
    line.words.forEach((word) => {
      if ((marks[word.index] ?? '').includes('h')) (run ??= []).push(word);
      else flush();
    });
    flush();
  });

  // Inchiostro.
  ctx.save();
  ctx.fillStyle = s.ink;
  ctx.textBaseline = 'alphabetic';
  ctx.globalCompositeOperation = dark ? 'source-over' : 'multiply';
  const letterpress = t.decor.includes('letterpress');
  layout.lines.forEach((line, lineIndex) => {
    const slope = hand ? between(rand, -0.012, 0.012) : 0;
    line.words.forEach((word) => {
      const dx = hand ? wobble(rand) * size * 0.015 : 0;
      const dy = hand ? wobble(rand) * size * 0.022 + slope * (word.x - line.x) : 0;
      const angle = hand ? wobble(rand) * 0.018 : 0;
      ctx.save();
      ctx.translate(word.x + dx, line.y + dy);
      if (angle) ctx.rotate(angle);
      if (typed) {
        drawTyped(ctx, word.text, size, s.ink, rand);
      } else {
        if (letterpress) {
          ctx.save();
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.fillText(word.text, 0, size * 0.025);
          ctx.restore();
        }
        ctx.fillText(word.text, 0, 0);
      }
      ctx.restore();
    });
    if (lineIndex === 0 && dropLetter) {
      ctx.save();
      ctx.font = fontString(font, size * lineHeight * 2 * 0.86, { weight: s.weight });
      ctx.fillText(dropLetter, box.x, (layout.lines[1]?.y ?? line.y + size * lineHeight));
      ctx.restore();
    }
  });
  ctx.restore();

  // Penna: sottolineature e cerchi (sopra il testo).
  const penColor = pen.color;
  layout.lines.forEach((line) => {
    const kinds = ['u', 'd'];
    for (const kind of kinds) {
      let run = null;
      const flush = () => {
        if (!run) return;
        const first = run[0];
        const last = run[run.length - 1];
        const lead = punctuationSpan(first.text).lead;
        const trail = punctuationSpan(last.text).trail;
        ctx.font = fontString(font, size, { italic: s.italic, weight: s.weight });
        const x1 = first.x + (lead ? ctx.measureText(first.text.slice(0, lead)).width : 0);
        const x2 = last.x + last.w - (trail ? ctx.measureText(last.text.slice(last.text.length - trail)).width : 0);
        const y = line.y + Math.max(descent * 0.45, size * 0.12);
        if (kind === 'd') drawDoubleUnderline(ctx, x1, x2, y, size, penColor, rand, { pencil: pen.pencil, dark });
        else drawUnderline(ctx, x1, x2, y, size, penColor, rand, { pencil: pen.pencil, dark });
        run = null;
      };
      line.words.forEach((word) => {
        if ((marks[word.index] ?? '').includes(kind)) (run ??= []).push(word);
        else flush();
      });
      flush();
    }
    line.words.forEach((word) => {
      if (!(marks[word.index] ?? '').includes('c')) return;
      const cx = word.x + word.w / 2;
      const cy = line.y - (ascent - descent) * 0.45;
      drawCircle(ctx, cx, cy, word.w / 2 + size * 0.3, (ascent + descent) * 0.78, size, penColor, rand, { dark, pencil: pen.pencil });
    });
  });

  if (t.decor.includes('pencilLine') && layout.lines.length) {
    drawMarginLine(ctx, block.left - size * 0.55, block.top + size * 0.15, block.bottom - size * 0.1, size, PENS.pencil.color, rand, { pencil: true, dark });
  }

  // Autore.
  if (showAuthor) drawAuthor(ctx, s, parts, { size, block, box, sheet, align, rand, gap: authorGap(size) });

  drawDetails(ctx, s, { sheet, box, block, size, fmt, pageIndex, total, doc, lang, rand, parts });

  return placedWords.map((word) => ({
    index: word.index,
    x: word.x - size * 0.12,
    y: word.line.y - ascent - size * 0.12,
    w: word.w + size * 0.24,
    h: ascent + descent + size * 0.24,
  }));
}

/** Macchina da scrivere: battute irregolari, inchiostro non uniforme. */
function drawTyped(ctx, text, size, ink, rand) {
  let x = 0;
  for (const char of text) {
    const w = ctx.measureText(char).width;
    ctx.globalAlpha = between(rand, 0.72, 1);
    ctx.fillText(char, x + wobble(rand) * size * 0.012, wobble(rand) * size * 0.018);
    if (rand() < 0.25) {
      ctx.globalAlpha = 0.25;
      ctx.fillText(char, x + size * 0.01, size * 0.008);
    }
    x += w;
  }
  ctx.globalAlpha = 1;
}

function drawAuthor(ctx, s, parts, { size, block, box, sheet, align, rand, gap }) {
  const t = s.template;
  const style = t.author;
  const W = sheet.w;
  const authorSize = authorSizeFor(style, size, W);
  const book = s.font.kind === 'book' ? s.font : FONTS.garamond;
  let y = block.bottom + gap + authorSize * 0.85;
  const dark = s.dark;
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.globalCompositeOperation = dark ? 'source-over' : 'multiply';
  ctx.fillStyle = s.ink;

  const anchorX = () => {
    if (align === 'center') return { x: box.x + box.w / 2, a: 'center' };
    if (align === 'right' || style === 'right') return { x: block.right, a: 'right' };
    if (align === 'poem') return { x: block.right, a: 'right' };
    return { x: block.left, a: 'left' };
  };

  if (style === 'caps') {
    ctx.font = fontString(book, authorSize, { weight: 500 });
    const label = [parts.author, parts.work].filter(Boolean).join(' · ').toUpperCase();
    const { x, a } = anchorX();
    const spacing = authorSize * 0.2;
    const width = fillSpacedMeasure(ctx, label, spacing);
    if (width > box.w) ctx.font = fontString(book, (authorSize * box.w) / width, { weight: 500 });
    ctx.globalAlpha = 0.86;
    fillSpaced(ctx, label, x, y, spacing, a);
  } else if (style === 'note' || style === 'hand' || style === 'sign') {
    const handFont = style === 'sign' ? (s.font.kind === 'hand' ? s.font : FONTS.homemade) : FONTS.caveat;
    const signSize = style === 'sign' && handFont === FONTS.homemade ? authorSize * 0.62 : authorSize;
    ctx.font = fontString(handFont, signSize);
    const label = style === 'note' ? [parts.author, parts.work].filter(Boolean).join(', ') : `— ${[parts.author, parts.work].filter(Boolean).join(', ')}`;
    ctx.fillStyle = style === 'note' ? PENS.pencil.color : s.ink;
    if (style === 'note') {
      y = Math.min(sheet.h - sheet.h * 0.08, Math.max(block.bottom + size * 1.1, sheet.h * 0.8));
      ctx.globalAlpha = 0.8;
    }
    const width = ctx.measureText(label).width;
    const right = style === 'note' ? box.x + box.w : align === 'left' ? block.left + width : align === 'center' ? box.x + box.w / 2 + width / 2 : block.right;
    ctx.translate(right - width, y);
    ctx.rotate(between(rand, -0.06, -0.02));
    ctx.fillText(label, 0, 0);
  } else {
    // "— Autore, Opera" con l'opera in corsivo.
    const typed = s.font.kind === 'type' || style === 'typed';
    const main = typed ? FONTS.typewriter : s.font.kind === 'hand' ? s.font : book;
    const mainFont = fontString(main, authorSize, { weight: main === book ? 400 : main.weight });
    const workFont = fontString(main, authorSize, { italic: main.italic, weight: main === book ? 400 : main.weight });
    const first = parts.author ? `— ${parts.author}` : '— ';
    const second = parts.work ? `${parts.author ? ', ' : ''}${parts.work}` : '';
    ctx.font = mainFont;
    const w1 = ctx.measureText(first).width;
    ctx.font = workFont;
    const w2 = ctx.measureText(second).width;
    let k = 1;
    if (w1 + w2 > box.w) k = box.w / (w1 + w2);
    const total = (w1 + w2) * k;
    const { x, a } = anchorX();
    const start = a === 'center' ? x - total / 2 : a === 'right' ? x - total : x;
    ctx.translate(start, y);
    ctx.scale(k, k);
    ctx.font = mainFont;
    ctx.textAlign = 'left';
    ctx.fillText(first, 0, 0);
    ctx.font = workFont;
    ctx.fillText(second, w1, 0);
  }
  ctx.restore();
}

function fillSpacedMeasure(ctx, text, spacing) {
  const chars = [...text];
  return chars.reduce((sum, char) => sum + ctx.measureText(char).width, 0) + spacing * Math.max(0, chars.length - 1);
}

function drawDetails(ctx, s, { sheet, box, block, size, fmt, pageIndex, total, doc, lang, rand, parts }) {
  const t = s.template;
  const W = sheet.w;
  const H = sheet.h;
  const fullPage = t.surface !== 'object';
  const story = fullPage && fmt.safe;
  const dark = s.dark;
  const small = W * (t.surface === 'object' ? 0.03 : 0.024);
  const bottomY = story ? fmt.h - fmt.safe.bottom - H * 0.012 : H - H * (t.surface === 'object' ? 0.055 : 0.045);
  const topY = story ? fmt.safe.top + H * 0.01 : H * (t.surface === 'object' ? 0.075 : 0.06);
  const handle = (doc.handle ?? '').trim();
  const isLast = pageIndex >= total - 1;
  const showArrow = s.arrow && total > 1 && !isLast;

  ctx.save();
  ctx.fillStyle = s.ink;
  ctx.globalCompositeOperation = dark ? 'source-over' : 'multiply';
  ctx.textBaseline = 'alphabetic';

  if (t.layout === 'chapter') {
    drawChapterHeading(ctx, W / 2, box.y - H * 0.075, W * 0.075, toRoman(pageIndex + 1), s.ink);
  }

  if (s.pageNumber) {
    ctx.font = fontString(FONTS.garamond, small, { weight: 400 });
    ctx.globalAlpha = 0.62;
    ctx.textAlign = 'center';
    ctx.fillText(String((doc.pageStart ?? 1) + pageIndex), W / 2, bottomY);
    ctx.globalAlpha = 1;
  }

  if (s.runningHead) {
    const label = (parts?.work || parts?.author || '').toUpperCase();
    if (label) {
      ctx.font = fontString(FONTS.garamond, small * 0.86, { weight: 400 });
      ctx.globalAlpha = 0.6;
      fillSpaced(ctx, label, W / 2, topY, small * 0.2, 'center');
      ctx.globalAlpha = 1;
    }
  }

  if (handle) {
    const hand = s.font.kind === 'hand';
    ctx.font = hand ? fontString(FONTS.caveat, small * 1.35) : fontString(FONTS.garamond, small * 1.05, { italic: true, weight: 400 });
    ctx.globalAlpha = 0.72;
    const onLeft = showArrow;
    ctx.textAlign = onLeft ? 'left' : 'right';
    ctx.fillText(handle.startsWith('@') ? handle : `@${handle}`, onLeft ? W * 0.1 : W * 0.9, bottomY);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  if (showArrow) {
    drawArrow(ctx, W * 0.9 - small * 3.2, bottomY - small * 0.35, small * 3.2, small * 1.6, s.pen.color, rand, { dark });
  }

  if (t.decor.includes('date')) {
    const date = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'it-IT', { day: 'numeric', month: 'long' }).format(new Date());
    ctx.font = fontString(FONTS.caveat, W * 0.045);
    ctx.textAlign = 'right';
    ctx.globalAlpha = 0.82;
    ctx.fillText(date, W * 0.9, Math.max(topY + W * 0.02, box.y - W * 0.03));
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  if (t.decor.includes('libcard')) {
    drawLibraryCard(ctx, sheet, rand, { lang, from: Math.min(H * 0.48, block.bottom + size * 2.2) });
  }

  if (t.decor.includes('columns')) {
    paintGhost(ctx, { x: W * 0.09, y: H * 0.74, w: W * 0.82, h: H * 0.2 }, { alpha: 0.38, lang, size: W * 0.017, mirrored: false, blur: 0.4, ink: '#222' });
    ctx.fillStyle = rgba('#222222', 0.5);
    ctx.fillRect(W * 0.09, H * 0.715, W * 0.82, Math.max(1, H * 0.002));
  }

  ctx.restore();

  if (t.decor.includes('dogear')) drawDogEar(ctx, sheet, Math.min(W, H) * 0.13, '#cfc8b8', rand);
  if (t.decor.includes('clip')) drawPaperClip(ctx, W * 0.17, -Math.min(W, H) * 0.012, Math.min(W, H) * 0.2, -0.08);
  if (t.decor.includes('coffee')) drawCoffeeRing(ctx, W * 0.86, H * 0.88, Math.min(W, H) * 0.2, rand);
  if (t.decor.includes('stamp')) {
    const r = Math.min(W, H) * 0.095;
    drawStamp(ctx, W * 0.78, H * (story ? 0.72 : 0.82), r, { top: 'Ex libris', bottom: handle ? handle.replace(/^@/, '') : 'Cites', center: (handle.replace(/^@/, '')[0] || 'C').toUpperCase() }, '#6b2e8a', rand, '"Cormorant Garamond", "EB Garamond", serif');
  }
  if (t.decor.includes('tape')) {
    const m = Math.min(W, H);
    drawTape(ctx, W * 0.1, H * 0.02, m * 0.3, m * 0.075, -0.62, rand);
    drawTape(ctx, W * 0.9, H * 0.02, m * 0.3, m * 0.075, 0.62, rand);
  }
  if (t.decor.includes('hole')) {
    const r = Math.min(W, H) * 0.045;
    drawBookmarkHole(ctx, W / 2, H > W ? H * 0.065 : H * 0.18, r, '#d8d3c8');
  }
}

/* ---------- Uscite ---------- */

/** Disegna una pagina su un canvas nuovo, alla scala indicata (1 = dimensioni Instagram). */
export function renderToCanvas(doc, pageIndex, { scale = 1, lang = 'it', canvas } = {}) {
  const fmt = getFormat(doc.format);
  const target = canvas ?? document.createElement('canvas');
  target.width = Math.round(fmt.w * scale);
  target.height = Math.round(fmt.h * scale);
  const ctx = target.getContext('2d');
  const result = renderPage(ctx, doc, pageIndex, { scale, lang, total: doc.pages.length });
  return { canvas: target, result };
}

export function canvasToBlob(canvas, type = 'image/png', quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), type, quality);
  });
}

export function clearBackgroundCache() {
  largeCache.clear();
  smallCache.clear();
}
