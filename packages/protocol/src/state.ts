import { z } from "zod"

export const PLAYER_COLORS = ["coral", "cyan", "gold", "violet"] as const

export const gamePhaseSchema = z.enum([
  "LOBBY",
  "AWAITING_ROLL",
  "ROLLING",
  "MOVING",
  "TURN_END",
  "FINISHED",
  "DUEL",
])

export const playerColorSchema = z.enum(PLAYER_COLORS)

export const publicPlayerSchema = z
  .object({
    id: z.string().min(1).max(64),
    name: z.string().trim().min(1).max(20),
    color: playerColorSchema,
    connected: z.boolean(),
    ready: z.boolean(),
    tileId: z.string().min(1).max(64),
  })
  .strict()

export const duelFighterSchema = z
  .object({
    playerId: z.string().min(1).max(64),
    score: z.number().int().min(0).max(2),
    action: z.enum(["idle", "swing", "guard", "hit"]),
    actionAt: z.number().int().nonnegative(),
  })
  .strict()

export const duelStateSchema = z
  .object({
    id: z.string().uuid(),
    tileId: z.string().min(1).max(64),
    stage: z.enum(["intro", "active", "result"]),
    fighters: z.tuple([duelFighterSchema, duelFighterSchema]),
    stageEndsAt: z.number().int().positive(),
    winnerId: z.string().min(1).max(64).nullable(),
    loserId: z.string().min(1).max(64).nullable(),
    outcome: z.enum(["pending", "hit", "block", "clash", "victory", "draw", "forfeit"]),
    revision: z.number().int().nonnegative(),
    penaltySpaces: z.number().int().min(0).max(3),
  })
  .strict()

export const gameStateSchema = z
  .object({
    roomCode: z.string().regex(/^[A-Z0-9]{4}$/),
    phase: gamePhaseSchema,
    players: z.array(publicPlayerSchema).max(4),
    currentPlayerId: z.string().min(1).max(64).nullable(),
    turnNumber: z.number().int().nonnegative(),
    lastRoll: z.number().int().min(1).max(6).nullable(),
    duel: duelStateSchema.nullable().optional(),
  })
  .strict()
  .superRefine((state, context) => {
    if (state.phase === "DUEL" && !state.duel)
      context.addIssue({
        code: "custom",
        message: "Duel phase requires combat state",
        path: ["duel"],
      })
    if (!state.duel) return
    const ids = state.duel.fighters.map((fighter) => fighter.playerId)
    if (
      state.phase !== "DUEL" ||
      new Set(ids).size !== 2 ||
      ids.some((id) => !state.players.some((player) => player.id === id))
    )
      context.addIssue({
        code: "custom",
        message: "Duel requires two distinct room players",
        path: ["duel", "fighters"],
      })
    const { winnerId, loserId, stage } = state.duel
    if (
      (winnerId && (!ids.includes(winnerId) || !loserId || winnerId === loserId)) ||
      (loserId && (!ids.includes(loserId) || !winnerId)) ||
      (stage !== "result" && (winnerId || loserId))
    )
      context.addIssue({ code: "custom", message: "Invalid duel result", path: ["duel"] })
  })

export type GamePhase = z.infer<typeof gamePhaseSchema>
export type PlayerColor = z.infer<typeof playerColorSchema>
export type PublicPlayer = z.infer<typeof publicPlayerSchema>
export type GameState = z.infer<typeof gameStateSchema>
export type DuelState = z.infer<typeof duelStateSchema>
