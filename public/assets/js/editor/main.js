// Editor: testo, template, personalizzazione, segni a mano, anteprima (anche su telefono), esportazione.

import { $, $$, hasGsap, initCommon, reduceMotion, toast } from '../app.js';
import { formatNumber, lang, t } from '../i18n.js';
import { recordExport } from '../counter.js';
import { FORMATS, getFormat } from '../engine/formats.js';
import { FONT_ORDER, FONTS, fontLabel } from '../engine/fonts.js';
import { HIGHLIGHTERS, INKS, PAPER_CHOICES, PAPERS, PENS } from '../engine/palette.js';
import { canvasToBlob, prepareFonts, renderPage, renderToCanvas, resolveSettings } from '../engine/render.js';
import { quotesFor } from '../engine/samples.js';
import { FAMILIES, TEMPLATES, getTemplate, templateName } from '../engine/templates.js';
import { autoMarks, remapMarks, smarten, tokenize } from '../engine/text.js';
import { randomSeed } from '../engine/random.js';
import { History, MAX_PAGES, createDoc, loadSaved, sanitizeDoc, save } from './state.js';
import { decodeDoc, shareUrl } from './share.js';
import { createZip } from './zip.js';

const editor = $('[data-editor]');
const ui = {
  wrap: $('[data-preview-wrap]'),
  device: $('[data-device]'),
  frame: $('[data-preview-frame]'),
  canvas: $('[data-preview]'),
  overlay: $('[data-overlay]'),
  indicator: $('[data-page-indicator]'),
  formats: $('[data-formats]'),
  tools: $('[data-tools]'),
  swatches: $('[data-swatches]'),
  families: $('[data-families]'),
  templates: $('[data-templates]'),
  papers: $('[data-papers]'),
  fonts: $('[data-fonts]'),
  inks: $('[data-inks]'),
  pens: $('[data-pens]'),
  aligns: $('[data-aligns]'),
  pages: $('[data-pages]'),
  quotes: $('[data-quotes]'),
  quality: $('[data-quality]'),
  safeToggle: $('[data-safe-toggle]'),
  charCount: $('[data-char-count]'),
  downloadLabel: $('[data-download-label]'),
  storyBars: $('[data-story-bars]'),
  feedDots: $('[data-feed-dots]'),
};
const input = (name) => $(`[data-input="${name}"]`);
const action = (name) => $$(`[data-action="${name}"]`);

const undoStack = new History();
let doc;
let active = 0;
let tool = 'h';
let showSafe = true;
let phone = false;
let exportScale = 1;
let family = 'all';
let lastResult = null;
let frameSize = { w: 300, h: 375 };
let busy = false;

/* ---------- Avvio ---------- */

async function start() {
  if (!editor) return;
  initCommon({ smooth: false });
  const params = new URLSearchParams(window.location.search);
  let loaded = null;
  let restored = false;
  if (params.get('c')) {
    const shared = await decodeDoc(params.get('c'));
    if (shared) loaded = sanitizeDoc(shared);
  }
  if (!loaded) {
    const saved = loadSaved();
    if (saved && saved.pages.some((page) => page.text.trim())) {
      loaded = saved;
      restored = true;
    }
  }
  if (!loaded) loaded = createDoc({ text: t('sample.text'), author: t('sample.author'), work: t('sample.work') });
  const template = params.get('t');
  if (template && getTemplate(template).id === template) {
    loaded.template = template;
    loaded.overrides = {};
    loaded.pages.forEach((page) => (page.marks = null));
  }
  const format = params.get('f');
  if (format && FORMATS.some((item) => item.id === format)) loaded.format = format;
  if (!FORMATS.some((item) => item.id === loaded.format)) loaded.format = 'post';
  doc = loaded;
  if (params.has('c') || params.has('t') || params.has('f')) window.history.replaceState(null, '', window.location.pathname);

  buildStatic();
  bindEvents();
  syncAll();
  layoutStage();
  requestRender();
  scheduleThumbnails(60);
  if (restored) toast(t('toast.restored'), { timeout: 3200 });

  new ResizeObserver(() => {
    layoutStage();
    requestRender();
  }).observe(ui.wrap);

  if (hasGsap() && !reduceMotion) {
    window.gsap.from(ui.device, { y: 30, autoAlpha: 0, duration: 0.9, ease: 'expo.out', delay: 0.15 });
  }
  document.documentElement.classList.add('anim-ready');
}

/* ---------- Stato ---------- */

const currentPage = () => doc.pages[active] ?? doc.pages[0];
const tokensOf = (text) => tokenize(smarten(text)).tokens;

let editBurst = 0;
function beginEdit() {
  if (!editBurst) undoStack.push(doc);
  clearTimeout(editBurst);
  editBurst = setTimeout(() => (editBurst = 0), 900);
}

function commit({ thumbnails = false, sync = false } = {}) {
  save(doc);
  if (sync) syncAll();
  updateHistoryButtons();
  requestRender();
  if (thumbnails) scheduleThumbnails(thumbnails === true ? 0 : thumbnails);
}

