import { randomUUID } from "node:crypto"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { GameServer } from "../../apps/server/src/game/game-server"
import {
  CLIENT_EVENTS,
  PLAYER_COLORS,
  gamePhaseSchema,
  gameStateSchema,
  roomCreatedEventSchema,
  roomJoinedEventSchema,
  type GameState,
} from "../../packages/protocol/src"

let server: GameServer
let state: GameState
let room: ReturnType<typeof roomCreatedEventSchema.parse>
let players: Array<ReturnType<typeof roomJoinedEventSchema.parse>>
let errors: string[]
const phases: string[] = []
beforeEach(() => {
  vi.useFakeTimers()
  players = []
  errors = []
  phases.length = 0
  server = new GameServer({
    dice: () => 2,
    rollDurationMs: 10,
    millisecondsPerTile: 5,
    turnEndMs: 10,
    roundGame: "fishing",
    minigameIntroMs: 100,
    minigameDurationMs: 100,
    minigameResultMs: 100,
    deliver: (connection, event, payload) => {
      if (event === "room.created") room = roomCreatedEventSchema.parse(payload)
      if (event === "room.joined") players.push(roomJoinedEventSchema.parse(payload))
      if (connection === "host" && event === "room.snapshot") {
        state = gameStateSchema.parse(payload)
        phases.push(state.phase)
      }
      if (event === "game.error") errors.push((payload as { code: string }).code)
    },
  })
  server.handle("host", "room.create", {})
  for (let index = 0; index < 8; index++)
    server.handle(`p${index}`, "room.join", {
      roomCode: room.roomCode,
      name: `Player ${index}`,
      color: PLAYER_COLORS[index],
    })
  server.handle("host", "game.start", { roomCode: room.roomCode, hostToken: room.hostToken })
})
afterEach(() => {
  server.dispose()
  vi.useRealTimers()
})
function roll(index: number) {
  server.handle(`p${index}`, "dice.roll.request", {
    roomCode: room.roomCode,
    playerSessionId: players[index]!.playerSessionId,
    requestId: randomUUID(),
  })
  vi.advanceTimersByTime(30)
}

it("allows eight players to share a landing without combat, knockback or an interrupted turn", () => {
  for (let index = 0; index < 8; index++) {
    roll(index)
    expect(state.players.slice(0, index + 1).every((p) => p.tileId === "tile-2")).toBe(true)
    if (index < 7) {
      expect(state.phase).toBe("AWAITING_ROLL")
      expect(state.currentPlayerId).toBe(players[index + 1]!.playerId)
    }
  }
  expect(state.phase).toBe("MINIGAME")
  expect(state.minigame).toMatchObject({ kind: "fishing", stage: "intro" })
  expect(phases).not.toContain("DUEL")
  expect(state).not.toHaveProperty("duel")
  expect(state.players.map((p) => p.coins)).toEqual(Array(8).fill(7))
  vi.advanceTimersByTime(300)
  expect(state.phase).toBe("AWAITING_ROLL")
  expect(state.currentPlayerId).toBe(players[0]!.playerId)
  expect(errors).toEqual([])
})

it("rejects retired combat snapshots and commands without changing the game", () => {
  expect(gamePhaseSchema.safeParse("DUEL").success).toBe(false)
  expect(gameStateSchema.safeParse({ ...state, duel: null }).success).toBe(false)
  expect(Object.values(CLIENT_EVENTS)).not.toContain("duel.action")
  const before = structuredClone(state)
  server.handle("p0", "duel.action", {
    roomCode: room.roomCode,
    playerSessionId: players[0]!.playerSessionId,
    requestId: randomUUID(),
    duelId: randomUUID(),
    action: "swing",
  })
  expect(errors).toEqual(["UNKNOWN_EVENT"])
  expect(state).toEqual(before)
})
