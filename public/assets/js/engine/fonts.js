// Caratteri disponibili nei template. I file sono dichiarati in /assets/css/fonts.css
// e vengono scaricati solo quando servono (document.fonts.load).

export const FONTS = {
  garamond: { family: 'EB Garamond', kind: 'book', weight: 500, italic: true, scale: 1, lh: 1.42, label: 'Garamond' },
  cormorant: { family: 'Cormorant Garamond', kind: 'book', weight: 500, italic: true, scale: 1.14, lh: 1.3, label: 'Cormorant' },
  baskerville: { family: 'Libre Baskerville', kind: 'book', weight: 400, italic: true, bold: 700, scale: 0.84, lh: 1.55, label: 'Baskerville' },
  crimson: { family: 'Crimson Pro', kind: 'book', weight: 400, italic: true, scale: 1.04, lh: 1.4, label: 'Crimson' },
  caveat: { family: 'Caveat', kind: 'hand', weight: 500, scale: 1.28, lh: 1.1, label: 'Caveat' },
  homemade: { family: 'Homemade Apple', kind: 'hand', weight: 400, scale: 0.74, lh: 1.62, label: 'Homemade' },
  nothing: { family: 'Nothing You Could Do', kind: 'hand', weight: 400, scale: 0.9, lh: 1.45, label: { it: 'Spontaneo', en: 'Casual' } },
  aurore: { family: 'La Belle Aurore', kind: 'hand', weight: 400, scale: 1, lh: 1.42, label: 'Aurore' },
  typewriter: { family: 'Special Elite', kind: 'type', weight: 400, scale: 0.86, lh: 1.5, label: { it: 'Macchina', en: 'Typewriter' } },
};

export const FONT_ORDER = ['garamond', 'cormorant', 'baskerville', 'crimson', 'caveat', 'homemade', 'nothing', 'aurore', 'typewriter'];

export function getFont(id) {
  return FONTS[id] ?? FONTS.garamond;
}

export function fontLabel(id, lang) {
  const label = getFont(id).label;
  return typeof label === 'string' ? label : label[lang] ?? label.it;
}

export function fontString(font, size, { italic = false, weight = font.weight } = {}) {
  const style = italic && font.italic ? 'italic ' : '';
  return `${style}${weight} ${Math.max(1, size).toFixed(2)}px "${font.family}"`;
}

const SAMPLE = 'AaÈéàòù’“”«»—…';
const loading = new Map();

/** Carica (una volta sola) le varianti di carattere indicate. */
export function loadFont(font, { italic = false, weight = font.weight } = {}) {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  const spec = fontString(font, 40, { italic, weight });
  if (!loading.has(spec)) {
    loading.set(
      spec,
      document.fonts.load(spec, SAMPLE).catch(() => []),
    );
  }
  return loading.get(spec);
}

export function loadFonts(list) {
  return Promise.all(list.map(([font, options]) => loadFont(font, options)));
}
