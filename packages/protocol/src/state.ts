import { z } from "zod"

export const PLAYER_COLORS = ["coral", "cyan", "gold", "violet"] as const

export const gamePhaseSchema = z.enum([
  "LOBBY",
  "AWAITING_ROLL",
  "ROLLING",
  "MOVING",
  "TURN_END",
  "FINISHED",
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

export const gameStateSchema = z
  .object({
    roomCode: z.string().regex(/^[A-Z0-9]{4}$/),
    phase: gamePhaseSchema,
    players: z.array(publicPlayerSchema).max(4),
    currentPlayerId: z.string().min(1).max(64).nullable(),
    turnNumber: z.number().int().nonnegative(),
    lastRoll: z.number().int().min(1).max(6).nullable(),
  })
  .strict()

export type GamePhase = z.infer<typeof gamePhaseSchema>
export type PlayerColor = z.infer<typeof playerColorSchema>
export type PublicPlayer = z.infer<typeof publicPlayerSchema>
export type GameState = z.infer<typeof gameStateSchema>
