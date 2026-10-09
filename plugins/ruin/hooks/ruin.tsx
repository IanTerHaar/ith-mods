import type { ClientModule } from 'claude-code'

// ───────────────────────────── types ─────────────────────────────

type Kind =
  | 'zombie' | 'imp' | 'demon' | 'baron' | 'barrel'
  | 'health' | 'ammo' | 'armor' | 'key' | 'shotgun' | 'chaingun'
type Ent = {
  kind: Kind
  x: number
  y: number
  hp: number
  cool: number
  hurt: number
  dying: number
  atk: number
  alert: boolean
  anim: number
  drop?: boolean
  got?: boolean
}
type Proj = { x: number; y: number; vx: number; vy: number; dmg: number; big: boolean }
type Fx = { x: number; y: number; t: number }
type Door = { f: number; locked: boolean }
type Carry = { hp: number; armor: number; ammo: number; have: boolean[]; weapon: number }
type Game = {
  mode: 'title' | 'play' | 'dead' | 'done' | 'won'
  lvl: number
  w: number
  h: number
  grid: number[][]
  doors: Record<string, Door>
  x: number
  y: number
  dir: number
  hp: number
  armor: number
  ammo: number
  weapon: number
  have: boolean[]
  red: boolean
  ents: Ent[]
  projs: Proj[]
  fx: Fx[]
  kills: number
  totalKills: number
  items: number
  totalItems: number
  time: number
  tick: number
  msg: string
  msgT: number
  flash: number
  pain: number
  pick: number
  cd: number
  bob: number
  fwd: number
  str: number
  trn: number
  fireT: number
  showMap: boolean
  start: Carry
  doneKills: number
  doneItems: number
  doneTime: number
}
type S = { g: Game; n: number }
type Level = { name: string; theme: string; floor: number; ceil: number; dir: number; rows: string[] }

// ───────────────────────────── levels ─────────────────────────────
// 1-5 wall textures (1 is the level theme), 6 exit switch, D door, L red-key door, P start.
// z zombie, i imp, c demon, b baron, o barrel, h medkit, a ammo, r armor, k red key, s shotgun, g chaingun.

const LEVELS: Level[] = [
  {
    name: '1  HANGAR',
    theme: '1',
    floor: 0,
    ceil: 0,
    dir: 0.38,
    rows: [
      '111111111111111111111111',
      '1P....1..........1.....1',
      '1.....1....i.....1..a..1',
      '1..h..D..........D.....1',
      '1.....1....o.....1..z..1',
      '111.1111111.11111111.111',
      '1..z.......i..........s1',
      '1.....11........11.....1',
      '1.....11...o....11..z..1',
      '1.....11........11.....1',
      '1h.........i..........h1',
      '111111111116611111111111',
    ],
  },
  {
    name: '2  TOXIC REFINERY',
    theme: '3',
    floor: 2,
    ceil: 1,
    dir: 0.59,
    rows: [
      '11111111111111111111111111',
      '1P..2......3......2......1',
      '1...2..z...3..i...2..a...1',
      '1...D......D......L......1',
      '1...2..o...3......2..h...6',
      '1...2......3..i...2....r.1',
      '1...2......3......2......1',
      '11.11111.11111.11111111111',
      '1..z.....o.......i.......1',
      '1..........11.....11.....1',
      '1...g......11.....11..z..1',
      '1..........11.....11.....1',
      '1..i...h.............o..k1',
      '11111111111111111111111111',
    ],
  },
  {
    name: '3  COMMAND CENTER',
    theme: '4',
    floor: 1,
    ceil: 2,
    dir: 0.32,
    rows: [
      '1111111111111111111111111111',
      '1P.....1............1......1',
      '1......1..c......c..1....i.1',
      '1..z...D............D...k..1',
      '1......1.....o......1..h...1',
      '1...h..1..........c.1..i...1',
      '1....a.1............1......1',
      '11111111...o..c.....11111111',
      '1.r..g.1............1......1',
      '1......1..i......i..1......1',
      '1......D............L......6',
      '1......1.....c......1..h...1',
      '1....a.1............1......1',
      '1111111111111111111111111111',
    ],
  },
  {
    name: '4  HELL KEEP',
    theme: '1',
    floor: 3,
    ceil: 1,
    dir: 0.38,
    rows: [
      '111111111111111111111111111111',
      '1P....1..z......i.1..b.......1',
      '1.....1...o.......1..........1',
      '1..h..D...........1..a.......1',
      '1.....1....5.5....1...c......1',
      '1.....1.z.........1..........1',
      '1.....1...i.......1....o.....1',
      '1111111...........L..........6',
      '1.....1..z........1..........1',
      '1..a..1.5.......5.1......b...1',
      '1.....D...........1..........1',
      '1....k1....c......1..o.......1',
      '1.i...1....h......1..h.......1',
      '1.....1..o.....z..1..........1',
      '111111111111111111111111111111',
    ],
  },
]

const ENT_CHARS: Record<string, Kind> = {
  z: 'zombie', i: 'imp', c: 'demon', b: 'baron', o: 'barrel',
  h: 'health', a: 'ammo', r: 'armor', k: 'key', s: 'shotgun', g: 'chaingun',
}
const MON: Record<string, { hp: number; speed: number; pref: number }> = {
  zombie: { hp: 3, speed: 0.06, pref: 5 },
  imp: { hp: 6, speed: 0.08, pref: 3 },
  demon: { hp: 10, speed: 0.16, pref: 0.9 },
  baron: { hp: 22, speed: 0.075, pref: 2.5 },
}
const isMon = (k: Kind) => k === 'zombie' || k === 'imp' || k === 'demon' || k === 'baron'
const isItem = (k: Kind) => !isMon(k) && k !== 'barrel'

const WEAPONS = [
  { name: 'PISTOL', dmg: 2, pellets: 1, spread: 0.01, cd: 6, cost: 1, flash: 2 },
  { name: 'SHOTGUN', dmg: 2, pellets: 7, spread: 0.13, cd: 15, cost: 2, flash: 4 },
  { name: 'CHAINGUN', dmg: 2, pellets: 1, spread: 0.05, cd: 2, cost: 1, flash: 2 },
]

const TICK = 60
const LATCH = 5
const SPEED = 0.16
const TURN = 0.14

// ───────────────────────────── colour + noise ─────────────────────────────

const c = (r: number, g: number, b: number) =>
  (Math.max(0, Math.min(255, r | 0)) << 16) | (Math.max(0, Math.min(255, g | 0)) << 8) | Math.max(0, Math.min(255, b | 0))

const hash = (x: number, y: number, s: number) => {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const T = 64
// smooth value noise tiling every T pixels, with cells of `sc` pixels
const vnoise = (x: number, y: number, s: number, sc: number) => {
  const fx = x / sc
  const fy = y / sc
  const x0 = Math.floor(fx)
  const y0 = Math.floor(fy)
  const tx = fx - x0
  const ty = fy - y0
  const n = T / sc
  const a = hash(x0 % n, y0 % n, s)
  const b = hash((x0 + 1) % n, y0 % n, s)
  const d = hash(x0 % n, (y0 + 1) % n, s)
  const e = hash((x0 + 1) % n, (y0 + 1) % n, s)
  const sx = tx * tx * (3 - 2 * tx)
  const sy = ty * ty * (3 - 2 * ty)
  return a + (b - a) * sx + (d - a) * sy + (a - b - d + e) * sx * sy
}

type Px = (x: number, y: number) => number
const make = (fn: Px) => {
  const t = new Int32Array(T * T)
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) t[y * T + x] = fn(x, y)
  return t
}

// ───────────────────────────── textures ─────────────────────────────

const brick = make((x, y) => {
  const row = Math.floor(y / 16)
  const off = row % 2 ? 16 : 0
  const bx = (x + off) % 32
  const by = y % 16
  if (by < 2 || bx < 2) {
    const n = hash(x, y, 1) * 22
    return c(92 + n, 88 + n, 84 + n)
  }
  const id = Math.floor((x + off) / 32) + row * 7
  const v = hash(id, row, 2)
  const n = hash(x, y, 3) * 30 - 15 + vnoise(x, y, 11, 8) * 24 - 12
  const bev = by < 4 || bx < 4 ? 14 : by > 13 || bx > 29 ? -20 : 0
  return c(138 + v * 50 + n + bev, 58 + v * 26 + n * 0.6 + bev, 42 + v * 14 + n * 0.5 + bev)
})

