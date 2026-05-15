export type Rng = () => number;

// Mulberry32 — fast, simple, good-quality 32-bit seeded PRNG.
export function makeRng(seed: number): Rng {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngInt(rng: Rng, n: number): number {
  return Math.floor(rng() * n);
}

export function rngPick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[rngInt(rng, arr.length)];
}

// Fisher-Yates partial shuffle — returns k distinct elements from arr.
export function rngSample<T>(rng: Rng, arr: readonly T[], k: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < k && i < copy.length; i++) {
    const j = i + rngInt(rng, copy.length - i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
    result.push(copy[i]);
  }
  return result;
}
