import { describe, expect, it } from "vitest"

import { gameStateSchema, joinRoomRequestSchema, rollRequestSchema } from "./index"

describe("protocol schemas", () => {
  it("normalizes room codes and trims player names", () => {
    const result = joinRoomRequestSchema.parse({
      roomCode: " a7b2 ",
      name: "  Ryan  ",
      color: "cyan",
    })

    expect(result).toEqual({ roomCode: "A7B2", name: "Ryan", color: "cyan" })
  })

  it("keeps private session IDs out of public snapshots", () => {
    const result = gameStateSchema.safeParse({
      roomCode: "PLAY",
      phase: "LOBBY",
      currentPlayerId: null,
      turnNumber: 0,
      lastRoll: null,
      players: [
        {
          id: "player-1",
          sessionId: "this-must-not-be-public",
          name: "Ryan",
          color: "cyan",
          connected: true,
          ready: true,
          tileId: "tile-0",
        },
      ],
    })

    expect(result.success).toBe(false)
  })

  it("requires a UUID request ID for deduplication", () => {
    const result = rollRequestSchema.safeParse({
      roomCode: "PLAY",
      playerSessionId: "a-private-session-token",
      requestId: "not-a-uuid",
    })

    expect(result.success).toBe(false)
  })
})
