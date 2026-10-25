import { z } from "zod"
import { minigameStateSchema } from "./minigames"

import { MAX_PLAYERS, PLAYER_COLORS } from "./players"
export { MAX_PLAYERS, PLAYER_COLORS, PLAYER_TINTS } from "./players"

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
  "MINIGAME",
])

export const playerColorSchema = z.enum(PLAYER_COLORS)
export const itemSchema = z.enum(["freeze", "boots", "shield", "clover", "compass"])
export type Item = z.infer<typeof itemSchema>
export const SHOP_ITEMS = {
  boots: { name: "Trail Boots", price: 4, description: "Add two spaces to your next roll." },
  clover: {
    name: "Lucky Clover",
    price: 3,
    description: "Your next die shows at least 4. Frost still slows movement.",
  },
  compass: {
    name: "Trail Compass",
    price: 10,
    description: "Choose your next die: 1–6. Pick your landing space.",
  },
  shield: { name: "Leaf Shield", price: 4, description: "Block one incoming Frost Charm." },
  freeze: {
    name: "Frost Charm",
    price: 10,
    description: "Slow an opponent's next move by 2, minimum 1. Never skips their turn.",
  },
} as const

export const publicPlayerSchema = z
  .object({
    id: z.string().min(1).max(64),
    name: z.string().trim().min(1).max(20),
    color: playerColorSchema,
    connected: z.boolean(),
    ready: z.boolean(),
    isBot: z.boolean().optional(),
    tileId: z.string().min(1).max(64),
    coins: z.number().int().min(0).max(999).optional(),
    inventory: z.array(itemSchema).max(3).optional(),
    frozen: z.boolean().optional(),
    shield: z.boolean().optional(),
    boosted: z.boolean().optional(),
    lucky: z.boolean().optional(),
    plannedRoll: z.number().int().min(1).max(6).nullable().optional(),
    frostWard: z.boolean().optional(),
    itemUsedTurn: z.number().int().nonnegative().optional(),
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
    endsAt: z.number().int().positive().nullable(),
  })
  .strict()

export const potatoStateSchema = z
  .object({
    id: z.string().uuid(),
    stage: z.enum(["intro", "active", "result"]),
    participantIds: z.array(z.string().min(1).max(64)).min(2).max(MAX_PLAYERS),
    aliveIds: z.array(z.string().min(1).max(64)).max(MAX_PLAYERS),
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
    players: z.array(publicPlayerSchema).max(MAX_PLAYERS),
    demoMode: z.boolean().optional(),
    currentPlayerId: z.string().min(1).max(64).nullable(),
    turnNumber: z.number().int().nonnegative(),
    lastRoll: z.number().int().min(1).max(6).nullable(),
    winnerId: z.string().min(1).max(64).nullable().optional(),
    duel: duelStateSchema.nullable().optional(),
    shop: shopStateSchema.nullable().optional(),
    potato: potatoStateSchema.nullable().optional(),
    minigame: minigameStateSchema.nullable().optional(),
    roundNumber: z.number().int().positive().optional(),
    notice: z.string().max(180).optional(),
    waitingForHost: z
      .object({ id: z.string().uuid(), label: z.string().max(60) })
      .strict()
      .nullable()
      .optional(),
    itemEffect: z
      .object({
        id: z.string().uuid(),
        playerId: z.string().min(1).max(64),
        targetId: z.string().min(1).max(64),
        item: itemSchema,
        blocked: z.boolean(),
        message: z.string().max(180),
      })
      .strict()
      .nullable()
      .optional(),
    serverTime: z.number().int().positive().optional(),
  })
  .strict()
  .superRefine((state, context) => {
    if (
      state.phase === "FINISHED"
        ? !state.winnerId ||
          state.currentPlayerId !== state.winnerId ||
          !state.players.some((p) => p.id === state.winnerId)
        : !!state.winnerId
    )
      context.addIssue({
        code: "custom",
        message: "Only a finished match may declare a room player as its winner",
        path: ["winnerId"],
      })
    const pausedStage =
      state.phase === "DUEL"
        ? state.duel?.stage
        : state.phase === "POTATO"
          ? state.potato?.stage
          : state.phase === "MINIGAME"
            ? state.minigame?.stage
            : null
    if (state.waitingForHost && pausedStage !== "intro" && pausedStage !== "result")
      context.addIssue({
        code: "custom",
        message: "Only instructions and results can wait for the host",
        path: ["waitingForHost"],
      })
    if (
      state.itemEffect &&
      (!state.players.some((player) => player.id === state.itemEffect!.playerId) ||
        !state.players.some((player) => player.id === state.itemEffect!.targetId))
    )
      context.addIssue({
        code: "custom",
        message: "Power-up effect requires room players",
        path: ["itemEffect"],
      })
    const game = state.minigame
    if (
      (state.phase === "MINIGAME") !== !!game ||
      (game &&
        (new Set(game.players.map((entry) => entry.playerId)).size !== game.players.length ||
          game.players.some(
            (entry) => !state.players.some((player) => player.id === entry.playerId),
          ) ||
          new Set(game.winnerIds).size !== game.winnerIds.length ||
          game.winnerIds.some((id) => !game.players.some((entry) => entry.playerId === id)) ||
          (game.stage !== "result" && game.winnerIds.length > 0)))
    )
      context.addIssue({ code: "custom", message: "Invalid mini-game state", path: ["minigame"] })
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
