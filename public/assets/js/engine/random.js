// Numeri pseudo-casuali deterministici: la stessa citazione con lo stesso seme
// produce sempre la stessa carta e gli stessi tratti a mano.

export function hashString(input) {
  let hash = 2166136261 >>> 0;
  const text = String(input);
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generatore legato a una serie di chiavi: seeded(seed, 'carta', 3). */
export function seeded(...parts) {
  return mulberry32(hashString(parts.join('|')));
}

export function between(rand, min, max) {
  return min + (max - min) * rand();
}

/** Valore centrato in [-1, 1] con distribuzione a campana. */
export function wobble(rand) {
  return (rand() + rand() + rand() - 1.5) / 1.5;
}

export function randomSeed() {
  if (globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  }
  return Math.floor(Math.random() * 1_000_000);
}
