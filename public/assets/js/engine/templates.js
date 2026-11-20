// Catalogo dei template. Ogni template è un insieme di scelte (superficie, carta, carattere,
// impaginazione, segni, dettagli) che l'utente può poi cambiare in "Personalizza".

export const FAMILIES = [
  { id: 'book', name: { it: 'Pagine di libro', en: 'Book pages' } },
  { id: 'special', name: { it: 'Carte speciali', en: 'Special papers' } },
  { id: 'notebook', name: { it: 'Quaderni', en: 'Notebooks' } },
  { id: 'archive', name: { it: 'Archivio', en: 'Archive' } },
  { id: 'desk', name: { it: 'Scrivania', en: 'On the desk' } },
  { id: 'minimal', name: { it: 'Minimal', en: 'Minimal' } },
];

const DEFAULTS = {
  surface: 'page',
  paper: 'gray',
  desk: null,
  shape: null,
  rotate: 0,
  light: 'soft',
  ruling: null,
  margin: false,
  font: 'garamond',
  italic: false,
  weight: null,
  upper: false,
  ink: 'black',
  align: 'center',
  valign: 'center',
  layout: 'block',
  size: 1,
  lineHeight: null,
  marks: 'none',
  hl: 'lime',
  pen: 'red',
  author: 'dash',
  pageNumber: false,
  runningHead: false,
  gutter: true,
  ghost: null,
  decor: [],
  sample: 0,
};

const T = (id, family, name, options) => ({ ...DEFAULTS, ...options, id, family, name, decor: options.decor ?? [] });