function setOverride(key, value) {
  undoStack.push(doc);
  const template = getTemplate(doc.template);
  if (value === undefined || value === null || value === template[key]) delete doc.overrides[key];
  else doc.overrides[key] = value;
  commit({ sync: true });
}

function ensureManualMarks() {
  const page = currentPage();
  if (!page.marks) page.marks = autoMarks(tokensOf(page.text), getTemplate(doc.template).marks);
  return page.marks;
}

/* ---------- Interfaccia statica ---------- */

const el = (tag, props = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'style') node.setAttribute('style', value);
    else if (key.startsWith('data-') || key.startsWith('aria-') || key === 'role' || key === 'type' || key === 'title' || key === 'tabindex') node.setAttribute(key, value);
    else node[key] = value;
  }
  node.append(...children);
  return node;
};

const svg = (inner, size = 18) => {
  const holder = document.createElement('span');
  holder.className = 'inline-flex';
  holder.innerHTML = `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  return holder;
};

const TOOL_ICONS = {
  h: '<path d="m9 15-5 5h6l2-2"/><path d="m15 3 6 6-9 9-6-6z"/>',
  u: '<path d="M6 4v6a6 6 0 0 0 12 0V4"/><path d="M4 21h16"/>',
  c: '<ellipse cx="12" cy="12" rx="9" ry="7"/>',
  erase: '<path d="m7 21-4-4 10-10 7 7-6 7z"/><path d="M22 21H7"/>',
};
const ALIGN_ICONS = {
  left: '<path d="M4 6h16"/><path d="M4 10h10"/><path d="M4 14h16"/><path d="M4 18h10"/>',
  center: '<path d="M4 6h16"/><path d="M7 10h10"/><path d="M4 14h16"/><path d="M7 18h10"/>',
  right: '<path d="M4 6h16"/><path d="M10 10h10"/><path d="M4 14h16"/><path d="M10 18h10"/>',
  justify: '<path d="M4 6h16"/><path d="M4 10h16"/><path d="M4 14h16"/><path d="M4 18h16"/>',
};

function buildStatic() {
  ui.formats.replaceChildren(
    ...FORMATS.map((format) => {
      const k = 16 / Math.max(format.w, format.h);
      return el('button', { type: 'button', class: 'chip min-h-10 shrink-0 gap-2 px-3 text-[0.8125rem]', role: 'radio', 'data-format': format.id, 'aria-checked': 'false' }, [
        el('span', { class: 'inline-block border-[1.5px] border-current', style: `width:${Math.round(format.w * k)}px;height:${Math.round(format.h * k)}px`, 'aria-hidden': 'true' }),
        el('span', { text: format.name[lang] }),
        el('span', { class: 'font-mono text-[0.6875rem] opacity-60', text: format.ratio }),
      ]);
    }),
  );

  ui.tools.replaceChildren(
    ...['h', 'u', 'c', 'erase'].map((id) =>
      el('button', { type: 'button', class: 'chip min-h-10 gap-1.5 px-3 text-[0.8125rem]', role: 'radio', 'data-tool': id, 'aria-checked': 'false', title: t(`tool.${id}`) }, [
        svg(TOOL_ICONS[id], 17),
        el('span', { class: 'hidden xl:inline', text: t(`tool.${id}`) }),
        el('span', { class: 'sr-only xl:hidden', text: t(`tool.${id}`) }),
      ]),
    ),
  );

  ui.families.replaceChildren(
    el('button', { type: 'button', class: 'chip min-h-9 shrink-0 text-[0.8125rem]', 'data-family': 'all', 'aria-pressed': 'true', text: t('family.all') }),
    ...FAMILIES.map((item) => el('button', { type: 'button', class: 'chip min-h-9 shrink-0 text-[0.8125rem]', 'data-family': item.id, 'aria-pressed': 'false', text: item.name[lang] })),
  );

  ui.templates.replaceChildren(
    ...TEMPLATES.map((template) =>
      el('li', { 'data-family-of': template.family }, [
        el('button', { type: 'button', class: 'tpl-card group block w-full text-left', 'data-template-card': template.id, 'aria-pressed': 'false', 'aria-label': t('template.use', { name: templateName(template, lang) }) }, [
          el('span', { class: 'tpl-thumb relative block overflow-hidden rounded-md bg-paper-3 shadow-[0_1px_2px_rgba(20,18,14,0.1),0_10px_22px_-14px_rgba(20,18,14,0.45)] transition-transform duration-500 group-hover:-translate-y-1' }, [el('canvas', { 'aria-hidden': 'true' })]),
          el('span', { class: 'mt-2 flex items-baseline justify-between gap-2' }, [
            el('span', { class: 'text-[0.8125rem] font-medium leading-tight', text: templateName(template, lang) }),
          ]),
        ]),
      ]),
    ),
  );

  ui.papers.replaceChildren(
    ...PAPER_CHOICES.map((id) =>
      el('button', { type: 'button', class: 'group flex flex-col items-center gap-1.5 text-[0.6875rem] leading-tight', 'data-paper': id, 'aria-pressed': 'false' }, [
        el('span', { class: 'block aspect-[4/5] w-full rounded-[4px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)] transition group-aria-pressed:ring-2 group-aria-pressed:ring-ink group-aria-pressed:ring-offset-2 group-aria-pressed:ring-offset-paper', style: `background:radial-gradient(90% 80% at 45% 40%, ${PAPERS[id].base}, ${PAPERS[id].edge})` }),
        el('span', { text: PAPERS[id].name[lang] }),
      ]),
    ),
  );

  ui.fonts.replaceChildren(
    ...FONT_ORDER.map((id) => {
      const font = FONTS[id];
      return el('button', { type: 'button', class: 'chip justify-between px-3', 'data-font': id, 'aria-pressed': 'false' }, [
        el('span', { class: 'truncate text-[1.05rem]', style: `font-family:"${font.family}";font-weight:${font.weight}`, text: fontLabel(id, lang) }),
        el('span', { class: 'font-mono text-[0.625rem] uppercase opacity-60', text: font.kind === 'book' ? 'Aa' : font.kind === 'hand' ? '✎' : '⌨' }),
      ]);
    }),
  );

  const swatch = (attr, id, color, name) =>
    el('button', { type: 'button', class: 'group inline-flex size-10 items-center justify-center rounded-full', [`data-${attr}`]: id, 'aria-pressed': 'false', title: name, 'aria-label': name }, [
      el('span', { class: 'block size-7 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)] transition group-aria-pressed:ring-2 group-aria-pressed:ring-ink group-aria-pressed:ring-offset-2 group-aria-pressed:ring-offset-paper', style: `background:${color}` }),
    ]);
  ui.inks.replaceChildren(...Object.entries(INKS).map(([id, ink]) => swatch('ink', id, ink.color, ink.name[lang])));
  ui.pens.replaceChildren(...Object.entries(PENS).map(([id, pen]) => swatch('pen', id, pen.color, pen.name[lang])));

  ui.aligns.replaceChildren(
    ...['left', 'center', 'right', 'justify'].map((id) =>
      el('button', { type: 'button', class: 'inline-flex size-10 items-center justify-center rounded-full border border-line bg-paper-2 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper', 'data-align': id, 'aria-pressed': 'false', 'aria-label': t(`align.${id}`), title: t(`align.${id}`) }, [svg(ALIGN_ICONS[id], 17)]),
    ),
  );
  renderSwatches();
}

/** Colori della barra dei segni: evidenziatori o penne a seconda dello strumento. */
function renderSwatches() {
  const s = resolveSettings(doc);
  ui.swatches.hidden = tool === 'erase';
  if (tool === 'erase') return;
  const list = tool === 'h' ? HIGHLIGHTERS : PENS;
  const current = tool === 'h' ? s.hl : s.pen.color;
  ui.swatches.setAttribute('aria-label', tool === 'h' ? 'Evidenziatore' : 'Penna');
  ui.swatches.replaceChildren(
    ...Object.entries(list).map(([id, item]) =>
      el('button', { type: 'button', class: 'group inline-flex size-9 items-center justify-center rounded-full', role: 'radio', 'data-swatch': id, 'aria-checked': String(item.color === current), title: item.name[lang], 'aria-label': item.name[lang] }, [
        el('span', { class: 'block size-6 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)] transition group-aria-checked:ring-2 group-aria-checked:ring-ink group-aria-checked:ring-offset-2 group-aria-checked:ring-offset-paper', style: `background:${item.color}` }),
      ]),
    ),
  );
}

/* ---------- Sincronizzazione controlli ---------- */

function syncAll() {
  const page = currentPage();
  const s = resolveSettings(doc);
  const setValue = (name, value) => {
    const field = input(name);
    if (field && document.activeElement !== field) field.value = value;
  };
  setValue('text', page.text);
  setValue('author', page.author);
  setValue('work', page.work);
  setValue('handle', doc.handle);
  setValue('pageStart', String(doc.pageStart));
  setValue('size', String(doc.overrides.size ?? 100));
  input('showAuthor').checked = doc.showAuthor !== false;
  input('pageNumber').checked = Boolean(s.pageNumber);
  input('runningHead').checked = Boolean(s.runningHead);
  input('arrow').checked = Boolean(s.arrow);
  input('safe').checked = showSafe;
  updateCharCount();

  const pressed = (selector, attr, value) => $$(selector).forEach((node) => node.setAttribute(attr, String(node.dataset[selector.match(/data-([a-z-]+)/)[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase())] === value)));
  pressed('[data-format]', 'aria-checked', doc.format);
  pressed('[data-tool]', 'aria-checked', tool);
  pressed('[data-template-card]', 'aria-pressed', doc.template);
  pressed('[data-paper]', 'aria-pressed', s.paperId);
  pressed('[data-font]', 'aria-pressed', s.fontId);
  pressed('[data-ink]', 'aria-pressed', Object.keys(INKS).find((id) => INKS[id].color === s.ink) ?? '');
  pressed('[data-pen]', 'aria-pressed', Object.keys(PENS).find((id) => PENS[id] === s.pen) ?? '');
  pressed('[data-align]', 'aria-pressed', s.align);
  pressed('[data-quote-mode]', 'aria-pressed', doc.quoteMarks);
  pressed('[data-scale]', 'aria-pressed', String(exportScale));
  $$('[data-family]').forEach((node) => node.setAttribute('aria-pressed', String(node.dataset.family === family)));
  const story = doc.format === 'story';
  ui.safeToggle.classList.toggle('hidden', !story || phone);
  ui.safeToggle.classList.toggle('inline-flex', story && !phone);
  action('phone').forEach((node) => node.setAttribute('aria-pressed', String(phone)));
  const many = doc.pages.length > 1;
  ui.downloadLabel.textContent = many ? ui.downloadLabel.dataset.multi : ui.downloadLabel.dataset.single;
  renderSwatches();
  renderPagesList();
  updateHistoryButtons();
}

function updateCharCount() {
  ui.charCount.textContent = `${currentPage().text.length} / 280`;
}

function updateHistoryButtons() {
  action('undo').forEach((node) => (node.disabled = !undoStack.canUndo));
  action('redo').forEach((node) => (node.disabled = !undoStack.canRedo));
}

function renderPagesList() {
  const items = doc.pages.map((page, index) => {
    const label = page.text.trim().split(/\s+/).slice(0, 3).join(' ') || '…';
    const current = index === active;
    const li = el('li', { class: 'relative' }, [
      el('button', {
        type: 'button',
        class: `flex h-16 w-14 flex-col items-center justify-center rounded-md border text-[0.625rem] leading-tight ${current ? 'border-ink bg-ink text-paper' : 'border-line bg-paper-2 text-ink-2 hover:border-ink'}`,
        'data-page-index': String(index),
        'aria-current': current ? 'page' : 'false',
        'aria-label': t('page.select', { n: index + 1 }),
        title: label,
      }, [el('span', { class: 'font-serif text-xl leading-none', text: String(index + 1) }), el('span', { class: 'mt-1 line-clamp-1 w-full px-1 text-center opacity-70', text: label })]),
    ]);
    if (doc.pages.length > 1 && current) {
      li.append(el('button', { type: 'button', class: 'absolute -right-2 -top-2 inline-flex size-6 items-center justify-center rounded-full border border-line bg-paper text-ink shadow-sm', 'data-remove-page': String(index), 'aria-label': t('page.remove', { n: index + 1 }) }, [svg('<path d="M6 6l12 12"/><path d="M18 6 6 18"/>', 12)]));
    }
    return li;
  });
  if (doc.pages.length < MAX_PAGES) {
    items.push(el('li', {}, [el('button', { type: 'button', class: 'flex h-16 w-14 items-center justify-center rounded-md border border-dashed border-muted text-ink-2 hover:border-ink hover:text-ink', 'data-action': 'add-page', 'aria-label': t('page.add'), title: t('page.add') }, [svg('<path d="M12 5v14"/><path d="M5 12h14"/>', 18)])]));
  }
  ui.pages.replaceChildren(...items);
}

/* ---------- Anteprima ---------- */

function layoutStage() {
  const fmt = getFormat(doc.format);
  const style = getComputedStyle(ui.wrap);
  const availW = Math.max(120, ui.wrap.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
  const availH = Math.max(160, ui.wrap.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom));
  const story = fmt.id === 'story';
  ui.device.classList.toggle('is-phone', phone);
  ui.device.classList.toggle('is-story', phone && story);
  ui.device.classList.toggle('is-feed', phone && !story);
  if (!phone) {
    const k = Math.min(availW / fmt.w, availH / fmt.h);
    frameSize = { w: Math.floor(fmt.w * k), h: Math.floor(fmt.h * k) };
    Object.assign(ui.device.style, { width: `${frameSize.w}px`, height: `${frameSize.h}px` });
  } else {
    const phoneH = Math.min(availH, availW * (19.5 / 9));
    const phoneW = phoneH * (9 / 19.5);
    const bezel = phoneW * 0.034;
    const screenW = phoneW - bezel * 2;
    const screenH = phoneH - bezel * 2;
    const unit = screenW / 390;
    const statusH = 44 * unit;
    ui.device.style.setProperty('--bezel', `${bezel}px`);
    ui.device.style.setProperty('--device-radius', `${phoneW * 0.14}px`);
    ui.device.style.setProperty('--screen-radius', `${screenW * 0.12}px`);
    ui.device.style.setProperty('--status-h', `${statusH}px`);
    ui.device.style.setProperty('--ui', `${unit}px`);
    Object.assign(ui.device.style, { width: `${phoneW}px`, height: `${phoneH}px` });
    if (story) {
      let w = screenW;
      let h = (w * fmt.h) / fmt.w;
      const maxH = screenH - statusH - 64 * unit;
      if (h > maxH) {
        h = maxH;
        w = (h * fmt.w) / fmt.h;
      }
      frameSize = { w: Math.floor(w), h: Math.floor(h) };
    } else {
      let w = screenW;
      let h = (w * fmt.h) / fmt.w;
      const maxH = screenH - statusH - 52 * unit - 96 * unit;
      if (h > maxH) {
        h = maxH;
        w = (h * fmt.w) / fmt.h;
      }
      frameSize = { w: Math.floor(w), h: Math.floor(h) };
    }
  }
  Object.assign(ui.frame.style, { width: `${frameSize.w}px`, height: `${frameSize.h}px`, marginInline: 'auto' });
  const stage = $('.stage');
  if (stage) document.documentElement.style.setProperty('--stage-h', `${window.innerWidth < 1024 ? stage.offsetHeight : 0}px`);
}

let renderQueued = false;
function requestRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(async () => {
    renderQueued = false;
    try {
      await prepareFonts(doc);
    } catch {
      /* si disegna con i caratteri di riserva */
    }
    drawPreview();
  });
}

function drawPreview() {
  const fmt = getFormat(doc.format);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const scale = (frameSize.w * dpr) / fmt.w;
  const w = Math.round(fmt.w * scale);
  const h = Math.round(fmt.h * scale);
  if (ui.canvas.width !== w || ui.canvas.height !== h) {
    ui.canvas.width = w;
    ui.canvas.height = h;
    ui.overlay.width = w;
    ui.overlay.height = h;
  }
  const ctx = ui.canvas.getContext('2d');
  lastResult = renderPage(ctx, doc, active, { scale, lang, total: doc.pages.length });
  drawOverlay();
  updatePhoneChrome();
}

function toCanvasPoint(word, geo, x, y) {
  const lx = x - geo.w / 2;
  const ly = y - geo.h / 2;
  const cos = Math.cos(geo.angle);
  const sin = Math.sin(geo.angle);
  return { x: geo.cx + lx * cos - ly * sin, y: geo.cy + lx * sin + ly * cos };
}

function drawOverlay(hoverIndex = -1) {
  const ctx = ui.overlay.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ui.overlay.width, ui.overlay.height);
  if (!lastResult) return;
  const fmt = getFormat(doc.format);
  const scale = lastResult.scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  if (fmt.safe && showSafe && !phone) {
    ctx.fillStyle = 'rgba(37,99,235,0.14)';
    ctx.fillRect(0, 0, fmt.w, fmt.safe.top);
    ctx.fillRect(0, fmt.h - fmt.safe.bottom, fmt.w, fmt.safe.bottom);
    ctx.strokeStyle = 'rgba(37,99,235,0.7)';
    ctx.lineWidth = 2 / scale;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(0, fmt.safe.top);
    ctx.lineTo(fmt.w, fmt.safe.top);
    ctx.moveTo(0, fmt.h - fmt.safe.bottom);
    ctx.lineTo(fmt.w, fmt.h - fmt.safe.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (hoverIndex >= 0) {
    const word = lastResult.words.find((item) => item.index === hoverIndex);
    if (word) {
      const corners = [
        toCanvasPoint(word, lastResult.geo, word.x, word.y),
        toCanvasPoint(word, lastResult.geo, word.x + word.w, word.y),
        toCanvasPoint(word, lastResult.geo, word.x + word.w, word.y + word.h),
        toCanvasPoint(word, lastResult.geo, word.x, word.y + word.h),
      ];
      ctx.strokeStyle = 'rgba(13,13,12,0.55)';
      ctx.lineWidth = 2 / scale;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      corners.forEach((point, i) => (i ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)));
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function updatePhoneChrome() {
  if (!phone) return;
  const handle = (doc.handle || t('phone.handle')).replace(/^@/, '');
  $$('[data-phone-handle]').forEach((node) => (node.textContent = handle));
  $$('[data-phone-now]').forEach((node) => (node.textContent = t('phone.now')));
  $$('[data-phone-reply]').forEach((node) => (node.textContent = t('phone.reply')));
  const caption = smarten(currentPage().text).replace(/\n/g, ' ');
  $$('[data-phone-caption]').forEach((node) => (node.textContent = caption.length > 90 ? `${caption.slice(0, 90)}… ${t('phone.more')}` : caption));
  ui.storyBars.replaceChildren(...doc.pages.map((_, i) => el('span', {}, [el('i', { style: `--fill:${i < active ? 100 : i === active ? 45 : 0}%` })])));
  ui.feedDots.replaceChildren(...(doc.pages.length > 1 ? doc.pages.map((_, i) => el('i', i === active ? { 'data-on': '' } : {})) : []));
}

/* ---------- Segni con il puntatore ---------- */

function hitTest(event) {
  if (!lastResult) return -1;
  const rect = ui.canvas.getBoundingClientRect();
  const fmt = getFormat(doc.format);
  const x = ((event.clientX - rect.left) / rect.width) * fmt.w;
  const y = ((event.clientY - rect.top) / rect.height) * fmt.h;
  const { geo } = lastResult;
  const dx = x - geo.cx;
  const dy = y - geo.cy;
  const cos = Math.cos(-geo.angle);
  const sin = Math.sin(-geo.angle);
  const lx = dx * cos - dy * sin + geo.w / 2;
  const ly = dx * sin + dy * cos + geo.h / 2;
  const hit = lastResult.words.find((word) => lx >= word.x && lx <= word.x + word.w && ly >= word.y && ly <= word.y + word.h);
  return hit ? hit.index : -1;
}

let stroke = null;
function applyStroke(index) {
  if (index < 0 || stroke.touched.has(index)) return;
  stroke.touched.add(index);
  const marks = ensureManualMarks();
  const flags = marks[index] ?? '';
  let next = flags;
  if (stroke.mode === 'erase') next = '';
  else if (stroke.mode === 'add' && !flags.includes(tool)) next = flags + tool;
  else if (stroke.mode === 'remove') next = flags.replace(tool, '');
  if (next) marks[index] = next;
  else delete marks[index];
  requestRender();
}

function bindPointer() {
  const canvas = ui.canvas;
  canvas.addEventListener('pointerdown', (event) => {
    const index = hitTest(event);
    if (index < 0) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    undoStack.push(doc);
    const marks = ensureManualMarks();
    const has = (marks[index] ?? '').includes(tool);
    stroke = { mode: tool === 'erase' ? 'erase' : has ? 'remove' : 'add', touched: new Set() };
    applyStroke(index);
  });
  canvas.addEventListener('pointermove', (event) => {
    const index = hitTest(event);
    canvas.style.cursor = index >= 0 ? 'pointer' : '';
    if (stroke) applyStroke(index);
    else if (event.pointerType === 'mouse') drawOverlay(index);
  });
  const end = () => {
    if (!stroke) return;
    stroke = null;
    commit({ thumbnails: false });
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', () => {
    if (!stroke) drawOverlay();
  });
}

/* ---------- Miniature dei template ---------- */

let thumbTimer = 0;
let thumbToken = 0;
function scheduleThumbnails(delay = 0) {
  clearTimeout(thumbTimer);
  thumbTimer = setTimeout(renderThumbnails, delay);
}

const idle = () => new Promise((resolve) => (window.requestIdleCallback ? window.requestIdleCallback(() => resolve(), { timeout: 120 }) : setTimeout(resolve, 16)));

async function renderThumbnails() {
  const token = ++thumbToken;
  const fmt = getFormat(doc.format);
  const page = currentPage();
  const cards = $$('[data-template-card]').filter((card) => !card.closest('li').hidden);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  for (const card of cards) {
    if (token !== thumbToken) return;
    const canvas = card.querySelector('canvas');
    const width = canvas.parentElement.clientWidth || 150;
    const scale = (width * dpr) / fmt.w;
    const thumbDoc = { ...doc, template: card.dataset.templateCard, overrides: {}, pages: [{ ...page, marks: null }] };
    try {
      await prepareFonts(thumbDoc);
    } catch {
      /* caratteri di riserva */
    }
    if (token !== thumbToken) return;
    canvas.width = Math.round(fmt.w * scale);
    canvas.height = Math.round(fmt.h * scale);
    renderPage(canvas.getContext('2d'), thumbDoc, 0, { scale, lang, total: 1 });
    if (!card.classList.contains('is-ready')) {
      card.classList.add('is-ready');
      if (hasGsap() && !reduceMotion) window.gsap.from(canvas, { autoAlpha: 0, duration: 0.5, ease: 'power2.out' });
    }
    await idle();
  }
}

/* ---------- Esportazione ---------- */

function slug(text) {
  return (
    smarten(text)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .split('-')
      .slice(0, 5)
      .join('-') || 'citazione'
  );
}

async function exportFiles() {
  await prepareFonts(doc);
  const fmt = getFormat(doc.format);
  const files = [];
  for (let i = 0; i < doc.pages.length; i += 1) {
    const { canvas } = renderToCanvas(doc, i, { scale: exportScale, lang });
    const blob = await canvasToBlob(canvas, 'image/png');
    const number = doc.pages.length > 1 ? `-${String(i + 1).padStart(2, '0')}` : '';
    files.push({ name: `cites-${slug(doc.pages[i].text)}-${fmt.ratio.replace(':', 'x')}${number}.png`, blob });
  }
  return files;
}

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function setBusy(state) {
  busy = state;
  action('download').forEach((node) => {
    node.disabled = state;
    node.setAttribute('aria-busy', String(state));
  });
}

async function afterExport(pages) {
  const totals = await recordExport(pages);
  if (pages > 1) toast(t('toast.zip', { n: pages }));
  else toast(totals ? t('toast.downloaded', { n: formatNumber(totals.images) }) : t('toast.downloadedPlain'));
}

async function download() {
  if (busy) return;
  setBusy(true);
  try {
    const files = await exportFiles();
    if (files.length === 1) {
      saveBlob(files[0].blob, files[0].name);
    } else {
      const entries = await Promise.all(files.map(async (file) => ({ name: file.name, data: new Uint8Array(await file.blob.arrayBuffer()) })));
      saveBlob(new Blob([createZip(entries)], { type: 'application/zip' }), lang === 'en' ? 'cites-carousel.zip' : 'cites-carosello.zip');
    }
    burst();
    await afterExport(files.length);
  } catch (error) {
    console.error(error);
    toast(t('toast.error'));
  } finally {
    setBusy(false);
  }
}

let prepared = null;
async function prepareShare() {
  prepared = exportFiles().then((files) => files.map((file) => new File([file.blob], file.name, { type: 'image/png' })));
  return prepared;
}

async function share() {
  try {
    const files = await (prepared ?? prepareShare());
    prepared = null;
    if (navigator.canShare?.({ files })) {
      await navigator.share({ files, title: 'Cites' });
      await afterExport(files.length);
    } else {
      await copyLink();
    }
  } catch (error) {
    prepared = null;
    if (error?.name !== 'AbortError') await copyLink();
  }
}

async function copyLink() {
  const url = await shareUrl(doc, window.location.pathname);
  try {
    await navigator.clipboard.writeText(url);
    toast(t('toast.link'));
  } catch {
    toast(t('toast.linkFail', { url }), { timeout: 9000 });
  }
}

/** Piccolo scoppio di coriandoli di carta attorno al pulsante di download. */
function burst() {
  if (!hasGsap() || reduceMotion) return;
  const button = action('download')[0];
  if (!button) return;
  const rect = button.getBoundingClientRect();
  const colors = ['#d4f33c', '#0d0d0c', '#d9372a', '#f4f2ed'];
  for (let i = 0; i < 18; i += 1) {
    const bit = el('span', { class: 'pointer-events-none fixed z-[70] block rounded-[2px]', style: `left:${rect.left + rect.width / 2}px;top:${rect.top + rect.height / 2}px;width:${6 + Math.random() * 6}px;height:${4 + Math.random() * 5}px;background:${colors[i % colors.length]}` });
    document.body.append(bit);
    window.gsap.to(bit, {
      x: (Math.random() - 0.5) * 220,
      y: 40 + Math.random() * 160,
      rotation: (Math.random() - 0.5) * 540,
      autoAlpha: 0,
      duration: 1 + Math.random() * 0.6,
      ease: 'power2.out',
      onComplete: () => bit.remove(),
    });
  }
}

/* ---------- Eventi ---------- */

function flashPreview() {
  if (!hasGsap() || reduceMotion) return;
  window.gsap.fromTo(ui.frame, { scale: 0.975, autoAlpha: 0.65 }, { scale: 1, autoAlpha: 1, duration: 0.55, ease: 'expo.out' });
}

function selectTemplate(id) {
  if (id === doc.template) return;
  undoStack.push(doc);
  doc.template = id;
  doc.overrides = {};
  doc.pages.forEach((page) => (page.marks = null));
  commit({ sync: true });
  flashPreview();
}

function inspire() {
  const pool = quotesFor(lang).filter((quote) => smarten(quote.t) !== smarten(currentPage().text));
  const quote = pool[Math.floor(Math.random() * pool.length)];
  undoStack.push(doc);
  Object.assign(currentPage(), { text: quote.t, author: quote.a, work: quote.w, marks: null });
  commit({ sync: true, thumbnails: true });
  flashPreview();
}

function setActive(index) {
  active = Math.max(0, Math.min(doc.pages.length - 1, index));
  syncAll();
  requestRender();
  scheduleThumbnails(150);
  ui.indicator.textContent = t('page.of', { n: active + 1, total: doc.pages.length });
  if (doc.pages.length > 1) {
    ui.indicator.style.opacity = '1';
    clearTimeout(setActive.timer);
    setActive.timer = setTimeout(() => (ui.indicator.style.opacity = '0'), 1400);
  }
}

function undoRedo(kind) {
  const next = kind === 'undo' ? undoStack.undo(doc) : undoStack.redo(doc);
  if (!next) return;
  doc = sanitizeDoc(next);
  active = Math.min(active, doc.pages.length - 1);
  commit({ sync: true, thumbnails: true });
}

function bindEvents() {
  bindPointer();

  input('text').addEventListener('input', (event) => {
    beginEdit();
    const page = currentPage();
    const before = tokensOf(page.text);
    page.text = event.target.value.slice(0, 280);
    if (page.marks) page.marks = remapMarks(page.marks, before, tokensOf(page.text));
    updateCharCount();
    commit({ thumbnails: 450 });
    renderPagesList();
  });
  for (const name of ['author', 'work']) {
    input(name).addEventListener('input', (event) => {
      beginEdit();
      currentPage()[name] = event.target.value.slice(0, 80);
      commit({ thumbnails: 600 });
    });
  }
  input('handle').addEventListener('input', (event) => {
    beginEdit();
    doc.handle = event.target.value.slice(0, 40);
    commit({ thumbnails: 600 });
  });
  input('pageStart').addEventListener('input', (event) => {
    const value = Number.parseInt(event.target.value, 10);
    if (!Number.isFinite(value)) return;
    beginEdit();
    doc.pageStart = Math.min(999, Math.max(1, value));
    commit();
  });
  input('size').addEventListener('input', (event) => {
    beginEdit();
    const value = Number(event.target.value);
    if (value === 100) delete doc.overrides.size;
    else doc.overrides.size = value;
    commit();
  });
  input('showAuthor').addEventListener('change', (event) => {
    undoStack.push(doc);
    doc.showAuthor = event.target.checked;
    commit({ thumbnails: true });
  });
  for (const name of ['pageNumber', 'runningHead', 'arrow']) {
    input(name).addEventListener('change', (event) => setOverride(name, event.target.checked));
  }
  input('safe').addEventListener('change', (event) => {
    showSafe = event.target.checked;
    drawOverlay();
  });

  document.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target) return;
    const data = target.dataset;
    if (data.format) {
      if (data.format === doc.format) return;
      undoStack.push(doc);
      doc.format = data.format;
      syncAll();
      layoutStage();
      commit({ thumbnails: true });
      flashPreview();
    } else if (data.tool) {
      tool = data.tool;
      syncAll();
    } else if (data.swatch) {
      setOverride(tool === 'h' ? 'hl' : 'pen', data.swatch);
    } else if (data.templateCard) {
      selectTemplate(data.templateCard);
    } else if (data.family) {
      family = data.family;
      $$('[data-family-of]').forEach((item) => (item.hidden = family !== 'all' && item.dataset.familyOf !== family));
      syncAll();
      scheduleThumbnails(0);
    } else if (data.paper) {
      setOverride('paper', data.paper);
    } else if (data.font) {
      setOverride('font', data.font);
    } else if (data.ink) {
      setOverride('ink', data.ink);
    } else if (data.pen) {
      setOverride('pen', data.pen);
    } else if (data.align) {
      setOverride('align', data.align);
    } else if (data.quoteMode) {
      undoStack.push(doc);
      doc.quoteMarks = data.quoteMode;
      commit({ sync: true, thumbnails: true });
    } else if (data.scale) {
      exportScale = Number(data.scale);
      syncAll();
    } else if (data.pageIndex) {
      setActive(Number(data.pageIndex));
    } else if (data.removePage) {
      undoStack.push(doc);
      doc.pages.splice(Number(data.removePage), 1);
      setActive(Math.min(active, doc.pages.length - 1));
      commit({ sync: true });
    } else if (data.tab) {
      selectTab(data.tab);
    } else if (data.action) {
      runAction(data.action, target);
    }
  });

  action('share').forEach((button) => {
    if (typeof navigator.canShare === 'function') button.hidden = false;
    button.addEventListener('pointerdown', () => {
      if (!prepared) prepareShare();
    });
  });

  document.addEventListener('keydown', (event) => {
    const typing = event.target.closest('input, textarea');
    const mod = event.ctrlKey || event.metaKey;
    if (mod && !typing && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      undoRedo(event.shiftKey ? 'redo' : 'undo');
    } else if (mod && !typing && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      undoRedo('redo');
    }
  });

  const tabs = $$('[role="tab"]');
  tabs.forEach((tab, index) => {
    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      selectTab(next.dataset.tab);
      next.focus();
    });
  });
}

function selectTab(name) {
  $$('[role="tab"]').forEach((tab) => {
    const on = tab.dataset.tab === name;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
  });
  $$('[data-tabpanel]').forEach((panel) => {
    const on = panel.dataset.tabpanel === name;
    panel.hidden = !on;
    if (on && hasGsap() && !reduceMotion) window.gsap.from(panel.children, { y: 14, autoAlpha: 0, duration: 0.5, stagger: 0.03, ease: 'expo.out' });
  });
  if (name === 'templates') scheduleThumbnails(0);
}

function runAction(name) {
  switch (name) {
    case 'download':
      download();
      break;
    case 'share':
      share();
      break;
    case 'copy-link':
      copyLink();
      break;
    case 'inspire':
      inspire();
      break;
    case 'undo':
    case 'redo':
      undoRedo(name);
      break;
    case 'auto-marks':
      undoStack.push(doc);
      currentPage().marks = null;
      commit();
      break;
    case 'clear-marks':
      undoStack.push(doc);
      currentPage().marks = {};
      commit();
      break;
    case 'reroll':
      undoStack.push(doc);
      doc.seed = randomSeed();
      commit({ thumbnails: true });
      flashPreview();
      break;
    case 'reset-template':
      undoStack.push(doc);
      doc.overrides = {};
      doc.pages.forEach((page) => (page.marks = null));
      commit({ sync: true });
      flashPreview();
      break;
    case 'add-page': {
      if (doc.pages.length >= MAX_PAGES) {
        toast(t('toast.maxPages'));
        break;
      }
      undoStack.push(doc);
      const page = currentPage();
      doc.pages.push({ text: '', author: page.author, work: page.work, marks: null });
      setActive(doc.pages.length - 1);
      commit({ sync: true });
      input('text').focus();
      break;
    }
    case 'phone':
      phone = !phone;
      syncAll();
      layoutStage();
      requestRender();
      if (hasGsap() && !reduceMotion) window.gsap.from(ui.device, { scale: 0.94, autoAlpha: 0.4, duration: 0.6, ease: 'expo.out' });
      break;
    default:
      break;
  }
}

start();