const stone = make((x, y) => {
  const bx = x % 32
  const by = y % 32
  if (bx < 1 || by < 1) return c(48, 48, 54)
  const id = Math.floor(x / 32) + Math.floor(y / 32) * 2
  let b = 92 + hash(id, 7, 4) * 26 + vnoise(x, y, 4, 8) * 38 + hash(x, y, 5) * 16
  if (bx < 3 || by < 3) b += 24
  else if (bx > 29 || by > 29) b -= 26
  // hairline cracks
  if (Math.abs(vnoise(x, y, 12, 16) - 0.5) < 0.018) b -= 40
  return c(b, b, b + 9)
})

const mossy = make((x, y) => {
  const p = stone[y * T + x]!
  const r = (p >> 16) & 255
  const g = (p >> 8) & 255
  const b = p & 255
  const m = vnoise(x, y, 6, 16) + (vnoise(x, y, 13, 8) - 0.5) * 0.4
  if (m > 0.52) {
    const k = Math.min(1, (m - 0.52) * 4)
    return c(r * (1 - k) + 50 * k, g * (1 - k) + 120 * k, b * (1 - k) + 40 * k)
  }
  return c(r, g, b)
})

const tech = make((x, y) => {
  const px = x % 32
  const py = y % 32
  let b = 66 + hash(x, y, 7) * 12
  if (px < 2 || py < 2) b -= 30
  else if (px > 29 || py > 29) b += 18
  if (py >= 14 && py <= 17 && px > 4 && px < 28) return c(70, 190 + hash(x, y, 8) * 50, 235)
  const rx = Math.min(px, 31 - px)
  const ry = Math.min(py, 31 - py)
  if (rx >= 3 && rx <= 5 && ry >= 3 && ry <= 5) b += 34
  if (py >= 22 && py <= 28 && px >= 6 && px <= 25 && py % 2 === 0) b -= 36
  if (px === 16 && py > 4 && py < 12) b += 20
  return c(b * 0.78, b * 0.95, b * 1.25)
})

const wood = make((x, y) => {
  const p = Math.floor(x / 16)
  const px = x % 16
  if (px < 1) return c(34, 20, 11)
  const grain = Math.sin((y + p * 13) * 0.32 + vnoise(x, y, 9, 8) * 7) * 0.5 + 0.5
  let tone = 0.62 + grain * 0.32 + hash(p, 0, 10) * 0.2
  if (px < 3) tone *= 1.1
  if ((y % 32 === 6 || y % 32 === 26) && (px === 3 || px === 12)) tone *= 0.55
  return c(150 * tone, 96 * tone, 52 * tone)
})

const exitTex = make((x, y) => {
  if (x < 3 || x > 60 || y < 3 || y > 60) return c(35, 90, 48)
  const n = hash(x, y, 14) * 14
  let lit = false
  if (x >= 26 && x <= 37 && y >= 12 && y <= 36) lit = true
  if (y > 36 && y <= 54 && Math.abs(x - 31.5) < (54 - y) * 0.9) lit = true
  if (lit) return c(110 + n, 250, 135 + n)
  if (y % 8 === 0) return c(28, 80, 40)
  return c(18 + n, 58 + n, 30 + n)
})

const door = make((x, y) => {
  if (x < 3 || x > 60) return c(40, 40, 46)
  if (y < 8 || y > 55) return ((x + y) >> 3) & 1 ? c(235, 190, 30) : c(30, 30, 30)
  const n = hash(x, y, 15) * 16
  if (x === 31 || x === 32) return c(35, 35, 40)
  if ((y >= 30 && y <= 34) && ((x >= 24 && x <= 28) || (x >= 35 && x <= 39))) return c(225, 205, 70)
  const bev = x < 6 || y < 12 ? 16 : x > 57 || y > 51 ? -20 : 0
  return c(118 + n + bev, 124 + n + bev, 136 + n + bev)
})

const locked = make((x, y) => {
  if (x < 3 || x > 60) return c(40, 20, 20)
  if (y < 8 || y > 55) return ((x + y) >> 3) & 1 ? c(230, 50, 50) : c(30, 30, 30)
  const n = hash(x, y, 16) * 14
  if (Math.hypot(x - 32, y - 28) < 5) return c(15, 10, 10)
  if (x >= 31 && x <= 33 && y > 28 && y < 40) return c(15, 10, 10)
  if (x === 31 || x === 32) return c(40, 15, 15)
  const bev = x < 6 || y < 12 ? 16 : x > 57 || y > 51 ? -20 : 0
  return c(150 + n + bev, 38 + n * 0.5 + bev, 38 + n * 0.5 + bev)
})

const WALLTEX: Int32Array[] = [brick, brick, stone, mossy, tech, wood, exitTex, door, locked]

const FLOORS: Int32Array[] = [
  make((x, y) => {
    const bx = x % 32
    const by = y % 32
    if (bx < 1 || by < 1) return c(30, 28, 28)
    const id = Math.floor(x / 32) + Math.floor(y / 32) * 2
    const b = 78 + hash(id, 3, 17) * 24 + hash(x, y, 18) * 14 + vnoise(x, y, 19, 8) * 18
    return c(b, b * 0.92, b * 0.85)
  }),
  make((x, y) => {
    const chk = ((x >> 4) + (y >> 4)) & 1
    const b = (chk ? 96 : 56) + hash(x, y, 20) * 14
    return c(b * 0.85, b * 0.95, b * 1.15)
  }),
  make((x, y) => {
    const gx = x % 8
    const gy = y % 8
    let b = 52 + hash(x, y, 21) * 10
    if (gx === 0 || gy === 0) b += 26
    if (gx > 2 && gx < 6 && gy > 2 && gy < 6) b -= 22
    return c(b, b * 1.02, b * 1.12)
  }),
  make((x, y) => {
    const n = vnoise(x, y, 22, 16) + (vnoise(x, y, 23, 8) - 0.5) * 0.5
    const crack = Math.abs(n - 0.5) < 0.04
    if (crack) return c(255, 140 + hash(x, y, 24) * 60, 30)
    const b = 50 + hash(x, y, 25) * 22 + n * 40
    return c(b * 1.1, b * 0.55, b * 0.45)
  }),
]

const CEILS: Int32Array[] = [
  make((x, y) => {
    const bx = x % 32
    const by = y % 32
    let b = 46 + hash(x, y, 26) * 10
    if (bx < 2 || by < 2) b -= 18
    return c(b, b, b + 6)
  }),
  make((x, y) => {
    const beam = x % 32 < 4 || y % 32 < 4
    const b = beam ? 28 + hash(x, y, 27) * 8 : 38 + hash(x, y, 28) * 12
    return c(b * 1.1, b * 0.9, b * 0.85)
  }),
  make((x, y) => {
    const bx = x % 32
    const by = y % 32
    if (bx < 2 || by < 2) return c(34, 36, 44)
    if (bx > 8 && bx < 24 && by > 8 && by < 24) return c(215 + hash(x, y, 29) * 25, 225 + hash(x, y, 30) * 20, 245)
    return c(70, 74, 88)
  }),
]

// ───────────────────────────── sprites ─────────────────────────────