export const TEMPLATES = [
  // Pagine di libro
  T('classico', 'book', { it: 'Classico', en: 'Classic' }, { paper: 'gray', marks: 'all', hl: 'lime', pageNumber: true, sample: 0 }),
  T('giallo', 'book', { it: 'Evidenziatore giallo', en: 'Yellow marker' }, { paper: 'white', marks: 'all+u', hl: 'yellow', pen: 'red', sample: 1 }),
  T('penna-rossa', 'book', { it: 'Penna rossa', en: 'Red pen' }, { paper: 'ivory', marks: 'key-u', pen: 'red', sample: 2 }),
  T('matita', 'book', { it: 'Matita', en: 'Pencil' }, { paper: 'ivory', italic: true, align: 'left', marks: 'key-u', pen: 'pencil', author: 'note', decor: ['pencilLine'], sample: 3 }),
  T('corsivo', 'book', { it: 'Corsivo', en: 'Italic' }, { paper: 'white', font: 'cormorant', italic: true, size: 1.1, author: 'caps', light: 'flat', sample: 13 }),
  T('tascabile', 'book', { it: 'Tascabile', en: 'Paperback' }, { paper: 'thin', font: 'baskerville', align: 'justify', size: 0.72, marks: 'tail-h', hl: 'yellow', runningHead: true, pageNumber: true, sample: 4 }),
  T('capitolo', 'book', { it: 'Inizio capitolo', en: 'Chapter opening' }, { paper: 'ivory', layout: 'chapter', align: 'left', pageNumber: true, sample: 5 }),
  T('poesia', 'book', { it: 'Poesia', en: 'Poem' }, { paper: 'white', layout: 'poem', italic: true, author: 'right', light: 'flat', sample: 16 }),
  T('libro-aperto', 'book', { it: 'Libro aperto', en: 'Open book' }, { surface: 'spread', paper: 'ivory', size: 0.9, marks: 'key-h', hl: 'yellow', pageNumber: true, sample: 17 }),
  T('orecchia', 'book', { it: 'Orecchia', en: 'Dog-ear' }, { paper: 'gray', marks: 'all', hl: 'lime', size: 1.1, decor: ['dogear'], sample: 14 }),
  T('ingiallito', 'book', { it: 'Ingiallito', en: 'Aged' }, { paper: 'aged', ink: 'sepia', marks: 'key-d', pen: 'brown', light: 'warm', author: 'caps', sample: 7 }),
  T('penombra', 'book', { it: 'Penombra', en: 'Low light' }, { paper: 'gray', light: 'dim', sample: 12 }),

  // Carte speciali
  T('kraft', 'special', { it: 'Kraft', en: 'Kraft' }, { paper: 'kraft', marks: 'all', hl: 'lime', gutter: false, sample: 8 }),
  T('pergamena', 'special', { it: 'Pergamena', en: 'Parchment' }, { paper: 'parchment', font: 'aurore', ink: 'brown', light: 'warm', author: 'sign', gutter: false, sample: 9 }),
  T('carta-nera', 'special', { it: 'Carta nera', en: 'Black paper' }, { paper: 'black', font: 'caveat', ink: 'white', marks: 'key-u', pen: 'lime', light: 'flat', author: 'hand', gutter: false, sample: 1 }),
  T('cotone', 'special', { it: 'Carta di cotone', en: 'Cotton paper' }, { surface: 'object', desk: 'linen', shape: 'cotton', paper: 'cotton', rotate: -1, font: 'cormorant', size: 1.05, author: 'caps', decor: ['letterpress'], sample: 11 }),
  T('lettera-azzurra', 'special', { it: 'Lettera azzurra', en: 'Blue letter' }, { paper: 'blue', font: 'homemade', ink: 'blue', align: 'left', author: 'sign', light: 'flat', gutter: false, decor: ['folds'], sample: 15 }),
  T('giornale', 'special', { it: 'Ritaglio di giornale', en: 'Newspaper clipping' }, { surface: 'object', desk: 'dark', shape: 'clipping', paper: 'news', rotate: -3, font: 'baskerville', weight: 700, upper: true, size: 0.9, lineHeight: 1.18, author: 'caps', decor: ['columns'], sample: 10 }),

  // Quaderni
  T('righe', 'notebook', { it: 'Quaderno a righe', en: 'Ruled notebook' }, { paper: 'notebook', ruling: 'lines', margin: true, font: 'caveat', ink: 'blue', align: 'left', layout: 'lines', author: 'hand', pen: 'red', light: 'flat', gutter: false, sample: 0 }),
  T('quadretti', 'notebook', { it: 'Quadretti', en: 'Grid paper' }, { paper: 'notebook', ruling: 'grid', font: 'nothing', ink: 'graphite', marks: 'key-c', pen: 'red', author: 'hand', light: 'flat', gutter: false, sample: 2 }),
  T('taccuino', 'notebook', { it: 'Taccuino a puntini', en: 'Dot journal' }, { paper: 'cream', ruling: 'dots', font: 'caveat', marks: 'key-u', pen: 'black', author: 'hand', light: 'flat', gutter: false, sample: 18 }),
  T('diario', 'notebook', { it: 'Diario', en: 'Diary' }, { paper: 'cream', ruling: 'diary', font: 'homemade', ink: 'graphite', align: 'left', layout: 'lines', author: 'sign', light: 'flat', gutter: false, decor: ['date'], sample: 3 }),
  T('post-it', 'notebook', { it: 'Post-it sul libro', en: 'Sticky note' }, { surface: 'object', desk: 'page', shape: 'sticky', paper: 'sticky', rotate: 4, font: 'caveat', size: 1.05, author: 'hand', sample: 19 }),
  T('cartoncino', 'notebook', { it: 'Cartoncino', en: 'Index card' }, { surface: 'object', desk: 'kraft', shape: 'card', paper: 'card', rotate: -2, ruling: 'index', font: 'typewriter', align: 'left', valign: 'top', author: 'typed', sample: 4 }),

  // Archivio
  T('dattiloscritto', 'archive', { it: 'Dattiloscritto', en: 'Typescript' }, { paper: 'cream', font: 'typewriter', align: 'left', author: 'typed', light: 'flat', sample: 6 }),
  T('biblioteca', 'archive', { it: 'Scheda di biblioteca', en: 'Library card' }, { surface: 'object', desk: 'wood', shape: 'libcard', paper: 'libcard', rotate: 2, font: 'typewriter', size: 0.85, align: 'left', valign: 'top', author: 'typed', light: 'warm', decor: ['libcard'], sample: 7 }),
  T('cartolina', 'archive', { it: 'Cartolina', en: 'Postcard' }, { surface: 'object', desk: 'green', shape: 'postcard', paper: 'postcard', rotate: -3, font: 'caveat', ink: 'blue', align: 'left', author: 'hand', decor: ['postcard'], sample: 9 }),
  T('ex-libris', 'archive', { it: 'Ex libris', en: 'Ex libris' }, { paper: 'ivory', decor: ['stamp'], sample: 5 }),

  // Scrivania
  T('nastro', 'desk', { it: 'Nastro adesivo', en: 'Taped' }, { surface: 'object', desk: 'kraft', shape: 'sheet', paper: 'white', rotate: -2, marks: 'key-h', hl: 'yellow', decor: ['tape'], sample: 14 }),
  T('graffetta', 'desk', { it: 'Graffetta', en: 'Paper clip' }, { paper: 'gray', marks: 'all', hl: 'yellow', decor: ['clip'], sample: 4 }),
  T('caffe', 'desk', { it: 'Macchia di caffè', en: 'Coffee stain' }, { paper: 'ivory', marks: 'key-u', pen: 'black', decor: ['coffee'], sample: 11 }),
  T('strappata', 'desk', { it: 'Pagina strappata', en: 'Torn page' }, { surface: 'object', desk: 'dark', shape: 'torn', paper: 'white', sample: 2 }),
  T('segnalibro', 'desk', { it: 'Segnalibro', en: 'Bookmark' }, { surface: 'object', desk: 'page', shape: 'bookmark', paper: 'cream', font: 'cormorant', italic: true, size: 0.9, author: 'caps', decor: ['hole'], sample: 14 }),
  T('lampada', 'desk', { it: 'Luce di lampada', en: 'Lamp light' }, { paper: 'gray', light: 'lamp', sample: 12 }),

  // Minimal
  T('minimal', 'minimal', { it: 'Solo testo', en: 'Text only' }, { paper: 'white', size: 0.55, light: 'flat', sample: 2 }),
  T('una-parola', 'minimal', { it: 'Una parola', en: 'One word' }, { paper: 'gray', layout: 'word', marks: 'all', hl: 'lime', sample: -1 }),
  T('grande', 'minimal', { it: 'Grande', en: 'Big type' }, { paper: 'ivory', layout: 'big', align: 'left', valign: 'bottom', lineHeight: 1.02, pageNumber: true, sample: 6 }),
  T('epigrafe', 'minimal', { it: 'Epigrafe', en: 'Epigraph' }, { paper: 'white', layout: 'epigraph', italic: true, align: 'right', valign: 'top', author: 'caps', light: 'flat', sample: 16 }),
];

export const TEMPLATE_BY_ID = Object.fromEntries(TEMPLATES.map((template) => [template.id, template]));

export function getTemplate(id) {
  return TEMPLATE_BY_ID[id] ?? TEMPLATE_BY_ID.classico;
}

export function templateName(template, lang) {
  return template.name[lang] ?? template.name.it;
}
