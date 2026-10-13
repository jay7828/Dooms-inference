/**
 * numpy-compatible random numbers: `np.random.default_rng(seed)` (SeedSequence + PCG64 XSL-RR 128/64) and
 * `rng.uniform(lo, hi)` / `rng.random()`, so a browser scene with seed N lays objects out exactly like the Python server.
 */
const M64 = (BigInt(1) << BigInt(64)) - BigInt(1)
const M128 = (BigInt(1) << BigInt(128)) - BigInt(1)
const M32 = BigInt("0xffffffff")

const INIT_A = BigInt("0x43b0d7e5")
const MULT_A = BigInt("0x931e8875")
const INIT_B = BigInt("0x8b51f9dd")
const MULT_B = BigInt("0x58f38ded")
const MIX_MULT_L = BigInt("0xca01f9dd")
const MIX_MULT_R = BigInt("0x4973f715")
const XSHIFT = BigInt(16)

function hashmix(value: bigint, hashConst: { v: bigint }): bigint {
  value = (value ^ hashConst.v) & M32
  hashConst.v = (hashConst.v * MULT_A) & M32
  value = (value * hashConst.v) & M32
  value = (value ^ (value >> XSHIFT)) & M32
  return value
}
const mix = (x: bigint, y: bigint): bigint => {
  let r = (MIX_MULT_L * x - MIX_MULT_R * y) & M32
  r = (r ^ (r >> XSHIFT)) & M32
  return r
}

/** numpy SeedSequence(entropy=int).generate_state(n_words, uint32) */
function seedSequenceState(seed: number, nWords: number): bigint[] {
  let e = BigInt(seed)
  const entropy: bigint[] = []
  if (e === BigInt(0)) entropy.push(BigInt(0))
  while (e > BigInt(0)) {
    entropy.push(e & M32)
    e >>= BigInt(32)
  }
  const poolSize = 4
  while (entropy.length < poolSize) entropy.push(BigInt(0))
  const hc = { v: INIT_A }
  const pool: bigint[] = []
  for (let i = 0; i < poolSize; i++) pool.push(hashmix(entropy[i]!, hc))
  for (let i = 0; i < poolSize; i++)
    for (let j = 0; j < poolSize; j++) if (i !== j) pool[j] = mix(pool[j]!, hashmix(pool[i]!, hc))
  for (let i = poolSize; i < entropy.length; i++)
    for (let j = 0; j < poolSize; j++) pool[j] = mix(pool[j]!, hashmix(entropy[i]!, hc))
  const out: bigint[] = []
  const hc2 = { v: INIT_B }
  for (let i = 0; i < nWords; i++) {
    let d = pool[i % poolSize]! ^ hc2.v
    hc2.v = (hc2.v * MULT_B) & M32
    d = (d * hc2.v) & M32
    d = (d ^ (d >> XSHIFT)) & M32
    out.push(d)
  }
  return out
}

const PCG_MULT = (BigInt("2549297995355413924") << BigInt(64)) + BigInt("4865540595714422341")

export class DefaultRng {
  private state: bigint
  private inc: bigint

  constructor(seed: number) {
    const w = seedSequenceState(seed, 8) // 4 x uint64 (little-endian pairs of uint32)
    const u64 = (i: number) => w[2 * i]! | (w[2 * i + 1]! << BigInt(32))
    const initstate = (u64(0) << BigInt(64)) | u64(1)
    const initseq = (u64(2) << BigInt(64)) | u64(3)
    this.inc = ((initseq << BigInt(1)) | BigInt(1)) & M128
    this.state = BigInt(0)
    this.step()
    this.state = (this.state + initstate) & M128
    this.step()
  }

  private step(): void {
    this.state = (this.state * PCG_MULT + this.inc) & M128
  }

  nextUint64(): bigint {
    this.step()
    const hi = this.state >> BigInt(64)
    const lo = this.state & M64
    const x = hi ^ lo
    const rot = hi >> BigInt(58)
    return ((x >> rot) | (x << ((BigInt(64) - rot) & BigInt(63)))) & M64
  }

  /** float64 in [0, 1) with 53 random bits, like numpy */
  random(): number {
    return Number(this.nextUint64() >> BigInt(11)) / 9007199254740992
  }

  uniform(lo: number, hi: number): number {
    return lo + (hi - lo) * this.random()
  }
}
