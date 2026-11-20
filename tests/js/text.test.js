import { test } from 'node:test';
import assert from 'node:assert/strict';
import { autoMarks, displayWords, keyWordIndices, remapMarks, smarten, tokenize } from '../../public/assets/js/engine/text.js';

test('smarten: virgolette, apostrofi, puntini e trattini tipografici', () => {
  assert.equal(smarten('"Ciao" disse l\'uomo...'), '“Ciao” disse l’uomo…');
  assert.equal(smarten("It's 'fine' -- really"), 'It’s ‘fine’ — really');
  assert.equal(smarten('  spazi   doppi  \n\n\n\nriga  '), 'spazi doppi\n\nriga');
});

test('tokenize: righe, parole e indici progressivi', () => {
  const { lines, tokens } = tokenize('Odi et amo.\nQuare id faciam');
  assert.equal(lines.length, 2);
  assert.deepEqual(lines[0].map((t) => t.text), ['Odi', 'et', 'amo.']);
  assert.deepEqual(tokens.map((t) => t.index), [0, 1, 2, 3, 4, 5]);
  assert.equal(tokens[3].line, 1);
});

test('displayWords: aggiunge le virgolette una sola volta', () => {
  const { tokens } = tokenize('La vita non conclude.');
  assert.deepEqual(displayWords(tokens, 'guillemets'), ['«La', 'vita', 'non', 'conclude.»']);
  assert.deepEqual(displayWords(tokens, 'curly').at(-1), 'conclude.”');
  assert.deepEqual(displayWords(tokens, 'none'), ['La', 'vita', 'non', 'conclude.']);
  const quoted = tokenize('“Già tra virgolette.”').tokens;
  assert.deepEqual(displayWords(quoted, 'curly'), ['“Già', 'tra', 'virgolette.”']);
  assert.deepEqual(displayWords(tokenize('Cominciare.').tokens, 'guillemets'), ['«Cominciare.»']);
});

test('keyWordIndices: sceglie la parola significativa verso la fine', () => {
  const cases = [
    ['L’unica gioia al mondo è cominciare.', 'cominciare.'],
    ['E quindi uscimmo a riveder le stelle.', 'stelle.'],
    ['Hope is the thing with feathers', 'feathers'],
    ['La vita non conclude.', 'conclude.'],
  ];
  for (const [text, expected] of cases) {
    const { tokens } = tokenize(smarten(text));
    const [index] = keyWordIndices(tokens, 1);
    assert.equal(tokens[index].text, expected, text);
  }
});

test('autoMarks: strategie dei template', () => {
  const { tokens } = tokenize('L’unica gioia al mondo è cominciare.');
  assert.equal(Object.keys(autoMarks(tokens, 'all')).length, tokens.length);
  assert.deepEqual(autoMarks(tokens, 'key-u'), { 5: 'u' });
  assert.equal(autoMarks(tokens, 'all+u')[5], 'hu');
  assert.deepEqual(autoMarks(tokens, 'none'), {});
  assert.deepEqual(autoMarks([], 'all'), {});
});

test('remapMarks: conserva i segni sulle parole rimaste', () => {
  const before = tokenize('La vita non conclude.').tokens;
  const after = tokenize('Davvero la vita non conclude.').tokens;
  assert.deepEqual(remapMarks({ 1: 'h', 3: 'u' }, before, after), { 2: 'h', 4: 'u' });
  assert.equal(remapMarks(null, before, after), null);
});
