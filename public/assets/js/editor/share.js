// Link condivisibili: lo stato compresso (deflate) e codificato in base64url nel parametro ?c=.
// Formato: "z" + base64url(deflate-raw(json)) oppure "j" + base64url(json) se la compressione non c'è.
// Lo legge anche PHP (includes/bootstrap.php) per i titoli delle anteprime dei link.

function toBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text) {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((text.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function pipe(bytes, stream) {
  const response = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await response.arrayBuffer());
}

/** Versione compatta dello stato: chiavi corte, niente valori di default. */
export function compact(doc) {
  return {
    v: 1,
    t: doc.template,
    f: doc.format,
    s: doc.seed,
    q: doc.quoteMarks !== 'none' ? doc.quoteMarks : undefined,
    h: doc.handle || undefined,
    n: doc.pageStart,
    x: doc.showAuthor === false ? 0 : undefined,
    o: Object.keys(doc.overrides).length ? doc.overrides : undefined,
    p: doc.pages.map((page) => ({ t: page.text, a: page.author || undefined, w: page.work || undefined, m: page.marks ?? undefined })),
  };
}

export function expand(data) {
  return {
    template: data.t,
    format: data.f,
    seed: data.s,
    quoteMarks: data.q ?? 'none',
    handle: data.h ?? '',
    pageStart: data.n,
    showAuthor: data.x !== 0,
    overrides: data.o ?? {},
    pages: (data.p ?? []).map((page) => ({ text: page.t ?? '', author: page.a ?? '', work: page.w ?? '', marks: page.m ?? null })),
  };
}

export async function encodeDoc(doc) {
  const json = new TextEncoder().encode(JSON.stringify(compact(doc)));
  if (typeof CompressionStream !== 'undefined') {
    try {
      return 'z' + toBase64Url(await pipe(json, new CompressionStream('deflate-raw')));
    } catch {
      /* si ripiega sul formato non compresso */
    }
  }
  return 'j' + toBase64Url(json);
}

export async function decodeDoc(value) {
  if (!value || value.length > 8000) return null;
  try {
    const kind = value[0];
    let bytes = fromBase64Url(value.slice(1));
    if (kind === 'z') {
      if (typeof DecompressionStream === 'undefined') return null;
      bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    } else if (kind !== 'j') {
      return null;
    }
    return expand(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

export async function shareUrl(doc, basePath) {
  const url = new URL(basePath, window.location.origin);
  url.searchParams.set('c', await encodeDoc(doc));
  return url.toString();
}