const ell = (u: number, v: number, cx: number, cy: number, rx: number, ry: number) =>
  ((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2 <= 1
const box = (u: number, v: number, x0: number, y0: number, x1: number, y1: number) =>
  u >= x0 && u <= x1 && v >= y0 && v <= y1

type St = { f: number; hurt: boolean; t: number }
const tint = (st: St, r: number, g: number, b: number, k = 1) =>
  st.hurt ? c(255 * k, 215 * k, 215 * k) : c(r * k, g * k, b * k)

const zombieSpr = (u: number, v: number, st: St) => {
  const step = st.f === 1 ? 0.035 : st.f === 0 ? -0.035 : 0
  if (v > 0.62) {
    if (box(u, v, 0.38 + step, 0.62, 0.48 + step, 0.98) || box(u, v, 0.52 - step, 0.62, 0.62 - step, 0.98)) return tint(st, 52, 62, 44, v > 0.93 ? 0.45 : 1)
    return -1
  }
  if (ell(u, v, 0.5, 0.15, 0.1, 0.12)) {
    if (box(u, v, 0.44, 0.14, 0.47, 0.17) || box(u, v, 0.53, 0.14, 0.56, 0.17)) return c(30, 20, 20)
    return v < 0.08 ? tint(st, 62, 62, 72) : tint(st, 205, 165, 125, 0.8 + u * 0.3)
  }
  if (st.f === 2 ? box(u, v, 0.6, 0.27, 0.92, 0.34) : box(u, v, 0.6, 0.4, 0.84, 0.47)) return tint(st, 36, 36, 42)
  if (box(u, v, 0.27, 0.28, 0.36, 0.52) || box(u, v, 0.64, 0.28, 0.72, 0.5)) return tint(st, 92, 122, 72)
  if (box(u, v, 0.35, 0.26, 0.65, 0.62)) {
    const belt = v > 0.52 && v < 0.56
    return tint(st, belt ? 60 : 82, belt ? 44 : 116, belt ? 30 : 66, 0.8 + u * 0.3)
  }
  return -1
}

const impSpr = (u: number, v: number, st: St) => {
  const step = st.f === 1 ? 0.035 : st.f === 0 ? -0.035 : 0
  if (v > 0.64) {
    if (box(u, v, 0.36 + step, 0.64, 0.48 + step, 0.98) || box(u, v, 0.52 - step, 0.64, 0.64 - step, 0.98)) return tint(st, 112, 60, 40, v > 0.93 ? 0.4 : 1)
    return -1
  }
  if (ell(u, v, 0.5, 0.16, 0.12, 0.11)) {
    if (box(u, v, 0.43, 0.14, 0.47, 0.17) || box(u, v, 0.53, 0.14, 0.57, 0.17)) return c(255, 240, 60)
    if (box(u, v, 0.45, 0.21, 0.55, 0.23)) return c(40, 10, 10)
    return tint(st, 152, 86, 56, 0.85 + u * 0.25)
  }
  if (box(u, v, 0.38, 0.03, 0.41, 0.09) || box(u, v, 0.59, 0.03, 0.62, 0.09)) return tint(st, 215, 205, 180)
  if (st.f === 2 && ell(u, v, 0.77, 0.11, 0.08, 0.08)) return c(255, 190 + (st.t % 2) * 50, 50)
  if (box(u, v, 0.2, 0.3, 0.33, 0.58) || box(u, v, 0.67, 0.3, 0.8, st.f === 2 ? 0.14 : 0.58)) return tint(st, 130, 72, 48)
  if (box(u, v, 0.28, 0.24, 0.33, 0.31) || box(u, v, 0.67, 0.24, 0.72, 0.31)) return tint(st, 205, 195, 172)
  if (box(u, v, 0.32, 0.28, 0.68, 0.66)) {
    const spot = (((u * 22) | 0) + ((v * 22) | 0)) % 5 === 0
    return tint(st, 126, 70, 46, spot ? 1.25 : 0.85 + u * 0.25)
  }
  return -1
}

const demonSpr = (u: number, v: number, st: St) => {
  const step = st.f === 1 ? 0.04 : st.f === 0 ? -0.04 : 0
  if (v > 0.7) {
    if (box(u, v, 0.28 + step, 0.7, 0.46 + step, 0.98) || box(u, v, 0.54 - step, 0.7, 0.72 - step, 0.98)) return tint(st, 170, 80, 90, v > 0.93 ? 0.45 : 1)
    return -1
  }
  if (ell(u, v, 0.5, 0.22, 0.22, 0.17)) {
    if (box(u, v, 0.36, 0.14, 0.42, 0.18) || box(u, v, 0.58, 0.14, 0.64, 0.18)) return c(255, 60, 40)
    if (box(u, v, 0.34, 0.26, 0.66, 0.34)) return (((u * 34) | 0) % 2) && v < 0.3 ? c(240, 235, 215) : c(90, 10, 15)
    return tint(st, 215, 110, 120, 0.8 + u * 0.3)
  }
  if (box(u, v, 0.28, 0.04, 0.33, 0.14) || box(u, v, 0.67, 0.04, 0.72, 0.14)) return tint(st, 200, 195, 170)
  if (ell(u, v, 0.5, 0.52, 0.34, 0.26)) return tint(st, 206, 102, 112, 0.75 + (1 - Math.abs(u - 0.5)) * 0.45)
  return -1
}

const baronSpr = (u: number, v: number, st: St) => {
  const step = st.f === 1 ? 0.03 : st.f === 0 ? -0.03 : 0
  if (v > 0.66) {
    if (box(u, v, 0.34 + step, 0.66, 0.44 + step, 0.97) || box(u, v, 0.56 - step, 0.66, 0.66 - step, 0.97)) return tint(st, 120, 50, 42, v > 0.92 ? 0.35 : 1)
    return -1
  }
  if (ell(u, v, 0.5, 0.15, 0.13, 0.12)) {
    if (box(u, v, 0.42, 0.13, 0.47, 0.17) || box(u, v, 0.53, 0.13, 0.58, 0.17)) return c(90, 255, 90)
    return tint(st, 172, 84, 62, 0.8 + u * 0.3)
  }
  if (box(u, v, 0.33, 0.01, 0.38, 0.12) || box(u, v, 0.62, 0.01, 0.67, 0.12)) return tint(st, 225, 215, 185)
  if (box(u, v, 0.14, 0.3, 0.27, 0.6) || box(u, v, 0.73, 0.3, 0.86, 0.6)) return tint(st, 150, 60, 48)
  if (ell(u, v, 0.15, 0.64, 0.07, 0.07) || ell(u, v, 0.85, 0.64, 0.07, 0.07)) return c(60 + st.f * 60, 255, 60 + st.f * 40)
  if (box(u, v, 0.27, 0.27, 0.73, 0.68)) {
    const belly = box(u, v, 0.38, 0.45, 0.62, 0.66)
    return tint(st, belly ? 130 : 172, belly ? 48 : 64, belly ? 40 : 50, 0.75 + (1 - Math.abs(u - 0.5)) * 0.5)
  }
  return -1
}

const barrelSpr = (u: number, v: number, st: St) => {
  if (ell(u, v, 0.5, 0.17, 0.28, 0.07)) return c(110, 150, 90)
  if (box(u, v, 0.22, 0.17, 0.78, 1)) {
    const k = 0.55 + 0.5 * Math.cos((u - 0.5) * Math.PI)
    if (Math.abs(v - 0.3) < 0.03 || Math.abs(v - 0.72) < 0.03) return c(50 * k, 70 * k, 45 * k)
    if (ell(u, v, 0.5, 0.52, 0.09, 0.1)) return c(240 * k, 210 * k, 40 * k)
    return c(80 * k + hash((u * 40) | 0, (v * 40) | 0, 31) * 14, 126 * k, 62 * k)
  }
  return -1
}

const healthSpr = (u: number, v: number) => {
  if (!box(u, v, 0.15, 0.4, 0.85, 1)) return -1
  if (box(u, v, 0.44, 0.5, 0.56, 0.92) || box(u, v, 0.28, 0.64, 0.72, 0.78)) return c(214, 28, 28)
  if (u < 0.19 || v > 0.96) return c(150, 150, 158)
  return c(228, 228, 235)
}
const ammoSpr = (u: number, v: number) => {
  if (!box(u, v, 0.2, 0.5, 0.8, 1)) return -1
  if (v < 0.65) return (((u * 14) | 0) % 2) ? c(200, 170, 60) : c(120, 100, 40)
  return u < 0.25 || v > 0.95 ? c(70, 90, 50) : c(95, 120, 65)
}
const armorSpr = (u: number, v: number) => {
  if (!box(u, v, 0.2, 0.4, 0.8, 1)) return -1
  if (ell(u, v, 0.5, 0.4, 0.13, 0.1)) return -1
  const k = 0.7 + (1 - Math.abs(u - 0.5)) * 0.6
  if (Math.abs(u - 0.5) < 0.04) return c(190, 210, 255)
  return c(60 * k, 100 * k, 215 * k)
}
const keySpr = (u: number, v: number, st: St) => {
  const k = 0.85 + 0.15 * Math.sin(st.t * 0.5)
  if (ell(u, v, 0.5, 0.3, 0.2, 0.2) && !ell(u, v, 0.5, 0.3, 0.08, 0.08)) return c(245 * k, 50 * k, 50 * k)
  if (box(u, v, 0.46, 0.46, 0.54, 0.96) || box(u, v, 0.54, 0.76, 0.66, 0.82) || box(u, v, 0.54, 0.88, 0.63, 0.94)) return c(225 * k, 40 * k, 40 * k)
  return -1
}
const shotgunSpr = (u: number, v: number) => {
  if (box(u, v, 0.05, 0.58, 0.62, 0.66)) return c(78, 78, 90)
  if (box(u, v, 0.05, 0.66, 0.55, 0.72)) return c(58, 58, 68)
  if (box(u, v, 0.6, 0.55, 0.95, 0.78)) return c(130 - (u - 0.6) * 40, 80, 42)
  return -1
}
const chaingunSpr = (u: number, v: number) => {
  if (box(u, v, 0.08, 0.5, 0.56, 0.56) || box(u, v, 0.08, 0.58, 0.56, 0.64) || box(u, v, 0.08, 0.66, 0.56, 0.72)) return c(90, 90, 100)
  if (box(u, v, 0.5, 0.46, 0.92, 0.78)) return c(66, 68, 78 + (v - 0.46) * 60)
  if (box(u, v, 0.6, 0.78, 0.8, 0.92)) return c(130, 110, 50)
  return -1
}
const ballSpr = (u: number, v: number, big: boolean) => {
  const d = Math.hypot(u - 0.5, v - 0.5) * 2
  if (d > 1) return -1
  const k = 1 - d
  return big ? c(120 + k * 135, 255 * Math.min(1, k * 1.6 + 0.2), 60 + k * 100) : c(255, 90 + k * 165, 20 + k * 80)
}
const boomSpr = (u: number, v: number, t: number) => {
  const d = Math.hypot(u - 0.5, v - 0.5) * 2
  const n = hash((u * 24) | 0, (v * 24) | 0, 32 + t)
  if (d > 0.7 + n * 0.3) return -1
  const k = 1 - d
  return t < 3 ? c(255, 220 * k + 35, 90 * k) : c(220 * k + 35, 90 * k + 20, 20)
}
const corpseSpr = (u: number, v: number, kind: Kind) => {
  if (!ell(u, v, 0.5, 0.7, 0.5, 0.3)) return -1
  if (ell(u, v, 0.5, 0.66, 0.3, 0.17)) {
    const col = kind === 'zombie' ? [70, 100, 60] : kind === 'demon' ? [190, 90, 100] : kind === 'baron' ? [150, 56, 46] : [120, 64, 42]
    const k = 0.55 + hash((u * 30) | 0, (v * 30) | 0, 40) * 0.3
    return c(col[0]! * k, col[1]! * k, col[2]! * k)
  }
  return c(105 + hash((u * 30) | 0, (v * 30) | 0, 41) * 30, 18, 18)
}

const sprite = (kind: Kind, u: number, v: number, st: St) => {
  switch (kind) {
    case 'zombie': return zombieSpr(u, v, st)
    case 'imp': return impSpr(u, v, st)
    case 'demon': return demonSpr(u, v, st)
    case 'baron': return baronSpr(u, v, st)
    case 'barrel': return barrelSpr(u, v, st)
    case 'health': return healthSpr(u, v)
    case 'ammo': return ammoSpr(u, v)
    case 'armor': return armorSpr(u, v)
    case 'key': return keySpr(u, v, st)
    case 'shotgun': return shotgunSpr(u, v)
    default: return chaingunSpr(u, v)
  }
}

// size relative to a wall, width as a multiple of height, and how far above the floor it floats
const SPR: Record<Kind, { scale: number; aspect: number; lift: number }> = {
  zombie: { scale: 0.85, aspect: 0.5, lift: 0 },
  imp: { scale: 0.9, aspect: 0.55, lift: 0 },
  demon: { scale: 0.8, aspect: 0.9, lift: 0 },
  baron: { scale: 1.15, aspect: 0.65, lift: 0 },
  barrel: { scale: 0.6, aspect: 0.55, lift: 0 },
  health: { scale: 0.3, aspect: 1, lift: 0 },
  ammo: { scale: 0.26, aspect: 1.1, lift: 0 },
  armor: { scale: 0.32, aspect: 1, lift: 0 },
  key: { scale: 0.34, aspect: 0.7, lift: 0.18 },
  shotgun: { scale: 0.26, aspect: 2.2, lift: 0 },
  chaingun: { scale: 0.3, aspect: 2, lift: 0 },
}

// ───────────────────────────── game state ─────────────────────────────

const freshCarry = (): Carry => ({ hp: 100, armor: 0, ammo: 40, have: [true, false, false], weapon: 0 })

const newGame = (): Game => ({
  mode: 'title', lvl: 0, w: 0, h: 0, grid: [], doors: {},
  x: 1.5, y: 1.5, dir: 0, hp: 100, armor: 0, ammo: 40, weapon: 0, have: [true, false, false], red: false,
  ents: [], projs: [], fx: [], kills: 0, totalKills: 0, items: 0, totalItems: 0, time: 0, tick: 0,
  msg: '', msgT: 0, flash: 0, pain: 0, pick: 0, cd: 0, bob: 0, fwd: 0, str: 0, trn: 0, fireT: 0,
  showMap: true, start: freshCarry(), doneKills: 0, doneItems: 0, doneTime: 0,
})

const say = (g: Game, m: string, t = 40) => {
  g.msg = m
  g.msgT = t
}

const loadLevel = (g: Game, idx: number, carry: Carry) => {
  const L = LEVELS[idx]!
  g.lvl = idx
  g.h = L.rows.length
  g.w = Math.max(...L.rows.map(r => r.length))
  g.grid = []
  g.doors = {}
  g.ents = []
  g.projs = []
  g.fx = []
  for (let y = 0; y < g.h; y++) {
    const row: number[] = []
    for (let x = 0; x < g.w; x++) {
      let ch = L.rows[y]![x] ?? '1'
      if (ch === '1') ch = L.theme
      let v = 0
      if (ch >= '1' && ch <= '6') v = Number(ch)
      else if (ch === 'D' || ch === 'L') {
        v = ch === 'D' ? 7 : 8
        g.doors[x + ',' + y] = { f: 0, locked: ch === 'L' }
      } else if (ch === 'P') {
        g.x = x + 0.5
        g.y = y + 0.5
      } else if (ENT_CHARS[ch]) {
        const kind = ENT_CHARS[ch]!
        g.ents.push({
          kind, x: x + 0.5, y: y + 0.5, hp: MON[kind]?.hp ?? (kind === 'barrel' ? 2 : 1),
          cool: 20 + ((hash(x, y, 50) * 30) | 0), hurt: 0, dying: 0, atk: 0, alert: false, anim: (hash(x, y, 51) * 20) | 0,
        })
      }
      row.push(v)
    }
    g.grid.push(row)
  }
  g.dir = L.dir
  g.hp = carry.hp
  g.armor = carry.armor
  g.ammo = carry.ammo
  g.have = carry.have.slice()
  g.weapon = carry.weapon
  g.start = { hp: carry.hp, armor: carry.armor, ammo: carry.ammo, have: carry.have.slice(), weapon: carry.weapon }
  g.red = false
  g.kills = 0
  g.items = 0
  g.totalKills = g.ents.filter(e => isMon(e.kind)).length
  g.totalItems = g.ents.filter(e => isItem(e.kind) && e.kind !== 'key').length
  g.time = 0
  g.flash = g.pain = g.pick = g.cd = g.bob = g.fwd = g.str = g.trn = g.fireT = 0
  g.mode = 'play'
  say(g, L.name, 60)
}

const wallAt = (g: Game, mx: number, my: number) => {
  const v = g.grid[my]?.[mx]
  if (v === undefined) return 1
  if (v >= 7) {
    const d = g.doors[mx + ',' + my]
    return d && d.f >= 0.99 ? 0 : v
  }
  return v
}
const solidAt = (g: Game, x: number, y: number) => {
  const mx = Math.floor(x)
  const my = Math.floor(y)
  const v = g.grid[my]?.[mx]
  if (v === undefined) return true
  if (v === 0) return false
  if (v >= 7) {
    const d = g.doors[mx + ',' + my]
    return !d || d.f < 0.8
  }
  return true
}
const blocked = (g: Game, x: number, y: number, r: number) =>
  solidAt(g, x - r, y - r) || solidAt(g, x + r, y - r) || solidAt(g, x - r, y + r) || solidAt(g, x + r, y + r)
const opaque = (g: Game, x: number, y: number) => wallAt(g, Math.floor(x), Math.floor(y)) !== 0

const castDist = (g: Game, x: number, y: number, a: number, max: number) => {
  const dx = Math.cos(a) * 0.05
  const dy = Math.sin(a) * 0.05
  let px = x
  let py = y
  for (let t = 0; t < max; t += 0.05) {
    if (opaque(g, px, py)) return t
    px += dx
    py += dy
  }
  return max
}
const clear = (g: Game, x0: number, y0: number, x1: number, y1: number) => {
  const d = Math.hypot(x1 - x0, y1 - y0)
  const n = Math.ceil(d / 0.2)
  for (let i = 1; i < n; i++) {
    const t = i / n
    if (opaque(g, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false
  }
  return true
}

const tryMove = (g: Game, dx: number, dy: number) => {
  if (!blocked(g, g.x + dx, g.y, 0.22)) g.x += dx
  if (!blocked(g, g.x, g.y + dy, 0.22)) g.y += dy
}

const hurtPlayer = (g: Game, dmg: number) => {
  if (g.mode !== 'play') return
  const a = Math.min(g.armor, Math.floor(dmg / 2))
  g.armor -= a
  g.hp -= dmg - a
  g.pain = 4
  if (g.hp <= 0) {
    g.hp = 0
    g.mode = 'dead'
    g.fwd = g.str = g.trn = g.fireT = 0
  }
}

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))

const explode = (g: Game, e: Ent) => {
  e.hp = 0
  g.fx.push({ x: e.x, y: e.y, t: 0 })
  const dp = Math.hypot(g.x - e.x, g.y - e.y)
  if (dp < 3.2) hurtPlayer(g, Math.max(1, Math.round(36 * (1 - dp / 3.2))))
  for (const o of g.ents.slice()) {
    if (o === e) continue
    const d = Math.hypot(o.x - e.x, o.y - e.y)
    if (d < 3.2 && (isMon(o.kind) || o.kind === 'barrel')) hitEnt(g, o, Math.round(18 * (1 - d / 3.2)) + 2)
  }
}

const kill = (g: Game, e: Ent) => {
  e.dying = 1
  g.kills++
  if ((e.kind === 'zombie' || e.kind === 'imp') && Math.random() < 0.5) {
    g.ents.push({ kind: 'ammo', x: e.x, y: e.y, hp: 1, cool: 0, hurt: 0, dying: 0, atk: 0, alert: false, anim: 0, drop: true })
  }
}

const hitEnt = (g: Game, e: Ent, dmg: number) => {
  if (e.dying > 0 || (e.kind === 'barrel' && e.hp <= 0)) return
  e.hp -= dmg
  e.hurt = 3
  e.alert = true
  if (e.hp <= 0) {
    if (e.kind === 'barrel') explode(g, e)
    else kill(g, e)
  }
}

const shoot = (g: Game) => {
  const w = WEAPONS[g.weapon]!
  g.ammo -= w.cost
  g.cd = w.cd
  g.flash = w.flash
  for (const e of g.ents) {
    if (isMon(e.kind) && e.dying === 0 && Math.hypot(e.x - g.x, e.y - g.y) < 12 && clear(g, g.x, g.y, e.x, e.y)) e.alert = true
  }
  for (let p = 0; p < w.pellets; p++) {
    const a = g.dir + (Math.random() - 0.5) * 2 * w.spread
    const ca = Math.cos(a)
    const sa = Math.sin(a)
    let bd = castDist(g, g.x, g.y, a, 30)
    let best: Ent | undefined
    for (const e of g.ents) {
      if (!(isMon(e.kind) || e.kind === 'barrel') || e.dying > 0 || (e.kind === 'barrel' && e.hp <= 0)) continue
      const dx = e.x - g.x
      const dy = e.y - g.y
      const along = dx * ca + dy * sa
      if (along <= 0.1 || along > bd) continue
      if (Math.abs(-dx * sa + dy * ca) > 0.32) continue
      best = e
      bd = along
    }
    if (best) hitEnt(g, best, w.dmg)
  }
}

const press = (g: Game, k: string) => {
  if (k.length === 1) k = k.toLowerCase()
  if (k === 'space' || k === 'spacebar') k = ' '
  else if (k === 'enter') k = 'return'
  const go = k === ' ' || k === 'return' || k === 'x'
  if (g.mode === 'title') {
    if (go) loadLevel(g, 0, freshCarry())
    return
  }
  if (g.mode === 'done') {
    if (go) {
      if (g.lvl + 1 >= LEVELS.length) g.mode = 'won'
      else loadLevel(g, g.lvl + 1, { hp: g.hp, armor: g.armor, ammo: g.ammo, have: g.have, weapon: g.weapon })
    }
    return
  }
  if (g.mode === 'won') {
    if (go || k === 'r') Object.assign(g, newGame())
    return
  }
  if (g.mode === 'dead') {
    if (go || k === 'r') loadLevel(g, g.lvl, { ...g.start, hp: 100, ammo: Math.max(g.start.ammo, 40) })
    return
  }
  if (k === 'up' || k === 'w') g.fwd = LATCH
  else if (k === 'down' || k === 's') g.fwd = -LATCH
  else if (k === 'left' || k === 'a') g.trn = -LATCH
  else if (k === 'right' || k === 'd') g.trn = LATCH
  else if (k === 'e') g.str = LATCH
  else if (k === 'q') g.str = -LATCH
  else if (k === ' ' || k === 'f') g.fireT = 3
  else if (k === 'x' || k === 'return') useSwitch(g)
  else if (k === 'm') g.showMap = !g.showMap
  else if (k === 'r') loadLevel(g, g.lvl, g.start)
  else if (k === '1' || k === '2' || k === '3') {
    const i = Number(k) - 1
    if (g.have[i]) {
      g.weapon = i
      say(g, WEAPONS[i]!.name, 20)
    } else say(g, 'You do not have that weapon', 25)
  }
}

const useSwitch = (g: Game) => {
  const d = castDist(g, g.x, g.y, g.dir, 1.8)
  const px = g.x + Math.cos(g.dir) * (d + 0.05)
  const py = g.y + Math.sin(g.dir) * (d + 0.05)
  if (wallAt(g, Math.floor(px), Math.floor(py)) === 6) {
    g.mode = 'done'
    g.doneKills = g.kills
    g.doneItems = g.items
    g.doneTime = g.time
    g.fwd = g.str = g.trn = g.fireT = 0
  } else say(g, 'Nothing to use here', 20)
}

const tickGame = (g: Game) => {
  g.tick++
  if (g.flash > 0) g.flash--
  if (g.pain > 0) g.pain--
  if (g.pick > 0) g.pick--
  if (g.cd > 0) g.cd--
  if (g.msgT > 0) g.msgT--
  for (const f of g.fx) f.t++
  g.fx = g.fx.filter(f => f.t < 7)
  if (g.mode !== 'play') {
    for (const e of g.ents) if (e.dying > 0 && e.dying < 8) e.dying++
    return
  }
  g.time++

  // movement intents
  let moved = false
  const ca = Math.cos(g.dir)
  const sa = Math.sin(g.dir)
  if (g.fwd !== 0) {
    const s = g.fwd > 0 ? 1 : -1
    tryMove(g, ca * SPEED * s, sa * SPEED * s)
    g.fwd -= s
    moved = true
  }
  if (g.str !== 0) {
    const s = g.str > 0 ? 1 : -1
    tryMove(g, -sa * SPEED * s, ca * SPEED * s)
    g.str -= s
    moved = true
  }
  if (g.trn !== 0) {
    const s = g.trn > 0 ? 1 : -1
    g.dir += TURN * s
    g.trn -= s
  }
  g.bob = moved ? g.bob + 0.5 : g.bob * 0.8

  // weapon
  if (g.fireT > 0) {
    g.fireT--
    const w = WEAPONS[g.weapon]!
    if (g.cd <= 0) {
      if (g.ammo >= w.cost) shoot(g)
      else say(g, 'Out of ammo!', 20)
    }
  }

  // doors
  for (const k in g.doors) {
    const d = g.doors[k]!
    const [dx, dy] = k.split(',').map(Number) as [number, number]
    const cx = dx + 0.5
    const cy = dy + 0.5
    const pd = Math.hypot(g.x - cx, g.y - cy)
    let want = false
    if (pd < 1.7) {
      if (!d.locked || g.red) want = true
      else say(g, 'You need the RED key', 20)
    }
    if (!want && !d.locked) {
      for (const e of g.ents) {
        if (isMon(e.kind) && e.dying === 0 && Math.hypot(e.x - cx, e.y - cy) < 1.4) {
          want = true
          break
        }
      }
    }
    if (want) d.f = Math.min(1, d.f + 0.15)
    else if (pd > 1 && d.f > 0) d.f = Math.max(0, d.f - 0.08)
  }

  // monsters
  for (const e of g.ents) {
    if (!isMon(e.kind)) continue
    if (e.dying > 0) {
      if (e.dying < 8) e.dying++
      continue
    }
    if (e.hurt > 0) e.hurt--
    if (e.atk > 0) e.atk--
    const dx = g.x - e.x
    const dy = g.y - e.y
    const d = Math.hypot(dx, dy)
    const sees = d < 16 && clear(g, e.x, e.y, g.x, g.y)
    if (sees) e.alert = true
    if (!e.alert) continue
    const m = MON[e.kind]!
    e.anim++
    if (e.cool > 0) e.cool--
    if (d > m.pref || !sees) {
      const sp = m.speed
      let mx = (dx / d) * sp
      let my = (dy / d) * sp
      if (Math.random() < 0.08) {
        const t = mx
        mx = -my * 0.8
        my = t * 0.8
      }
      const free = (nx: number, ny: number) => {
        if (blocked(g, nx, ny, 0.25)) return false
        for (const o of g.ents) if (o !== e && isMon(o.kind) && o.dying === 0 && Math.hypot(o.x - nx, o.y - ny) < 0.5) return false
        return Math.hypot(g.x - nx, g.y - ny) > 0.7
      }
      if (free(e.x + mx, e.y)) e.x += mx
      if (free(e.x, e.y + my)) e.y += my
    }
    if (!sees || e.cool > 0) continue
    const aim = Math.atan2(dy, dx)
    if (e.kind === 'zombie' && d < 12) {
      e.cool = rnd(26, 50)
      e.atk = 4
      if (Math.random() < Math.max(0.15, 0.8 - d * 0.07)) hurtPlayer(g, rnd(4, 9))
    } else if (e.kind === 'imp') {
      e.atk = 4
      if (d < 1.4) {
        e.cool = 18
        hurtPlayer(g, rnd(5, 9))
      } else if (d < 14) {
        e.cool = rnd(36, 66)
        g.projs.push({ x: e.x, y: e.y, vx: Math.cos(aim) * 0.2, vy: Math.sin(aim) * 0.2, dmg: rnd(7, 10), big: false })
      }
    } else if (e.kind === 'demon' && d < 1.3) {
      e.cool = 14
      e.atk = 4
      hurtPlayer(g, rnd(8, 14))
    } else if (e.kind === 'baron') {
      e.atk = 5
      if (d < 1.7) {
        e.cool = 20
        hurtPlayer(g, rnd(12, 20))
      } else if (d < 16) {
        e.cool = rnd(44, 66)
        for (const off of [-0.12, 0.12]) {
          g.projs.push({ x: e.x, y: e.y, vx: Math.cos(aim + off) * 0.19, vy: Math.sin(aim + off) * 0.19, dmg: rnd(10, 14), big: true })
        }
      }
    }
  }

  // projectiles
  const alive: Proj[] = []
  for (const p of g.projs) {
    let dead = false
    for (let i = 0; i < 2 && !dead; i++) {
      p.x += p.vx / 2
      p.y += p.vy / 2
      if (opaque(g, p.x, p.y)) {
        dead = true
        g.fx.push({ x: p.x - p.vx, y: p.y - p.vy, t: 4 })
      } else if (Math.hypot(g.x - p.x, g.y - p.y) < 0.45) {
        hurtPlayer(g, p.dmg)
        dead = true
      }
    }
    if (!dead) alive.push(p)
  }
  g.projs = alive

  // pickups
  for (const e of g.ents) {
    if (!isItem(e.kind) || e.got || Math.hypot(e.x - g.x, e.y - g.y) > 0.7) continue
    let took = true
    if (e.kind === 'health') {
      if (g.hp >= 100) took = false
      else {
        g.hp = Math.min(100, g.hp + 25)
        say(g, 'Picked up a medkit')
      }
    } else if (e.kind === 'ammo') {
      if (g.ammo >= 200) took = false
      else {
        g.ammo = Math.min(200, g.ammo + (e.drop ? 8 : 15))
        say(g, 'Picked up ammo')
      }
    } else if (e.kind === 'armor') {
      if (g.armor >= 100) took = false
      else {
        g.armor = Math.min(100, g.armor + 50)
        say(g, 'Picked up armor')
      }
    } else if (e.kind === 'key') {
      g.red = true
      say(g, 'You got the RED KEY!', 60)
    } else if (e.kind === 'shotgun') {
      g.have[1] = true
      g.weapon = 1
      g.ammo = Math.min(200, g.ammo + 8)
      say(g, 'You got the SHOTGUN! (2)', 60)
    } else if (e.kind === 'chaingun') {
      g.have[2] = true
      g.weapon = 2
      g.ammo = Math.min(200, g.ammo + 20)
      say(g, 'You got the CHAINGUN! (3)', 60)
    }
    if (took) {
      e.got = true
      g.pick = 3
      if (!e.drop && e.kind !== 'key') g.items++
    }
  }
  g.ents = g.ents.filter(e => !e.got && !(e.kind === 'barrel' && e.hp <= 0))
}

// ───────────────────────────── rendering ─────────────────────────────

const renderBuf = (g: Game, W: number, H: number): Int32Array => {
  const L = LEVELS[g.lvl]!
  const buf = new Int32Array(W * H)
  const zbuf = new Float64Array(W)
  const half = H / 2
  const dirX = Math.cos(g.dir)
  const dirY = Math.sin(g.dir)
  const planeX = -dirY * 0.66
  const planeY = dirX * 0.66
  const floor = FLOORS[L.floor]!
  const ceil = CEILS[L.ceil]!

  // floor and ceiling
  for (let y = Math.ceil(half); y < H; y++) {
    const rowDist = half / (y - half + 0.5)
    const k = Math.max(0.08, 1 / (1 + rowDist * 0.16))
    const fx0 = g.x + rowDist * (dirX - planeX)
    const fy0 = g.y + rowDist * (dirY - planeY)
    const sx = (rowDist * 2 * planeX) / W
    const sy = (rowDist * 2 * planeY) / W
    let fx = fx0
    let fy = fy0
    const yc = H - 1 - y
    for (let x = 0; x < W; x++) {
      const tx = Math.floor(fx * T) & 63
      const ty = Math.floor(fy * T) & 63
      const f = floor[ty * T + tx]!
      const q = ceil[ty * T + tx]!
      buf[y * W + x] = c(((f >> 16) & 255) * k, ((f >> 8) & 255) * k, (f & 255) * k)
      buf[yc * W + x] = c(((q >> 16) & 255) * k * 0.9, ((q >> 8) & 255) * k * 0.9, (q & 255) * k * 0.9)
      fx += sx
      fy += sy
    }
  }

  // walls
  for (let x = 0; x < W; x++) {
    const camX = (2 * x) / W - 1
    const rx = dirX + planeX * camX
    const ry = dirY + planeY * camX
    let mx = Math.floor(g.x)
    let my = Math.floor(g.y)
    const ddx = Math.abs(1 / (rx || 1e-9))
    const ddy = Math.abs(1 / (ry || 1e-9))
    const stx = rx < 0 ? -1 : 1
    const sty = ry < 0 ? -1 : 1
    let sdx = (rx < 0 ? g.x - mx : mx + 1 - g.x) * ddx
    let sdy = (ry < 0 ? g.y - my : my + 1 - g.y) * ddy
    let side = 0
    let hit = 0
    for (let i = 0; i < 64 && !hit; i++) {
      if (sdx < sdy) {
        sdx += ddx
        mx += stx
        side = 0
      } else {
        sdy += ddy
        my += sty
        side = 1
      }
      hit = wallAt(g, mx, my)
    }
    if (!hit) hit = 1
    const dist = Math.max(0.05, side === 0 ? sdx - ddx : sdy - ddy)
    zbuf[x] = dist
    let wx = side === 0 ? g.y + dist * ry : g.x + dist * rx
    wx -= Math.floor(wx)
    let tx = Math.floor(wx * T)
    if ((side === 0 && rx > 0) || (side === 1 && ry < 0)) tx = T - 1 - tx
    const tex = WALLTEX[hit] ?? brick
    const lh = H / dist
    const open = hit >= 7 ? (g.doors[mx + ',' + my]?.f ?? 0) : 0
    const top0 = half - lh / 2 - open * lh
    const y0 = Math.max(0, Math.floor(top0))
    const y1 = Math.min(H - 1, Math.floor(top0 + lh))
    const k = (side ? 0.68 : 1) * Math.max(0.1, 1 / (1 + dist * 0.2))
    const step = T / lh
    let ty = (y0 - top0) * step
    for (let y = y0; y <= y1; y++) {
      const p = tex[(Math.floor(ty) & 63) * T + tx]!
      buf[y * W + x] = c(((p >> 16) & 255) * k, ((p >> 8) & 255) * k, (p & 255) * k)
      ty += step
    }
  }

  // sprites
  type Spr = { x: number; y: number; kind: Kind | 'ball' | 'bigball' | 'boom' | 'dead'; ent?: Ent; t: number; d: number }
  const list: Spr[] = []
  for (const e of g.ents) {
    const dying = e.dying
    list.push({ x: e.x, y: e.y, kind: dying >= 8 ? 'dead' : e.kind, ent: e, t: g.tick, d: Math.hypot(e.x - g.x, e.y - g.y) })
  }
  for (const p of g.projs) list.push({ x: p.x, y: p.y, kind: p.big ? 'bigball' : 'ball', t: g.tick, d: Math.hypot(p.x - g.x, p.y - g.y) })
  for (const f of g.fx) list.push({ x: f.x, y: f.y, kind: 'boom', t: f.t, d: Math.hypot(f.x - g.x, f.y - g.y) })
  list.sort((a, b) => b.d - a.d)
  const inv = 1 / (planeX * dirY - dirX * planeY)
  for (const s of list) {
    const dx = s.x - g.x
    const dy = s.y - g.y
    const tx = inv * (dirY * dx - dirX * dy)
    const ty = inv * (-planeY * dx + planeX * dy)
    if (ty < 0.15) continue
    const cx = (W / 2) * (1 + tx / ty)
    const unit = H / ty
    let scale = 0.3
    let aspect = 1
    let lift = 0.2
    let kind: Kind | undefined
    if (s.kind === 'dead') {
      kind = s.ent!.kind
      scale = 0.22
      aspect = 2.6
      lift = 0
    } else if (s.kind === 'ball' || s.kind === 'bigball') {
      scale = s.kind === 'ball' ? 0.28 : 0.4
      lift = 0.3
    } else if (s.kind === 'boom') {
      scale = 0.5 + s.t * 0.14
      aspect = 1
      lift = 0.1
    } else {
      kind = s.kind
      const sp = SPR[kind]
      scale = sp.scale
      aspect = sp.aspect
      lift = sp.lift
      if (s.ent && s.ent.dying > 0) scale *= 1 - (s.ent.dying / 8) * 0.55
      if (kind === 'key') lift += Math.sin(g.tick * 0.2) * 0.05
    }
    const sh = scale * unit
    const sw = sh * aspect
    const yb = half + unit / 2 - lift * unit
    const y0 = Math.floor(yb - sh)
    const x0 = Math.floor(cx - sw / 2)
    const k = Math.max(0.2, 1 / (1 + ty * 0.15))
    const e = s.ent
    const st: St = {
      f: e && isMon(e.kind) ? (e.atk > 0 ? 2 : (e.anim >> 2) & 1) : 0,
      hurt: !!e && e.hurt > 0,
      t: g.tick,
    }
    const bright = s.kind === 'ball' || s.kind === 'bigball' || s.kind === 'boom'
    for (let px = Math.max(0, x0); px < Math.min(W, x0 + sw); px++) {
      if (ty >= zbuf[px]!) continue
      const u = (px - x0) / sw
      for (let py = Math.max(0, y0); py < Math.min(H, Math.ceil(yb)); py++) {
        const v = (py - y0) / sh
        let col: number
        if (s.kind === 'dead') col = corpseSpr(u, v, kind!)
        else if (s.kind === 'ball') col = ballSpr(u, v, false)
        else if (s.kind === 'bigball') col = ballSpr(u, v, true)
        else if (s.kind === 'boom') col = boomSpr(u, v, s.t)
        else col = sprite(kind!, u, v, st)
        if (col < 0) continue
        if (e && e.dying > 0 && e.dying < 8) col = c(((col >> 16) & 255) * 0.5 + 90, ((col >> 8) & 255) * 0.4, (col & 255) * 0.4)
        buf[py * W + px] = bright ? col : c(((col >> 16) & 255) * k, ((col >> 8) & 255) * k, (col & 255) * k)
      }
    }
  }

  // weapon in hand
  drawWeapon(buf, W, H, g)

  // minimap
  if (g.showMap && W >= g.w + 8 && H >= g.h + 6) {
    const ox = W - g.w - 3
    const oy = 3
    for (let y = 0; y < g.h; y++) {
      for (let x = 0; x < g.w; x++) {
        const v = g.grid[y]![x]!
        const col = v === 0 ? c(18, 18, 30) : v === 6 ? c(60, 230, 90) : v === 7 ? c(225, 190, 40) : v === 8 ? c(225, 40, 40) : c(105, 105, 120)
        buf[(oy + y) * W + ox + x] = col
      }
    }
    for (const e of g.ents) {
      if (e.dying > 0 || e.got) continue
      const col = isMon(e.kind) ? c(255, 50, 50) : e.kind === 'barrel' ? c(255, 140, 30) : c(60, 220, 90)
      const ex = ox + Math.floor(e.x)
      const ey = oy + Math.floor(e.y)
      buf[ey * W + ex] = col
    }
    buf[(oy + Math.floor(g.y)) * W + ox + Math.floor(g.x)] = g.tick % 8 < 4 ? c(255, 255, 255) : c(120, 160, 255)
  }

  // screen tints
  if (g.pain > 0 || g.pick > 0 || g.mode === 'dead') {
    const dead = g.mode === 'dead'
    for (let i = 0; i < buf.length; i++) {
      const p = buf[i]!
      let r = (p >> 16) & 255
      let gg = (p >> 8) & 255
      let b = p & 255
      if (dead) {
        r = r * 0.7 + 70
        gg *= 0.3
        b *= 0.3
      } else if (g.pain > 0) r = Math.min(255, r + 80 + g.pain * 12)
      else {
        r = Math.min(255, r + 35)
        gg = Math.min(255, gg + 30)
      }
      buf[i] = c(r, gg, b)
    }
  }
  return buf
}

const drawWeapon = (buf: Int32Array, W: number, H: number, g: Game) => {
  const w = WEAPONS[g.weapon]!
  const u = H / 46
  const rect = (x0: number, y0: number, x1: number, y1: number, col: number, shade = true) => {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(H, Math.ceil(y1)); y++) {
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, Math.ceil(x1)); x++) {
        let k = 1
        if (shade) k = 0.75 + 0.5 * ((x - x0) / Math.max(1, x1 - x0))
        buf[y * W + x] = c(((col >> 16) & 255) * k, ((col >> 8) & 255) * k, (col & 255) * k)
      }
    }
  }
  const cx = W / 2 + Math.sin(g.bob) * u * 2
  const kick = g.cd > 0 ? Math.min(1, g.cd / w.cd) * u * 2.2 : 0
  const by = H + 1 + Math.abs(Math.cos(g.bob)) * u * 1.5 + kick
  const skin = c(205, 150, 110)
  let tip = by - 17 * u
  if (g.weapon === 0) {
    rect(cx - 5 * u, by - 9 * u, cx + 5 * u, by, skin)
    rect(cx - 2.6 * u, by - 17 * u, cx + 2.6 * u, by - 8 * u, c(74, 74, 84))
    rect(cx - 0.6 * u, by - 17 * u, cx + 0.6 * u, by - 9 * u, c(120, 120, 134), false)
  } else if (g.weapon === 1) {
    tip = by - 28 * u
    rect(cx - 4 * u, by - 28 * u, cx - 0.3 * u, by - 6 * u, c(96, 96, 108))
    rect(cx + 0.3 * u, by - 28 * u, cx + 4 * u, by - 6 * u, c(70, 70, 82))
    rect(cx - 5.5 * u, by - 15 * u, cx + 5.5 * u, by - 9 * u, c(128, 80, 42))
    rect(cx - 7 * u, by - 8 * u, cx + 7 * u, by, skin)
  } else {
    tip = by - 27 * u
    const spin = g.cd > 0 ? g.tick & 1 : 0
    rect(cx - 8 * u, by - 18 * u, cx + 8 * u, by - 5 * u, c(86, 88, 98))
    for (let i = 0; i < 3; i++) {
      rect(cx + (-6 + i * 4.2) * u, by - 27 * u, cx + (-4.4 + i * 4.2) * u, by - 18 * u, (i + spin) % 2 ? c(124, 124, 136) : c(70, 70, 80))
    }
    rect(cx - 8 * u, by - 7 * u, cx + 8 * u, by, skin)
  }
  if (g.flash > 0) {
    const r = Math.round(u * (g.weapon === 1 ? 5.5 : 3.6))
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r * 1.4; dx <= r * 1.4; dx++) {
        const d = Math.abs(dx) / 1.4 + Math.abs(dy)
        const x = Math.floor(cx + dx)
        const y = Math.floor(tip + dy - u)
        if (d > r || x < 0 || x >= W || y < 0 || y >= H) continue
        buf[y * W + x] = d < r * 0.5 ? c(255, 255, 210) : c(255, 190 - d * 6, 60)
      }
    }
  }
}

