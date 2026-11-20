// Testo della citazione: tipografia (virgolette, apostrofi, trattini), parole e parole chiave.

const STOPWORDS = new Set(
  (
    // italiano
    'a ad al allo ai agli all alla alle anche ancora che chi ci cio ciò come con contro cui da dal dallo dai dagli dall dalla dalle de dei del dell della delle dello degli di dove e è ed era erano essere fa fra gli ha hai hanno ho i il in io la le lei li lo loro lui ma me mi mia mie miei mio ne nei nel nell nella nelle nello negli noi non nostra nostro o per perché però più poi può quale quando quanto quel quella quelle quelli quello questa queste questi questo quindi se sei si sia siamo siete sono su sua sue sui sul sull sulla sulle suo suoi te ti tra tu tua tue tuo tuoi tutto tutti un una uno vi voi c l m n s t d v sempre ogni mai già solo così cosa tanto molto nulla niente ' +
    // inglese
    'a about all am an and any are as at be been but by can could did do does for from had has have he her here him his how i if in into is it its just me more most my no nor not now of on once only or other our out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours'
  ).split(/\s+/),
);

const LEADING_PUNCT = /^[«“"‘'([{¡¿—–-]+/u;
const TRAILING_PUNCT = /[»”"’'.,;:!?…)\]}—–-]+$/u;

/** Virgolette e apostrofi tipografici, puntini e trattini lunghi. */
export function smarten(input) {
  let text = String(input ?? '').replace(/\r\n?/g, '\n');
  text = text
    .split('\n')
    .map((line) => line.replace(/[ \t\xa0]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  text = text.replace(/\.\.\./g, '…').replace(/(^|\s)--?(\s|$)/g, '$1—$2');
  text = text.replace(/(^|[\s([{«—–-])"/gu, '$1“').replace(/"/g, '”');
  text = text.replace(/(\p{L})'(\p{L})/gu, '$1’$2');
  text = text.replace(/(^|[\s([{“«—–-])'/gu, '$1‘').replace(/'/g, '’');
  return text;
}

/**
 * Divide il testo in righe (gli "a capo" dell'utente) e parole.
 * Una riga vuota indica uno stacco tra strofe.
 * @returns {{ lines: Array<Array<{text:string,index:number}>>, tokens: Array<{text:string,index:number,line:number}> }}
 */
export function tokenize(text) {
  const tokens = [];
  const lines = String(text ?? '')
    .split('\n')
    .map((line, lineIndex) =>
      line
        .split(' ')
        .filter(Boolean)
        .map((word) => {
          const token = { text: word, index: tokens.length, line: lineIndex };
          tokens.push(token);
          return token;
        }),
    );
  return { lines, tokens };
}

/** Testo visibile di ogni parola, con le virgolette di apertura e chiusura richieste. */
export function displayWords(tokens, mode) {
  const words = tokens.map((token) => token.text);
  if (!words.length || mode === 'none') return words;
  const [open, close] = mode === 'guillemets' ? ['«', '»'] : ['“', '”'];
  const first = words[0];
  const last = words[words.length - 1];
  const alreadyQuoted = /^[«“"‘]/u.test(first) && /[»”"’][.,;:!?…]*$/u.test(last);
  if (alreadyQuoted) return words;
  words[0] = open + first;
  // Citazione isolata: la virgoletta di chiusura segue la punteggiatura finale.
  words[words.length - 1] = (words.length === 1 ? words[0] : last) + close;
  return words;
}

export function normalizedWord(word) {
  return word
    .toLowerCase()
    .replace(LEADING_PUNCT, '')
    .replace(TRAILING_PUNCT, '')
    .replace(/^[a-zàèéìòù]{1,3}[’']/u, '');
}

/** Quanti caratteri di punteggiatura ha la parola all'inizio e alla fine (per non sottolinearli). */
export function punctuationSpan(word) {
  const lead = word.match(LEADING_PUNCT)?.[0].length ?? 0;
  const trail = word.match(TRAILING_PUNCT)?.[0].length ?? 0;
  return { lead, trail: Math.min(trail, Math.max(0, word.length - lead - 1)) };
}

/**
 * Parole più significative: le più lunghe tra quelle non vuote, preferendo la fine della frase
 * (dove di solito sta la "battuta").
 */
export function keyWordIndices(tokens, count = 1) {
  const n = tokens.length;
  if (!n) return [];
  const scored = tokens
    .map((token, i) => {
      const word = normalizedWord(token.text);
      if (!word || STOPWORDS.has(word)) return { i, score: -1 };
      const position = n > 1 ? i / (n - 1) : 1;
      return { i, score: word.length * 0.6 + position * 6 };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  const picked = scored.slice(0, count).map((item) => item.i);
  if (!picked.length) picked.push(n - 1);
  return picked.sort((a, b) => a - b);
}

/** Segni automatici di un template. Restituisce { indice: 'h' | 'u' | 'c' | 'd' | 'hu' }. */
export function autoMarks(tokens, strategy) {
  const marks = {};
  if (!tokens.length || !strategy || strategy === 'none') return marks;
  const keyCount = tokens.length > 12 ? 2 : 1;
  const keys = keyWordIndices(tokens, keyCount);
  const setAll = (flag) => tokens.forEach((token) => (marks[token.index] = flag));
  switch (strategy) {
    case 'all':
      setAll('h');
      break;
    case 'all+u':
      setAll('h');
      keys.forEach((i) => (marks[i] = 'hu'));
      break;
    case 'key-h':
      keys.forEach((i) => (marks[i] = 'h'));
      break;
    case 'key-u':
      keys.forEach((i) => (marks[i] = 'u'));
      break;
    case 'key-c':
      marks[keys[keys.length - 1]] = 'c';
      break;
    case 'key-d':
      keys.forEach((i) => (marks[i] = 'd'));
      break;
    case 'tail-h': {
      // Evidenzia l'ultima parte della frase, dalla parola chiave alla fine.
      const from = Math.max(0, Math.min(keys[0], tokens.length - 3));
      for (let i = from; i < tokens.length; i += 1) marks[i] = 'h';
      break;
    }
    default:
      break;
  }
  return marks;
}

/**
 * Quando il testo cambia, cerca di conservare i segni sulle parole rimaste uguali.
 * @param {Array<{text:string}>} before
 * @param {Array<{text:string}>} after
 */
export function remapMarks(marks, before, after) {
  if (!marks) return marks;
  const next = {};
  const used = new Set();
  after.forEach((token, i) => {
    const same = before[i] && before[i].text === token.text && !used.has(i) ? i : -1;
    let match = same;
    if (match < 0) {
      let best = -1;
      let bestDistance = Infinity;
      before.forEach((old, j) => {
        if (used.has(j) || normalizedWord(old.text) !== normalizedWord(token.text)) return;
        const distance = Math.abs(j - i);
        if (distance < bestDistance) {
          best = j;
          bestDistance = distance;
        }
      });
      match = best;
    }
    if (match >= 0) {
      used.add(match);
      if (marks[match]) next[i] = marks[match];
    }
  });
  return next;
}
