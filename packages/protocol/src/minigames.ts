import { z } from "zod"
import { MAX_PLAYERS } from "./players"

export const minigameKindSchema = z.enum(["balance", "fishing", "archery", "rhythm"])
export type MinigameKind = z.infer<typeof minigameKindSchema>
export const MINIGAMES = {
  balance: {
    name: "Balance",
    instruction: "Leaning left? Tilt or slide right. Leaning right? Go left. Stay on the log.",
    action: "Steady",
    unit: "seconds",
  },
  fishing: {
    name: "Fishing",
    instruction: "Hold your phone upright. Flick to cast; lift once when REEL NOW appears, or tap.",
    action: "Cast / reel",
    unit: "catch points",
  },
  archery: {
    name: "Archery",
    instruction: "Tilt to aim, then flick to release. Three arrows; highest total wins.",
    action: "Release arrow",
    unit: "points",
  },
  rhythm: {
    name: "Rhythm",
    instruction: "When the beat marker reaches the center line, flick once or tap Strike.",
    action: "Strike",
    unit: "points",
  },
} as const
export const minigamePlayerSchema = z
  .object({
    playerId: z.string().min(1).max(64),
    score: z.number().min(0).max(10000),
    alive: z.boolean(),
    axis: z.number().min(-1).max(1),
    position: z.number().min(-2).max(2),
    actionAt: z.number().int().nonnegative(),
    attempts: z.number().int().min(0).max(100),
    status: z.enum(["ready", "casting", "waiting", "bite", "caught", "miss", "hit", "out"]),
    shots: z
      .array(
        z
          .object({ offset: z.number().min(-1.3).max(1.3), at: z.number().int().nonnegative() })
          .strict(),
      )
      .max(3)
      .optional(),
  })
  .strict()
export const minigameStateSchema = z
  .object({
    id: z.string().uuid(),
    kind: minigameKindSchema,
    stage: z.enum(["intro", "active", "result"]),
    startsAt: z.number().int().positive(),
    endsAt: z.number().int().positive(),
    durationMs: z.number().int().positive(),
    players: z.array(minigamePlayerSchema).min(2).max(MAX_PLAYERS),
    winnerIds: z.array(z.string().min(1).max(64)).max(MAX_PLAYERS),
    revision: z.number().int().nonnegative(),
  })
  .strict()
export type MinigameState = z.infer<typeof minigameStateSchema>
export type MinigamePlayer = z.infer<typeof minigamePlayerSchema>

// Shared deterministic cues; the server alone judges input time and awards points.
export function balanceLean(elapsed: number, index: number): number {
  return Math.sin(elapsed / 850 + index * 0.65) * 0.62
}
export function archeryDrift(elapsed: number): number {
  return Math.sin(elapsed / 730) * 0.28
}
export const RHYTHM_BEAT_MS = 750

/** Shared cues/cooldowns; only the server decides catches and awards points. */
export const FISHING_RULES = {
  castFlightMs: 800,
  biteAtMs: 1800,
  reelUntilMs: 4200,
  resultHoldMs: 1200,
  maxCatchTilt: 0.75,
  strainTilt: 0.9,
  breakAfterSeconds: 1.2,
} as const
