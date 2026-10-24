import { defaultBoard, type Vec3 } from "@party-board/board"

const tiles = new Map(defaultBoard.tiles.map((tile) => [tile.id, tile.position]))
const distance = (a: Vec3, b: Vec3) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])

export type TrailMotion = {
  playerId: string
  turnNumber: number
  startsAt: number
  millisecondsPerTile: number
  points: Vec3[]
  tangents: Vec3[]
  lengths: number[]
  distances: number[]
  warps: boolean[]
}
export type MotionSample = {
  position: [number, number, number]
  velocity: [number, number, number]
  distance: number
  opacity: number
  done: boolean
  warping: boolean
}
export function createMotionSample(): MotionSample {
  return {
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    distance: 0,
    opacity: 1,
    done: false,
    warping: false,
  }
}

/** Construct once per network movement segment, not once per render or frame. */
export function createTrailMotion(
  input: {
    playerId: string
    turnNumber: number
    fromTileId: string
    path: string[]
    millisecondsPerTile: number
  },
  startsAt: number,
): TrailMotion | null {
  const points = [input.fromTileId, ...input.path].map((id) => tiles.get(id))
  if (
    !input.path.length ||
    points.some((point) => !point) ||
    input.millisecondsPerTile <= 0 ||
    !Number.isFinite(input.millisecondsPerTile) ||
    !Number.isFinite(startsAt)
  )
    return null
  const positions = points as Vec3[]
  const lengths = positions.slice(1).map((point, index) => distance(positions[index]!, point))
  // The open world wraps logically to Start. Never draw a long flight through the entire map.
  const warps = lengths.map((length) => length > 8)
  const distances = [0]
  lengths.forEach((length, index) =>
    distances.push(distances[index]! + (warps[index] ? 0 : length)),
  )
  const tangents = positions.map((point, index): Vec3 => {
    if (!index || index === positions.length - 1 || warps[index - 1] || warps[index])
      return [0, 0, 0]
    const before = positions[index - 1]!
    const after = positions[index + 1]!
    const span = distance(before, after)
    const scale = span ? Math.min(lengths[index - 1]!, lengths[index]!) / span : 0
    return [
      (after[0] - before[0]) * scale,
      (after[1] - before[1]) * scale,
      (after[2] - before[2]) * scale,
    ]
  })
  return {
    playerId: input.playerId,
    turnNumber: input.turnNumber,
    startsAt,
    millisecondsPerTile: input.millisecondsPerTile,
    points: positions,
    tangents,
    lengths,
    distances,
    warps,
  }
}

/** Continuous C1 Hermite travel: exact tile arrivals, rounded bends, ease only at either end.
 * Mutates caller-owned storage: no React updates, vectors or arrays allocated per frame. */
export function sampleTrailMotion(motion: TrailMotion, now: number, out: MotionSample): void {
  const steps = motion.points.length - 1
  const progress = Math.max(
    0,
    Math.min(steps, (now - motion.startsAt) / motion.millisecondsPerTile),
  )
  const index = Math.min(steps - 1, Math.floor(progress))
  const t = progress - index
  const from = motion.points[index]!
  const to = motion.points[index + 1]!
  out.done = progress >= steps
  out.warping = motion.warps[index]!
  out.opacity = out.warping ? Math.pow(Math.abs(2 * t - 1), 0.7) : 1
  out.distance = motion.distances[index]! + (out.warping ? 0 : motion.lengths[index]! * t)
  const a = motion.tangents[index]!
  const b = motion.tangents[index + 1]!
  const t2 = t * t
  const t3 = t2 * t
  for (let axis = 0; axis < 3; axis++) {
    out.position[axis] = out.warping
      ? t < 0.5
        ? from[axis]!
        : to[axis]!
      : (2 * t3 - 3 * t2 + 1) * from[axis]! +
        (t3 - 2 * t2 + t) * a[axis]! +
        (-2 * t3 + 3 * t2) * to[axis]! +
        (t3 - t2) * b[axis]!
    out.velocity[axis] =
      out.warping || out.done || now < motion.startsAt
        ? 0
        : (((6 * t2 - 6 * t) * from[axis]! +
            (3 * t2 - 4 * t + 1) * a[axis]! +
            (-6 * t2 + 6 * t) * to[axis]! +
            (3 * t2 - 2 * t) * b[axis]!) *
            1000) /
          motion.millisecondsPerTile
  }
}

export function dampAngle(current: number, target: number, rate: number, delta: number): number {
  const shortest = Math.atan2(Math.sin(target - current), Math.cos(target - current))
  return current + shortest * (1 - Math.exp(-rate * delta))
}

export function smoothStep(value: number): number {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}
