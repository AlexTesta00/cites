// Formati di esportazione. Le zone sicure delle storie sono le parti coperte
// dall'interfaccia di Instagram (in alto il profilo, in basso la barra delle risposte).

export const FORMATS = [
  { id: 'story', ratio: '9:16', w: 1080, h: 1920, name: { it: 'Storia', en: 'Story' }, safe: { top: 250, bottom: 340 } },
  { id: 'post', ratio: '4:5', w: 1080, h: 1350, name: { it: 'Post', en: 'Post' } },
  { id: 'grid', ratio: '3:4', w: 1080, h: 1440, name: { it: 'Griglia', en: 'Grid' } },
  { id: 'square', ratio: '1:1', w: 1080, h: 1080, name: { it: 'Quadrato', en: 'Square' } },
  { id: 'pin', ratio: '2:3', w: 1000, h: 1500, name: { it: 'Pinterest', en: 'Pinterest' } },
  { id: 'wide', ratio: '16:9', w: 1920, h: 1080, name: { it: 'Orizzontale', en: 'Landscape' } },
];

export const FORMAT_BY_ID = Object.fromEntries(FORMATS.map((format) => [format.id, format]));

export function getFormat(id) {
  return FORMAT_BY_ID[id] ?? FORMAT_BY_ID.post;
}
