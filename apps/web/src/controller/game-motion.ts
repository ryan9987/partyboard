import { isFishingFlick } from "./fishing-motion"

type Vector = { x: number | null; y: number | null; z: number | null } | null
type Rotation = { alpha: number | null; beta: number | null; gamma: number | null } | null

export function getMinigameMotionReading(
  event: Parameters<typeof getWristGesture>[0],
  axis: number,
  neutral: number | null,
  fishing = false,
) {
  const flick = fishing ? isFishingFlick(event) : getWristGesture(event) === "flick"
  const x = event.accelerationIncludingGravity?.x
  if (flick || typeof x !== "number" || !Number.isFinite(x)) return { axis, neutral, flick }
  const center = neutral ?? x
  return { axis: Math.max(-1, Math.min(1, (x - center) / 4.5)), neutral: center, flick }
}

/** Separate deliberate wrist flicks from sideways gravity tilt. */
export function getWristGesture(event: {
  rotationRate: Rotation
  acceleration: Vector
  accelerationIncludingGravity: Vector
}): "flick" | "tilt" | null {
  const finite = (value: number | null | undefined) => (Number.isFinite(value) ? (value ?? 0) : 0)
  const rotation = event.rotationRate
  const acceleration = event.acceleration
  if (
    Math.hypot(finite(rotation?.alpha), finite(rotation?.beta), finite(rotation?.gamma)) > 180 ||
    Math.hypot(finite(acceleration?.x), finite(acceleration?.y), finite(acceleration?.z)) > 12
  )
    return "flick"
  return Math.abs(finite(event.accelerationIncludingGravity?.x)) > 6 ? "tilt" : null
}
