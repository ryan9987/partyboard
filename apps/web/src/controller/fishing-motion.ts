import { FISHING_RULES, type MinigamePlayer } from "@party-board/protocol"
import type { getDuelGesture } from "./duel-motion"

type Motion = Parameters<typeof getDuelGesture>[0]
const magnitude = (values: Array<number | null | undefined>) =>
  Math.hypot(
    ...values.map((value) => (typeof value === "number" && Number.isFinite(value) ? value : 0)),
  )

/** A small wrist flick, not the large sword-swing threshold. Gravity is never an action. */
function strength(event: Motion): number {
  return Math.max(
    magnitude([event.rotationRate?.alpha, event.rotationRate?.beta, event.rotationRate?.gamma]) /
      110,
    magnitude([event.acceleration?.x, event.acceleration?.y, event.acceleration?.z]) / 6,
  )
}
export const isFishingFlick = (event: Motion): boolean => strength(event) >= 1

/** Require a quiet wrist between actions so one cast plus its backswing is just one gesture. */
export function createFishingFlickDetector() {
  let armed = true
  let quietSince: number | null = null
  let lastFlick = -Infinity
  return (event: Motion, now: number): boolean => {
    const level = strength(event)
    if (level >= 1) {
      quietSince = null
      if (!armed) return false
      armed = false
      if (now - lastFlick < 600) return false
      lastFlick = now
      return true
    }
    if (level < 0.35) {
      quietSince ??= now
      if (now - quietSince >= 180) armed = true
    } else quietSince = null
    return false
  }
}

export function canFishingAct(
  status: MinigamePlayer["status"],
  actionAt: number,
  now: number,
): boolean {
  return (
    status === "ready" ||
    status === "bite" ||
    ((status === "caught" || status === "miss") && now - actionAt >= FISHING_RULES.resultHoldMs)
  )
}
