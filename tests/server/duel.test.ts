import { randomUUID } from "node:crypto"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { GameServer } from "../../apps/server/src/game/game-server"
import {
  gameStateSchema,
  roomCreatedEventSchema,
  roomJoinedEventSchema,
  type GameState,
} from "../../packages/protocol/src"

let server: GameServer
let state: GameState
let room: ReturnType<typeof roomCreatedEventSchema.parse>
let players: Array<ReturnType<typeof roomJoinedEventSchema.parse>>
let errors: Array<{ code: string }>
beforeEach(() => {
  vi.useFakeTimers()
  players = []
  errors = []
  server = new GameServer({
    manualStageAdvance: false,
    dice: () => 2,
    rollDurationMs: 10,
    millisecondsPerTile: 5,
    turnEndMs: 10,
    duelIntroMs: 100,
    duelDurationMs: 5000,
    duelResultMs: 200,
    deliver: (connection, event, payload) => {
      if (event === "room.created") room = roomCreatedEventSchema.parse(payload)
      if (event === "room.joined") players.push(roomJoinedEventSchema.parse(payload))
      if (connection === "host" && event === "room.snapshot") state = gameStateSchema.parse(payload)
      if (event === "game.error") errors.push(payload as { code: string })
    },
  })
  server.handle("host", "room.create", {})
  for (const [index, color] of (["coral", "cyan", "gold", "violet"] as const).entries())
    server.handle(`p${index}`, "room.join", {
      roomCode: room.roomCode,
      name: `Player ${index}`,
      color,
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
}
function collide() {
  roll(0)
  vi.advanceTimersByTime(30)
  expect(state.phase).toBe("AWAITING_ROLL")
  roll(1)
  vi.advanceTimersByTime(20)
  expect(state.duel?.stage).toBe("intro")
  vi.advanceTimersByTime(100)
  expect(state.duel?.stage).toBe("active")
}
function action(
  index: number,
  action: "swing" | "guard",
  requestId = randomUUID(),
  duelId = state.duel!.id,
) {
  server.handle(`p${index}`, "duel.action", {
    roomCode: room.roomCode,
    playerSessionId: players[index]!.playerSessionId,
    requestId,
    duelId,
    action,
  })
  return requestId
}

it("keeps the shared start safe, detects only completed landings, and includes the two duelists", () => {
  expect(state.duel).toBeNull()
  roll(0)
  vi.advanceTimersByTime(10)
  expect(state.phase).toBe("MOVING")
  expect(state.duel).toBeNull()
  vi.advanceTimersByTime(20)
  roll(1)
  vi.advanceTimersByTime(20)
  expect(state.duel).toMatchObject({
    stage: "intro",
    tileId: "tile-2",
    fighters: [{ playerId: players[1]!.playerId }, { playerId: players[0]!.playerId }],
  })
})

it("deduplicates attacks, limits action rate, awards two hits, caps the penalty at start, and resumes the board", () => {
  collide()
  const id = action(1, "swing")
  action(1, "swing", id)
  action(1, "swing")
  vi.advanceTimersByTime(450)
  expect(state.duel!.fighters[0].score).toBe(1)
  vi.advanceTimersByTime(450)
  action(1, "swing", id)
  vi.advanceTimersByTime(450)
  expect(state.duel!.fighters[0].score).toBe(1)
  action(1, "swing")
  vi.advanceTimersByTime(450)
  expect(state.duel).toMatchObject({
    stage: "result",
    winnerId: players[1]!.playerId,
    loserId: players[0]!.playerId,
    penaltySpaces: 2,
  })
  expect(state.players[0]!.tileId).toBe("tile-0")
  expect(state.players[1]!.tileId).toBe("tile-2")
  vi.advanceTimersByTime(210)
  expect(state.phase).toBe("AWAITING_ROLL")
  expect(state.currentPlayerId).toBe(players[2]!.playerId)
  expect(state.duel).toBeNull()
})

it("parries an attack during guard and clashes simultaneous swings without awarding points", () => {
  collide()
  action(1, "swing")
  action(0, "guard")
  vi.advanceTimersByTime(450)
  expect(state.duel!.outcome).toBe("block")
  expect(state.duel!.fighters.map((fighter) => fighter.score)).toEqual([0, 0])
  vi.advanceTimersByTime(450)
  action(1, "swing")
  action(0, "swing")
  vi.advanceTimersByTime(450)
  expect(state.duel!.outcome).toBe("clash")
  expect(state.duel!.fighters.map((fighter) => fighter.score)).toEqual([0, 0])
})

it("rejects spectators, stale duel IDs, forged sessions, and rolling during combat", () => {
  collide()
  action(2, "swing")
  expect(errors.at(-1)?.code).toBe("NOT_A_DUELIST")
  action(1, "swing", randomUUID(), randomUUID())
  expect(errors.at(-1)?.code).toBe("INVALID_DUEL")
  server.handle("p2", "duel.action", {
    roomCode: room.roomCode,
    playerSessionId: players[1]!.playerSessionId,
    requestId: randomUUID(),
    duelId: state.duel!.id,
    action: "swing",
  })
  expect(errors.at(-1)?.code).toBe("UNAUTHORIZED")
  roll(1)
  expect(errors.at(-1)?.code).toBe("INVALID_PHASE")
})

it("resolves inactivity as a draw and forfeits disconnected duelists without getting stuck", () => {
  collide()
  vi.advanceTimersByTime(5000)
  expect(state.duel).toMatchObject({
    stage: "result",
    outcome: "draw",
    winnerId: null,
    penaltySpaces: 0,
  })
  expect(state.players.slice(0, 2).map((player) => player.tileId)).toEqual(["tile-2", "tile-2"])
  vi.advanceTimersByTime(210)
  roll(2)
  vi.advanceTimersByTime(20)
  server.disconnect("p2")
  expect(state.duel).toMatchObject({
    stage: "result",
    outcome: "forfeit",
    winnerId: players[0]!.playerId,
  })
  vi.advanceTimersByTime(210)
  expect(state.phase).toBe("AWAITING_ROLL")
  expect(state.currentPlayerId).toBe(players[3]!.playerId)
})

it("lets an authenticated host resume combat and cancels all duel timers on restart", () => {
  collide()
  server.handle("host2", "room.host.resume", { roomCode: room.roomCode, hostToken: room.hostToken })
  server.handle("host", "game.restart", { roomCode: room.roomCode, hostToken: room.hostToken })
  vi.advanceTimersByTime(5500)
  expect(state.phase).toBe("AWAITING_ROLL")
  expect(state.duel).toBeNull()
  expect(state.players.every((player) => player.tileId === "tile-0")).toBe(true)
})

it("rejects malformed combat snapshots before the host can render missing fighters", () => {
  collide()
  expect(gameStateSchema.safeParse({ ...state, duel: null }).success).toBe(false)
  const duel = state.duel!
  expect(
    gameStateSchema.safeParse({
      ...state,
      duel: { ...duel, fighters: [duel.fighters[0], duel.fighters[0]] },
    }).success,
  ).toBe(false)
  expect(
    gameStateSchema.safeParse({
      ...state,
      duel: { ...duel, fighters: [{ ...duel.fighters[0], playerId: "missing" }, duel.fighters[1]] },
    }).success,
  ).toBe(false)
})
