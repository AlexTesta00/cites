import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inflateRawSync } from 'node:zlib';
import { decodeDoc, encodeDoc } from '../../public/assets/js/editor/share.js';
import { createDoc, sanitizeDoc } from '../../public/assets/js/editor/state.js';

const sample = () => {
  const doc = createDoc({ text: 'L’unica gioia al mondo è cominciare.', author: 'Cesare Pavese', work: 'Il mestiere di vivere' });
  doc.template = 'righe';
  doc.format = 'story';
  doc.overrides = { font: 'caveat', size: 120 };
  doc.pages[0].marks = { 5: 'hu' };
  doc.pages.push({ text: 'Seconda pagina', author: '', work: '', marks: null });
  return doc;
};

test('encodeDoc/decodeDoc: andata e ritorno senza perdite', async () => {
  const doc = sample();
  const code = await encodeDoc(doc);
  assert.match(code, /^[zj][A-Za-z0-9_-]+$/);
  const back = sanitizeDoc(await decodeDoc(code));
  assert.equal(back.template, 'righe');
  assert.equal(back.format, 'story');
  assert.equal(back.pages.length, 2);
  assert.deepEqual(back.pages[0].marks, { 5: 'hu' });
  assert.equal(back.overrides.font, 'caveat');
  assert.equal(back.seed, doc.seed);
});

test('encodeDoc: formato compatibile con gzinflate di PHP (deflate grezzo)', async () => {
  const code = await encodeDoc(sample());
  assert.equal(code[0], 'z');
  const bytes = Buffer.from(code.slice(1).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  const json = JSON.parse(inflateRawSync(bytes).toString('utf8'));
  assert.equal(json.p[0].t, 'L’unica gioia al mondo è cominciare.');
});

test('decodeDoc: rifiuta dati non validi', async () => {
  assert.equal(await decodeDoc(''), null);
  assert.equal(await decodeDoc('x123'), null);
  assert.equal(await decodeDoc('zzzz'), null);
});

test('sanitizeDoc: scarta valori sconosciuti o fuori misura', () => {
  const doc = sanitizeDoc({
    template: 'non-esiste',
    seed: -5,
    quoteMarks: '<script>',
    pageStart: 5000,
    overrides: { size: 999, paper: 42, pageNumber: 'sì' },
    pages: [{ text: 'x'.repeat(500), marks: { 1: 'h', 2: 'zz', '-1': 'u', 3: 7 } }],
  });
  assert.equal(doc.template, 'classico');
  assert.equal(doc.seed, 5);
  assert.equal(doc.quoteMarks, 'none');
  assert.equal(doc.pageStart, 999);
  assert.deepEqual(doc.overrides, { size: 140 });
  assert.equal(doc.pages[0].text.length, 280);
  assert.deepEqual(doc.pages[0].marks, { 1: 'h' });
});
