// Deterministic PRNG so a given seed always produces the same floor layout —
// useful for debugging bad generations and for potential seeded-run features later.

export class Rng {
  private state: number

  constructor(seed: number) {
    this.state = seed >>> 0
    if (this.state === 0) this.state = 0x9e3779b9
  }

  /** Returns a float in [0, 1). */
  next(): number {
    // mulberry32
    this.state |= 0
    this.state = (this.state + 0x6d2b79f5) | 0
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  int(minInclusive: number, maxExclusive: number): number {
    return Math.floor(this.next() * (maxExclusive - minInclusive)) + minInclusive
  }

  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length)]
  }

  shuffle<T>(arr: T[]): T[] {
    const out = arr.slice()
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(0, i + 1)
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }

  chance(probability: number): boolean {
    return this.next() < probability
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }
}

export function makeSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0
}
