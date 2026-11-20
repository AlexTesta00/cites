// Stato del documento con annulla/ripeti e salvataggio nel browser.

import { randomSeed } from '../engine/random.js';
import { getTemplate } from '../engine/templates.js';

export const MAX_PAGES = 10;
const STORAGE_KEY = 'cites:doc:v1';

export function createDoc({ text = '', author = '', work = '' } = {}) {
  return {
    v: 1,
    template: 'classico',
    format: 'post',
    seed: randomSeed(),
    quoteMarks: 'none',
    showAuthor: true,
    handle: '',
    pageStart: 124,
    overrides: {},
    pages: [{ text, author, work, marks: null }],
  };
}

/** Accetta solo valori noti: protegge da link o salvataggi manomessi. */
export function sanitizeDoc(input) {
  const base = createDoc();
  if (!input || typeof input !== 'object') return base;
  const str = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');
  const doc = { ...base };
  doc.template = getTemplate(input.template).id;
  doc.format = typeof input.format === 'string' ? input.format : base.format;
  doc.seed = Number.isFinite(input.seed) ? Math.abs(Math.floor(input.seed)) % 1_000_000 : base.seed;
  doc.quoteMarks = ['none', 'curly', 'guillemets'].includes(input.quoteMarks) ? input.quoteMarks : 'none';
  doc.showAuthor = input.showAuthor !== false;
  doc.handle = str(input.handle, 40);
  doc.pageStart = Number.isFinite(input.pageStart) ? Math.min(999, Math.max(1, Math.floor(input.pageStart))) : base.pageStart;
  const overrides = input.overrides && typeof input.overrides === 'object' ? input.overrides : {};
  doc.overrides = {};
  for (const key of ['paper', 'font', 'ink', 'pen', 'hl', 'align']) {
    if (typeof overrides[key] === 'string') doc.overrides[key] = overrides[key].slice(0, 20);
  }
  if (Number.isFinite(overrides.size)) doc.overrides.size = Math.min(140, Math.max(60, overrides.size));
  for (const key of ['pageNumber', 'runningHead', 'arrow']) {
    if (typeof overrides[key] === 'boolean') doc.overrides[key] = overrides[key];
  }
  const pages = Array.isArray(input.pages) ? input.pages.slice(0, MAX_PAGES) : [];
  doc.pages = pages.length
    ? pages.map((page) => ({
        text: str(page?.text, 280),
        author: str(page?.author, 80),
        work: str(page?.work, 80),
        marks: sanitizeMarks(page?.marks),
      }))
    : base.pages;
  return doc;
}

function sanitizeMarks(marks) {
  if (!marks || typeof marks !== 'object') return null;
  const clean = {};
  for (const [key, value] of Object.entries(marks)) {
    const index = Number(key);
    if (Number.isInteger(index) && index >= 0 && index < 400 && typeof value === 'string' && /^[hucd]{1,3}$/.test(value)) clean[index] = value;
  }
  return clean;
}

export function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeDoc(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

let saveTimer = 0;
export function save(doc) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    } catch {
      /* memoria piena o bloccata: pazienza */
    }
  }, 250);
}

/** Cronologia semplice: istantanee serializzate. */
export class History {
  constructor(limit = 60) {
    this.limit = limit;
    this.past = [];
    this.future = [];
  }

  push(doc) {
    const snapshot = JSON.stringify(doc);
    if (this.past[this.past.length - 1] === snapshot) return;
    this.past.push(snapshot);
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
  }

  undo(current) {
    if (!this.past.length) return null;
    this.future.push(JSON.stringify(current));
    return JSON.parse(this.past.pop());
  }

  redo(current) {
    if (!this.future.length) return null;
    this.past.push(JSON.stringify(current));
    return JSON.parse(this.future.pop());
  }

  get canUndo() {
    return this.past.length > 0;
  }

  get canRedo() {
    return this.future.length > 0;
  }
}
