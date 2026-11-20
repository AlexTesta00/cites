// Impaginazione del testo: righe bilanciate (niente parole orfane), corpo del testo
// adattato allo spazio disponibile, versi, capolettera. Funzioni pure: la misura delle
// parole arriva da fuori, così si possono testare senza canvas.

export const REF_SIZE = 100;

function sumWidth(widths, space, line) {
  let total = 0;
  for (let k = 0; k < line.length; k += 1) total += widths[line[k]] + (k ? space : 0);
  return total;
}

/** A capo "avido" con larghezza massima per riga (può variare, per il capolettera). */
export function greedyBreak(widths, space, maxWidthFor) {
  const lines = [];
  let line = [];
  let width = 0;
  widths.forEach((w, i) => {
    const limit = maxWidthFor(lines.length);
    const add = line.length ? space + w : w;
    if (line.length && width + add > limit) {
      lines.push(line);
      line = [i];
      width = w;
    } else {
      line.push(i);
      width += add;
    }
  });
  if (line.length) lines.push(line);
  return lines;
}

/** Stesse righe del metodo avido ma con lunghezze il più possibile uguali. */
export function balancedBreak(widths, space, maxWidth) {
  const base = greedyBreak(widths, space, () => maxWidth);
  if (base.length <= 1) return base;
  let lo = Math.max(...widths);
  let hi = maxWidth;
  let best = base;
  for (let step = 0; step < 18; step += 1) {
    const mid = (lo + hi) / 2;
    const attempt = greedyBreak(widths, space, () => mid);
    if (attempt.length <= base.length) {
      best = attempt;
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return best;
}

/**
 * @param {object} p
 * @param {Array<Array<{index:number,text:string,w:number}>>} p.paragraphs parole con larghezza a REF_SIZE; [] = stacco tra strofe
 * @param {number} p.space larghezza dello spazio a REF_SIZE
 * @param {{x:number,y:number,w:number,h:number}} p.box
 * @param {number} p.lineHeight interlinea (moltiplicatore del corpo)
 * @param {number} p.minSize
 * @param {number} p.maxSize
 * @param {'balanced'|'greedy'|'poem'} [p.mode]
 * @param {(size:number)=>number} [p.extraHeight] altezza aggiuntiva (autore) in funzione del corpo
 * @param {{lines:number, width:number}} [p.drop] capolettera: righe occupate e larghezza a REF_SIZE
 */
export function fitText(p) {
  const { paragraphs, space, box, lineHeight, minSize, maxSize, mode = 'balanced', extraHeight = () => 0, drop } = p;

  const layoutAt = (size) => {
    const k = size / REF_SIZE;
    const maxWidth = box.w / k;
    const lines = [];
    let height = 0;
    let widest = 0;
    let lineCount = 0;
    paragraphs.forEach((para, pi) => {
      if (!para.length) {
        if (lines.length) height += size * lineHeight * 0.6;
        return;
      }
      const widths = para.map((word) => word.w);
      let broken;
      if (mode === 'balanced' && !drop) {
        broken = balancedBreak(widths, space, maxWidth);
      } else if (mode === 'poem') {
        const indent = 1.4 * REF_SIZE * 0.5;
        broken = greedyBreak(widths, space, (i) => (i === 0 ? maxWidth : maxWidth - indent));
        broken = broken.map((line, i) => Object.assign(line, { indent: i === 0 ? 0 : indent }));
      } else {
        broken = greedyBreak(widths, space, (i) => (drop && lineCount + i < drop.lines ? maxWidth - drop.width : maxWidth));
      }
      broken.forEach((line) => {
        const indent100 = (line.indent ?? 0) + (drop && lineCount < drop.lines ? drop.width : 0);
        const width = (sumWidth(widths, space, line) + indent100) * k;
        widest = Math.max(widest, width);
        lines.push({ para: pi, words: line.map((i) => para[i]), width, indent: indent100 * k });
        height += size * lineHeight;
        lineCount += 1;
      });
    });
    if (drop && lineCount < drop.lines) height += size * lineHeight * (drop.lines - lineCount);
    height += extraHeight(size);
    return { size, k, lines, height, widest };
  };

  const fits = (layout) => layout.height <= box.h + 0.5 && layout.widest <= box.w + 0.5;
  const top = layoutAt(maxSize);
  if (fits(top)) return top;
  let lo = minSize;
  let hi = maxSize;
  let best = layoutAt(minSize);
  for (let step = 0; step < 20; step += 1) {
    const mid = (lo + hi) / 2;
    const attempt = layoutAt(mid);
    if (fits(attempt)) {
      best = attempt;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return best;
}

/**
 * Posiziona righe e parole. Restituisce le coordinate della linea di base di ogni riga
 * e il riquadro occupato dal blocco di testo (autore escluso).
 */
export function placeLines(layout, { box, align, valign, lineHeight, space, ascent = 0.78, extraHeight = 0, optical = 0.02 }) {
  const { size, k } = layout;
  const lineBox = size * lineHeight;
  let top;
  if (valign === 'top') top = box.y;
  else if (valign === 'bottom') top = box.y + box.h - layout.height;
  else top = box.y + (box.h - layout.height) / 2 - box.h * optical;
  top = Math.max(box.y - box.h * 0.02, top);

  const blockWidth = layout.widest;
  const blockLeft = align === 'poem' ? box.x + (box.w - blockWidth) / 2 : box.x;
  let y = top + (lineBox - size) / 2 + size * ascent;
  let previousPara = layout.lines[0]?.para;
  let left = Infinity;
  let right = -Infinity;

  layout.lines.forEach((line, lineIndex) => {
    if (line.para !== previousPara) {
      const gapLines = line.para - previousPara - 1;
      if (gapLines > 0) y += lineBox * 0.6 * gapLines;
      previousPara = line.para;
    }
    const isLastOfPara = layout.lines[lineIndex + 1]?.para !== line.para;
    let x;
    let gap = space * k;
    if (align === 'center') x = box.x + (box.w - line.width) / 2;
    else if (align === 'right') x = box.x + box.w - line.width;
    else if (align === 'poem') x = blockLeft;
    else x = box.x;
    // Giustifica solo le righe già lunghe: su quelle corte gli spazi diventerebbero buchi.
    if (align === 'justify' && !isLastOfPara && line.words.length > 1 && line.width >= box.w * 0.72) {
      const natural = line.width - (line.words.length - 1) * gap;
      gap = (box.w - natural) / (line.words.length - 1);
    }
    x += line.indent ?? 0;
    line.x = x;
    line.y = y;
    let cursor = x;
    line.words = line.words.map((word) => {
      const placed = { ...word, x: cursor, w: word.w * k };
      cursor += placed.w + gap;
      return placed;
    });
    left = Math.min(left, x - (line.indent ?? 0));
    right = Math.max(right, cursor - gap);
    y += lineBox;
  });

  const firstBaseline = layout.lines[0]?.y ?? top;
  const lastBaseline = layout.lines[layout.lines.length - 1]?.y ?? top;
  return {
    top,
    bottom: top + layout.height - extraHeight,
    firstBaseline,
    lastBaseline,
    left: Number.isFinite(left) ? left : box.x,
    right: Number.isFinite(right) ? right : box.x + box.w,
  };
}
