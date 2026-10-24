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
  "SHOP",
  "POTATO",
])

export const playerColorSchema = z.enum(PLAYER_COLORS)
export const itemSchema = z.enum(["freeze", "boots", "shield"])
export type Item = z.infer<typeof itemSchema>
export const SHOP_ITEMS = {
  freeze: { name: "Frost Charm", price: 5, description: "Freeze an opponent's next board turn." },
  boots: { name: "Trail Boots", price: 4, description: "Add two spaces to your next roll." },
  shield: { name: "Leaf Shield", price: 4, description: "Block one incoming Frost Charm." },
} as const

export const publicPlayerSchema = z
  .object({
    id: z.string().min(1).max(64),
    name: z.string().trim().min(1).max(20),
    color: playerColorSchema,
    connected: z.boolean(),
    ready: z.boolean(),
    tileId: z.string().min(1).max(64),
    coins: z.number().int().min(0).max(999).optional(),
    inventory: z.array(itemSchema).max(3).optional(),
    frozen: z.boolean().optional(),
    shield: z.boolean().optional(),
    boosted: z.boolean().optional(),
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

export const shopStateSchema = z
  .object({
    id: z.string().uuid(),
    playerId: z.string().min(1).max(64),
    tileId: z.string().min(1).max(64),
    endsAt: z.number().int().positive(),
  })
  .strict()

export const potatoStateSchema = z
  .object({
    id: z.string().uuid(),
    stage: z.enum(["intro", "active", "result"]),
    participantIds: z.array(z.string().min(1).max(64)).min(2).max(4),
    aliveIds: z.array(z.string().min(1).max(64)).max(4),
    holderId: z.string().min(1).max(64).nullable(),
    winnerId: z.string().min(1).max(64).nullable(),
    eliminatedId: z.string().min(1).max(64).nullable(),
    endsAt: z.number().int().positive(),
    fuseAt: z.number().int().positive(),
    revision: z.number().int().nonnegative(),
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
    shop: shopStateSchema.nullable().optional(),
    potato: potatoStateSchema.nullable().optional(),
    roundNumber: z.number().int().positive().optional(),
    notice: z.string().max(180).optional(),
  })
  .strict()
  .superRefine((state, context) => {
    if (
      state.phase === "SHOP" &&
      (!state.shop ||
        state.shop.playerId !== state.currentPlayerId ||
        !state.players.some((player) => player.id === state.shop!.playerId))
    )
      context.addIssue({
        code: "custom",
        message: "Shop requires the current player",
        path: ["shop"],
      })
    if (state.phase === "POTATO" && !state.potato)
      context.addIssue({ code: "custom", message: "Missing mini-game state", path: ["potato"] })
    if (state.potato) {
      const game = state.potato
      if (
        state.phase !== "POTATO" ||
        new Set(game.participantIds).size !== game.participantIds.length ||
        new Set(game.aliveIds).size !== game.aliveIds.length ||
        game.participantIds.some((id) => !state.players.some((player) => player.id === id)) ||
        game.aliveIds.some((id) => !game.participantIds.includes(id)) ||
        (game.holderId !== null && !game.aliveIds.includes(game.holderId)) ||
        (game.winnerId !== null && !game.participantIds.includes(game.winnerId))
      )
        context.addIssue({
          code: "custom",
          message: "Invalid mini-game participants",
          path: ["potato"],
        })
    }
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
export type PotatoState = z.infer<typeof potatoStateSchema>
