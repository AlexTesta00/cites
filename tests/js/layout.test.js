import { test } from 'node:test';
import assert from 'node:assert/strict';
import { balancedBreak, fitText, greedyBreak, placeLines } from '../../public/assets/js/engine/layout.js';

// Misura finta: ogni carattere è largo 50 unità a corpo 100.
const words = (text) => text.split(' ').map((word, index) => ({ index, text: word, w: word.length * 50 }));
const SPACE = 25;

test('balancedBreak: stesse righe del metodo avido ma più regolari', () => {
  const widths = words('nel mezzo del cammin di nostra vita mi ritrovai').map((w) => w.w);
  const greedy = greedyBreak(widths, SPACE, () => 1400);
  const balanced = balancedBreak(widths, SPACE, 1400);
  assert.equal(balanced.length, greedy.length);
  const spread = (lines) => {
    const lengths = lines.map((line) => line.reduce((sum, i, k) => sum + widths[i] + (k ? SPACE : 0), 0));
    return Math.max(...lengths) - Math.min(...lengths);
  };
  assert.ok(spread(balanced) <= spread(greedy));
});

test('fitText: il testo resta dentro al riquadro', () => {
  const box = { x: 100, y: 100, w: 800, h: 600 };
  const layout = fitText({ paragraphs: [words('L’unica gioia al mondo è cominciare.')], space: SPACE, box, lineHeight: 1.4, minSize: 10, maxSize: 200 });
  assert.ok(layout.widest <= box.w + 0.5);
  assert.ok(layout.height <= box.h + 0.5);
  assert.ok(layout.size > 10);
});

test('fitText: un testo lungo rimpicciolisce il corpo', () => {
  const box = { x: 0, y: 0, w: 800, h: 600 };
  const short = fitText({ paragraphs: [words('Carpe diem.')], space: SPACE, box, lineHeight: 1.4, minSize: 10, maxSize: 120 });
  const long = fitText({ paragraphs: [words('It is a truth universally acknowledged that a single man in possession of a good fortune must be in want of a wife')], space: SPACE, box, lineHeight: 1.4, minSize: 10, maxSize: 120 });
  assert.ok(long.size < short.size);
});

test('placeLines: centratura orizzontale', () => {
  const box = { x: 0, y: 0, w: 1000, h: 1000 };
  const layout = fitText({ paragraphs: [words('ciao')], space: SPACE, box, lineHeight: 1.4, minSize: 10, maxSize: 100 });
  placeLines(layout, { box, align: 'center', valign: 'center', lineHeight: 1.4, space: SPACE });
  const line = layout.lines[0];
  assert.ok(Math.abs(line.x + line.width / 2 - 500) < 1);
});

test('fitText: le righe vuote separano le strofe', () => {
  const box = { x: 0, y: 0, w: 1000, h: 1000 };
  const one = fitText({ paragraphs: [words('a b'), words('c d')], space: SPACE, box, lineHeight: 1.4, minSize: 10, maxSize: 50 });
  const gap = fitText({ paragraphs: [words('a b'), [], words('c d')], space: SPACE, box, lineHeight: 1.4, minSize: 10, maxSize: 50 });
  assert.ok(gap.height > one.height);
});
