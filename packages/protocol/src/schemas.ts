import { z } from "zod"

import { gameStateSchema, playerColorSchema, itemSchema } from "./state"

const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{4}$/)
const tokenSchema = z.string().min(16).max(256)
const idSchema = z.string().min(1).max(64)

export const roomCreateRequestSchema = z.object({}).strict()

export const roomCreatedEventSchema = z
  .object({
    roomCode: roomCodeSchema,
    hostToken: tokenSchema,
    state: gameStateSchema,
  })
  .strict()

export const joinRoomRequestSchema = z
  .object({
    roomCode: roomCodeSchema,
    name: z.string().trim().min(1).max(20),
    color: playerColorSchema,
    existingSessionId: tokenSchema.optional(),
  })
  .strict()

export const roomJoinedEventSchema = z
  .object({
    playerSessionId: tokenSchema,
    playerId: idSchema,
    state: gameStateSchema,
  })
  .strict()

export const playerReadyRequestSchema = z
  .object({
    roomCode: roomCodeSchema,
    playerSessionId: tokenSchema,
  })
  .strict()

export const hostCommandSchema = z
  .object({
    roomCode: roomCodeSchema,
    hostToken: tokenSchema,
  })
  .strict()

export const rollRequestSchema = z
  .object({
    roomCode: roomCodeSchema,
    playerSessionId: tokenSchema,
    requestId: z.string().uuid(),
  })
  .strict()

export const demoModeRequestSchema = hostCommandSchema.extend({ enabled: z.boolean() }).strict()
export type DemoModeRequest = z.infer<typeof demoModeRequestSchema>

export const continueGameRequestSchema = hostCommandSchema
  .extend({
    continueId: z.string().uuid(),
  })
  .strict()
export type ContinueGameRequest = z.infer<typeof continueGameRequestSchema>

export const turnStartedEventSchema = z
  .object({
    playerId: idSchema,
    turnNumber: z.number().int().positive(),
    timeoutAt: z.number().int().positive().nullable(),
  })
  .strict()

export const diceRolledEventSchema = z
  .object({
    playerId: idSchema,
    value: z.number().int().min(1).max(6),
    turnNumber: z.number().int().positive(),
    rollDurationMs: z.number().int().positive(),
  })
  .strict()

export const playerMovingEventSchema = z
  .object({
    playerId: idSchema,
    fromTileId: idSchema,
    toTileId: idSchema,
    path: z.array(idSchema).min(1).max(8),
    millisecondsPerTile: z.number().int().positive(),
    turnNumber: z.number().int().positive(),
  })
  .strict()

export const turnEndedEventSchema = z
  .object({
    completedPlayerId: idSchema,
    nextPlayerId: idSchema,
    turnNumber: z.number().int().positive(),
  })
  .strict()

export const gameErrorEventSchema = z
  .object({
    code: z.string().min(1).max(64),
    message: z.string().min(1).max(240),
    requestId: z.string().uuid().optional(),
  })
  .strict()

export type RoomCreateRequest = z.infer<typeof roomCreateRequestSchema>
export type RoomCreatedEvent = z.infer<typeof roomCreatedEventSchema>
export type JoinRoomRequest = z.infer<typeof joinRoomRequestSchema>
export type RoomJoinedEvent = z.infer<typeof roomJoinedEventSchema>
export type PlayerReadyRequest = z.infer<typeof playerReadyRequestSchema>
export type HostCommand = z.infer<typeof hostCommandSchema>
export type RollRequest = z.infer<typeof rollRequestSchema>
export const shopChoiceRequestSchema = rollRequestSchema
  .extend({ visitId: z.string().uuid(), item: z.union([itemSchema, z.literal("skip")]) })
  .strict()
export const itemUseRequestSchema = rollRequestSchema
  .extend({
    item: itemSchema,
    targetId: idSchema.optional(),
    dieValue: z.number().int().min(1).max(6).optional(),
    turnNumber: z.number().int().positive(),
  })
  .strict()
  .refine(
    (request) =>
      request.item === "compass" ? request.dieValue !== undefined : request.dieValue === undefined,
    "Only Trail Compass requires a die value",
  )
export const potatoPassRequestSchema = rollRequestSchema
  .extend({ gameId: z.string().uuid(), revision: z.number().int().nonnegative() })
  .strict()
export type ShopChoiceRequest = z.infer<typeof shopChoiceRequestSchema>
export type ItemUseRequest = z.infer<typeof itemUseRequestSchema>
export type PotatoPassRequest = z.infer<typeof potatoPassRequestSchema>
export const minigameInputRequestSchema = rollRequestSchema
  .extend({
    gameId: z.string().uuid(),
    sequence: z.number().int().min(0).max(1000000),
    axis: z.number().min(-1).max(1),
    action: z.boolean(),
  })
  .strict()
export type MinigameInputRequest = z.infer<typeof minigameInputRequestSchema>
export type TurnStartedEvent = z.infer<typeof turnStartedEventSchema>
export type DiceRolledEvent = z.infer<typeof diceRolledEventSchema>
export type PlayerMovingEvent = z.infer<typeof playerMovingEventSchema>
export type TurnEndedEvent = z.infer<typeof turnEndedEventSchema>
export type GameErrorEvent = z.infer<typeof gameErrorEventSchema>
