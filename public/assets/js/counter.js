// Contatore anonimo: legge i totali e registra un'esportazione.

const ENDPOINT = '/api/counter';
const FLAG = 'cites:counted';

export async function readCounter() {
  try {
    const response = await fetch(ENDPOINT, { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const data = await response.json();
    return Number.isFinite(data.people) && Number.isFinite(data.images) ? data : null;
  } catch {
    return null;
  }
}

/** Da chiamare dopo un download o una condivisione riusciti. */
export async function recordExport(pages) {
  let first;
  try {
    first = !localStorage.getItem(FLAG);
  } catch {
    first = false;
  }
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ pages, first }),
      keepalive: true,
    });
    const data = await response.json();
    if (response.ok && first) {
      try {
        localStorage.setItem(FLAG, '1');
      } catch {
        /* nessun problema */
      }
    }
    return Number.isFinite(data.images) ? data : null;
  } catch {
    return null;
  }
}
