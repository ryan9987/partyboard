import { z } from "zod"

export const minigameKindSchema = z.enum(["balance", "fishing", "dodge", "archery", "rhythm"])
export type MinigameKind = z.infer<typeof minigameKindSchema>
export const MINIGAMES = {
  balance: {
    name: "Balance",
    instruction: "Tilt gently to stay centered on the rolling log.",
    action: "Steady",
    unit: "seconds",
  },
  fishing: {
    name: "Fishing",
    instruction: "Flick to cast. Keep the tension centered, then reel when the float dips.",
    action: "Cast / reel",
    unit: "catch points",
  },
  dodge: {
    name: "Dodge",
    instruction: "Tilt between three lanes. Watch the shadows before the acorns fall.",
    action: "Dodge",
    unit: "seconds",
  },
  archery: {
    name: "Archery",
    instruction: "Tilt to aim, then tap to release. Three arrows; closest to center wins.",
    action: "Release arrow",
    unit: "points",
  },
  rhythm: {
    name: "Rhythm",
    instruction: "Make a small wrist flick when the beat reaches the center line.",
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
    players: z.array(minigamePlayerSchema).min(2).max(4),
    winnerIds: z.array(z.string().min(1).max(64)).max(4),
    revision: z.number().int().nonnegative(),
  })
  .strict()
export type MinigameState = z.infer<typeof minigameStateSchema>
export type MinigamePlayer = z.infer<typeof minigamePlayerSchema>

// Shared deterministic cues; the server alone judges input time and awards points.
export function balanceLean(elapsed: number, index: number): number {
  return Math.sin(elapsed / 850 + index * 0.65) * 0.62
}
export function hazardLane(wave: number, index: number): number {
  return ((wave * 7 + index * 2 + Math.floor(wave / 3)) % 3) - 1
}
export function archeryDrift(elapsed: number): number {
  return Math.sin(elapsed / 730) * 0.28
}
export const RHYTHM_BEAT_MS = 750
