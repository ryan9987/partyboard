import { smoothStep } from "./trailMotion"

export const BALANCE_FALL_MS = 1400
export const BALANCE_SPLASH_AT_MS = 800
export const BALANCE_WINNER_REVEAL_MS = 1100

export function createBalanceFallSample() {
  return { x: 0, y: 0, z: 0, roll: 0, splash: 0, visible: true }
}

/** Server-timestamped, frame-independent motion. Reuse output storage inside the render loop. */
export function sampleBalanceFall(
  ageMs: number,
  lean: number,
  out: ReturnType<typeof createBalanceFallSample>,
) {
  const t = Math.max(0, Math.min(1, ageMs / BALANCE_FALL_MS))
  const side = lean < 0 ? -1 : 1
  const travel = smoothStep(t)
  out.x = side * 0.95 * travel
  out.y = Math.sin(t * Math.PI) * 0.14 - 1.7 * t * t
  out.z = travel * 0.4
  out.roll = -side * travel * 1.4
  out.splash = Math.max(0, Math.min(1, (ageMs - BALANCE_SPLASH_AT_MS) / 900))
  out.visible = ageMs < BALANCE_FALL_MS
  return out
}