// ───────────────────────────── screens ─────────────────────────────

const GLYPH: Record<string, string[]> = {
  R: ['####.', '#...#', '####.', '#..#.', '#...#'],
  U: ['#...#', '#...#', '#...#', '#...#', '.###.'],
  I: ['#####', '..#..', '..#..', '..#..', '#####'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#'],
}
const GRAD = ['#ff3b1f', '#ff5a1f', '#ff7a1f', '#ff9a1f', '#ffc21f']

const fmtTime = (ticks: number) => {
  const s = Math.floor((ticks * TICK) / 1000)
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
}

const quant = [0xf8f8f8, 0xf0f0f0, 0xe0e0e0, 0xc0c0c0, 0x808080]
const hex = (v: number) => '#' + v.toString(16).padStart(6, '0')

const Ruin: ClientModule<any, S> = (_props, surface) => {
  const { Box, Text } = surface.elements
  if (!surface.state) {
    const g = newGame()
    let n = 0
    surface.onKey(e => {
      press(g, e.key)
      surface.setState({ g, n: ++n })
    })
    surface.every(TICK, () => {
      tickGame(g)
      if (g.mode === 'play' || g.mode === 'dead') surface.setState({ g, n: ++n })
    })
    surface.setState({ g, n })
  }
  const g = surface.state?.g
  if (!g) return <Text>loading...</Text>

  const cols = Math.max(24, surface.columns || 80)
  const center = (s: string) => ' '.repeat(Math.max(0, Math.floor((cols - s.length) / 2))) + s

  if (g.mode === 'title') {
    const art: string[] = []
    for (let r = 0; r < 5; r++) {
      let line = ''
      for (const ch of 'RUIN') line += GLYPH[ch]![r]!.replace(/#/g, '██').replace(/\./g, '  ') + '  '
      art.push(line)
    }
    const info = [
      'a terminal shooter in the style of the 1993 classic',
      '',
      'W/S or Up/Down  move          A/D or Left/Right  turn',
      'Q / E  strafe                 SPACE / F  fire',
      '1 2 3  weapons                X  use the exit switch',
      'M  map     R  restart level   Esc  release the keys',
      '',
      'Doors open as you near them. Find the red key for red doors.',
      'Shoot the barrels. Reach the glowing green EXIT and press X.',
    ]
    return (
      <Box flexDirection="column">
        <Text> </Text>
        {art.map((l, i) => <Text color={GRAD[i]} bold>{center(l)}</Text>)}
        <Text> </Text>
        {info.map(l => <Text color="#c8c8d0">{center(l)}</Text>)}
        <Text> </Text>
        <Text color="#ffd23f" bold>{center('- press SPACE to start -')}</Text>
      </Box>
    )
  }

  if (g.mode === 'done' || g.mode === 'won') {
    const pc = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 100) + '%'
    const lines =
      g.mode === 'won'
        ? ['YOU HAVE CLEANSED THE KEEP', '', 'Thanks for playing.', '', 'press SPACE to return to the title']
        : [
            LEVELS[g.lvl]!.name + '  -  COMPLETE',
            '',
            'KILLS  ' + g.doneKills + '/' + g.totalKills + '  ' + pc(g.doneKills, g.totalKills),
            'ITEMS  ' + g.doneItems + '/' + g.totalItems + '  ' + pc(g.doneItems, g.totalItems),
            'TIME   ' + fmtTime(g.doneTime),
            '',
            g.lvl + 1 < LEVELS.length ? 'press SPACE for the next level' : 'press SPACE to finish',
          ]
    return (
      <Box flexDirection="column">
        <Text> </Text>
        <Text> </Text>
        {lines.map((l, i) => <Text color={i === 0 ? '#ffc21f' : '#e8e8f0'} bold={i === 0}>{center(l)}</Text>)}
      </Box>
    )
  }

  const W = Math.max(24, Math.min(cols, 100))
  const rows = Math.max(8, (surface.rows || 24) - 2)
  const H = rows * 2
  const buf = renderBuf(g, W, H)

  // stay inside the tree budget: coarsen colours until the picture fits
  const BUDGET = 60000
  let lines: { t: number; b: number; n: number }[][] = []
  for (const mask of quant) {
    lines = []
    let est = 0
    for (let r = 0; r < rows; r++) {
      const runs: { t: number; b: number; n: number }[] = []
      let x = 0
      while (x < W) {
        const t = buf[2 * r * W + x]! & mask
        const b = buf[(2 * r + 1) * W + x]! & mask
        let e = x + 1
        while (e < W && (buf[2 * r * W + e]! & mask) === t && (buf[(2 * r + 1) * W + e]! & mask) === b) e++
        runs.push({ t, b, n: e - x })
        est += (t === b ? 62 : 100) + (e - x)
        x = e
      }
      est += 40
      lines.push(runs)
    }
    if (est < BUDGET) break
  }

  const L = LEVELS[g.lvl]!
  const near = castDist(g, g.x, g.y, g.dir, 1.8)
  const facing = wallAt(g, Math.floor(g.x + Math.cos(g.dir) * (near + 0.05)), Math.floor(g.y + Math.sin(g.dir) * (near + 0.05))) === 6
  const msg =
    g.mode === 'dead' ? 'YOU DIED  -  press SPACE to try again' : g.msgT > 0 ? g.msg : facing ? 'Press X to use the exit' : L.name
  return (
    <Box flexDirection="column">
      {lines.map(runs => (
        <Box>
          {runs.map(r =>
            r.t === r.b ? (
              <Text color={hex(r.t)}>{'█'.repeat(r.n)}</Text>
            ) : (
              <Text color={hex(r.t)} backgroundColor={hex(r.b)}>{'▀'.repeat(r.n)}</Text>
            ),
          )}
        </Box>
      ))}
      <Text color={g.mode === 'dead' ? 'red' : '#ffd23f'} bold>{' ' + msg}</Text>
      <Box>
        <Text color={g.hp < 30 ? 'red' : 'green'} bold>{' HP ' + String(g.hp).padStart(3)}</Text>
        <Text color="cyan" bold>{'  ARMOR ' + String(g.armor).padStart(3)}</Text>
        <Text color="yellow" bold>{'  AMMO ' + String(g.ammo).padStart(3)}</Text>
        <Text color="white" bold>{'  ' + WEAPONS[g.weapon]!.name}</Text>
        <Text color={g.red ? 'red' : 'gray'} bold>{g.red ? '  [RED KEY]' : '  [no key]'}</Text>
        <Text color="#c8c8d0">{'  KILLS ' + g.kills + '/' + g.totalKills + '  ITEMS ' + g.items + '/' + g.totalItems}</Text>
      </Box>
    </Box>
  )
}

export default Ruin
