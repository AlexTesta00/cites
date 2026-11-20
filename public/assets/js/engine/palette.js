// Colori di evidenziatori, penne e inchiostri; carte e scrivanie.

export const HIGHLIGHTERS = {
  lime: { color: '#DCEF3F', name: { it: 'Lime', en: 'Lime' } },
  yellow: { color: '#FFE14A', name: { it: 'Giallo', en: 'Yellow' } },
  pink: { color: '#FF9DC0', name: { it: 'Rosa', en: 'Pink' } },
  blue: { color: '#93D4FF', name: { it: 'Azzurro', en: 'Blue' } },
  orange: { color: '#FFB65C', name: { it: 'Arancio', en: 'Orange' } },
  green: { color: '#A7E6A1', name: { it: 'Verde', en: 'Green' } },
};

export const PENS = {
  red: { color: '#C9302C', name: { it: 'Rossa', en: 'Red' } },
  blue: { color: '#24409E', name: { it: 'Blu', en: 'Blue' } },
  black: { color: '#1C1B19', name: { it: 'Nera', en: 'Black' } },
  pencil: { color: '#5E5B57', name: { it: 'Matita', en: 'Pencil' }, pencil: true },
  brown: { color: '#6B4A2A', name: { it: 'Seppia', en: 'Sepia' } },
  lime: { color: '#DCEF3F', name: { it: 'Lime', en: 'Lime' } },
};

export const INKS = {
  black: { color: '#151412', name: { it: 'Nero', en: 'Black' } },
  sepia: { color: '#3B2A18', name: { it: 'Seppia', en: 'Sepia' } },
  blue: { color: '#22357A', name: { it: 'Blu', en: 'Blue' } },
  graphite: { color: '#3A3836', name: { it: 'Grafite', en: 'Graphite' } },
  brown: { color: '#4A2E14', name: { it: 'Bruno', en: 'Brown' } },
  white: { color: '#F2EEE6', name: { it: 'Bianco', en: 'White' } },
};

/*
 * Carte: base al centro, edge ai bordi; grain = grana, fiber = fibre, mottle = macchie morbide,
 * ghost = testo della pagina dietro che traspare, specks = puntini (carta riciclata), foxing = macchie del tempo.
 */
export const PAPERS = {
  gray: { base: '#E8E4DB', edge: '#D2CDC1', grain: 0.11, fiber: 0.35, mottle: 0.05, ghost: 0.075, name: { it: 'Grigia', en: 'Gray' } },
  ivory: { base: '#F3EDE0', edge: '#E1D7C3', grain: 0.09, fiber: 0.3, mottle: 0.045, ghost: 0.06, name: { it: 'Avorio', en: 'Ivory' } },
  white: { base: '#F9F7F2', edge: '#ECE8DF', grain: 0.07, fiber: 0.25, mottle: 0.03, ghost: 0.05, name: { it: 'Bianca', en: 'White' } },
  thin: { base: '#F0ECE2', edge: '#DCD5C6', grain: 0.08, fiber: 0.3, mottle: 0.04, ghost: 0.14, name: { it: 'Sottile', en: 'Thin' } },
  aged: { base: '#EEDFB9', edge: '#C49E60', grain: 0.12, fiber: 0.35, mottle: 0.1, ghost: 0.07, foxing: 1, name: { it: 'Ingiallita', en: 'Aged' } },
  kraft: { base: '#D4CDBD', edge: '#BCB4A2', grain: 0.15, fiber: 0.9, mottle: 0.06, ghost: 0.08, specks: 1, name: { it: 'Kraft', en: 'Kraft' } },
  parchment: { base: '#EEDCB0', edge: '#A97C3E', grain: 0.13, fiber: 0.2, mottle: 0.16, ghost: 0, burnt: 1, name: { it: 'Pergamena', en: 'Parchment' } },
  black: { base: '#1A1917', edge: '#0E0D0C', grain: 0.12, fiber: 0.25, mottle: 0.05, ghost: 0, dark: true, name: { it: 'Nera', en: 'Black' } },
  cotton: { base: '#FCFBF8', edge: '#EFECE5', grain: 0.07, fiber: 0.55, mottle: 0.02, ghost: 0, name: { it: 'Cotone', en: 'Cotton' } },
  blue: { base: '#DDE7F0', edge: '#C6D2DE', grain: 0.07, fiber: 0.2, mottle: 0.03, ghost: 0, name: { it: 'Azzurra', en: 'Blue' } },
  cream: { base: '#F6F0E3', edge: '#E8DEC9', grain: 0.07, fiber: 0.25, mottle: 0.03, ghost: 0, name: { it: 'Crema', en: 'Cream' } },
  notebook: { base: '#FBFBF7', edge: '#EEEDE6', grain: 0.05, fiber: 0.15, mottle: 0.02, ghost: 0, name: { it: 'Quaderno', en: 'Notebook' } },
  news: { base: '#E4E0D4', edge: '#CFC9BA', grain: 0.13, fiber: 0.4, mottle: 0.05, ghost: 0, name: { it: 'Giornale', en: 'Newsprint' } },
  sticky: { base: '#FCE77F', edge: '#F2D75C', grain: 0.05, fiber: 0.1, mottle: 0.03, ghost: 0, name: { it: 'Post-it', en: 'Sticky note' } },
  card: { base: '#FFFFFF', edge: '#F1F0EC', grain: 0.05, fiber: 0.2, mottle: 0.02, ghost: 0, name: { it: 'Cartoncino', en: 'Card' } },
  libcard: { base: '#EADBB8', edge: '#D3BF92', grain: 0.11, fiber: 0.45, mottle: 0.06, ghost: 0, name: { it: 'Scheda', en: 'Library card' } },
  postcard: { base: '#F5EFE0', edge: '#E4D9C2', grain: 0.08, fiber: 0.35, mottle: 0.04, ghost: 0, name: { it: 'Cartolina', en: 'Postcard' } },
  rose: { base: '#F4E3DF', edge: '#E4CBC4', grain: 0.07, fiber: 0.2, mottle: 0.03, ghost: 0.04, name: { it: 'Rosa antico', en: 'Old rose' } },
};

/** Carte proposte nel pannello "Personalizza". */
export const PAPER_CHOICES = ['gray', 'ivory', 'white', 'thin', 'aged', 'kraft', 'parchment', 'black', 'cotton', 'blue', 'cream', 'rose'];

export const DESKS = {
  kraft: { base: '#C8A97E', edge: '#A88A60', grain: 0.17, fiber: 0.9, mottle: 0.07, specks: 1 },
  wood: { base: '#7C5B3D', edge: '#4E3824', grain: 0.12, wood: true },
  dark: { base: '#22211F', edge: '#121110', grain: 0.12, fiber: 0.15, mottle: 0.04 },
  green: { base: '#33403A', edge: '#1D2622', grain: 0.12, fiber: 0.2, mottle: 0.05 },
  linen: { base: '#D9D3C7', edge: '#BDB6A8', grain: 0.14, fiber: 0.6, mottle: 0.05, linen: true },
};

export function colorOf(table, key, fallback) {
  return (table[key] ?? table[fallback]).color;
}

/** "#rrggbb" -> [r, g, b] */
export function rgb(hex) {
  const value = String(hex).replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value.slice(0, 6);
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex, alpha) {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function luminance(hex) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
