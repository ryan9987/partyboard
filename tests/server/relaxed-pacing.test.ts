import { randomUUID } from "node:crypto"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { GameServer } from "../../apps/server/src/game/game-server"
import {
  gameStateSchema,
  roomCreatedEventSchema,
  roomJoinedEventSchema,
  type GameState,
  type MinigameKind,
} from "../../packages/protocol/src"

let server: GameServer
let state: GameState
let room: ReturnType<typeof roomCreatedEventSchema.parse>
let players: Array<ReturnType<typeof roomJoinedEventSchema.parse>>
let errors: string[]
let dice: number
beforeEach(() => {
  vi.useFakeTimers()
  players = []
  errors = []
  dice = 6
})
afterEach(() => {
  server.dispose()
  vi.useRealTimers()
})

function setup(count = 2, roundGame: MinigameKind | "potato" = "potato", manual = true) {
  server = new GameServer({
    ...(manual ? { manualStageAdvance: true } : {}),
    disconnectGraceMs: 0,
    dice: () => dice,
    roundGame,
    rollDurationMs: 10,
    millisecondsPerTile: 5,
    turnEndMs: 10,
    potatoFuseMs: 500,
    minigameDurationMs: 1000,
    duelDurationMs: 1500,
    deliver: (connection, event, payload) => {
      if (event === "room.created") room = roomCreatedEventSchema.parse(payload)
      if (event === "room.joined") players.push(roomJoinedEventSchema.parse(payload))
      if (connection === "host" && event === "room.snapshot") state = gameStateSchema.parse(payload)
      if (event === "game.error") errors.push((payload as { code: string }).code)
    },
  })
  server.handle("host", "room.create", {})
  for (const [index, color] of (["coral", "cyan", "gold", "violet"] as const)
    .slice(0, count)
    .entries())
    server.handle(`p${index}`, "room.join", {
      roomCode: room.roomCode,
      name: `Player ${index}`,
      color,
    })
  server.handle("host", "game.start", { roomCode: room.roomCode, hostToken: room.hostToken })
}
function command(
  index: number,
  event: string,
  fields: Record<string, unknown> = {},
  requestId = randomUUID(),
) {
  server.handle(`p${index}`, event, {
    roomCode: room.roomCode,
    playerSessionId: players[index]!.playerSessionId,
    requestId,
    ...fields,
  })
  return requestId
}
function roll(index: number, value = 6) {
  dice = value
  command(index, "dice.roll.request")
}
function settle() {
  for (let step = 0; step < 1000; step++) {
    if (state.phase === "AWAITING_ROLL" || state.waitingForHost) return
    if (state.phase === "SHOP")
      command(
        players.findIndex((player) => player.playerId === state.shop!.playerId),
        "shop.choice",
        { visitId: state.shop!.id, item: "skip" },
      )
    else vi.advanceTimersByTime(5)
  }
  throw new Error("Turn did not settle")
}
function continueGame(continueId = state.waitingForHost!.id, connection = "host") {
  server.handle(connection, "game.continue", {
    roomCode: room.roomCode,
    hostToken: room.hostToken,
    continueId,
  })
}
function round() {
  roll(0, 1)
  settle()
  roll(1, 2)
  settle()
}

it.each(["potato", "balance", "fishing", "dodge", "archery", "rhythm"] as const)(
  "shows setup then automatically counts down three seconds into %s, shows results and returns to the board",
  (kind) => {
    setup(2, kind, false)
    roll(0, 1)
    settle()
    roll(1, 2)
    vi.advanceTimersByTime(30)
    expect(state.waitingForHost).toBeFalsy()
    expect((state.minigame ?? state.potato)?.stage).toBe("intro")
    if (kind !== "potato") {
      expect(state.minigame!.startsAt - Date.now()).toBe(7000)
      vi.advanceTimersByTime(4000)
      expect(state.minigame!.stage).toBe("intro")
    }
    vi.advanceTimersByTime(2999)
    expect((state.minigame ?? state.potato)?.stage).toBe("intro")
    vi.advanceTimersByTime(1)
    expect((state.minigame ?? state.potato)?.stage).toBe("active")
    vi.advanceTimersByTime(1000)
    expect((state.minigame ?? state.potato)?.stage).toBe("result")
    const coins = state.players.map((player) => player.coins)
    vi.advanceTimersByTime(3500)
    expect(state.phase).toBe("AWAITING_ROLL")
    expect(state.roundNumber).toBe(2)
    expect(state.players.map((player) => player.coins)).toEqual(coins)
    expect(errors).toEqual([])
  },
)

it("never skips a connected player or closes a shop just because time passes", () => {
  setup()
  const turn = state.turnNumber
  vi.advanceTimersByTime(10 * 60_000)
  expect(state).toMatchObject({
    phase: "AWAITING_ROLL",
    turnNumber: turn,
    currentPlayerId: players[0]!.playerId,
  })
  roll(0)
  vi.advanceTimersByTime(25)
  expect(state.shop?.endsAt).toBeNull()
  const visitId = state.shop!.id
  vi.advanceTimersByTime(10 * 60_000)
  expect(state.shop?.id).toBe(visitId)
  command(0, "shop.choice", { visitId, item: "boots" })
  settle()
  expect(state.players[0]).toMatchObject({ tileId: "tile-6", inventory: ["boots"], coins: 8 })
})

it("still recovers disconnected turns and finishes an abandoned shop's exact path", () => {
  setup()
  server.disconnect("p0")
  vi.advanceTimersByTime(60_000)
  expect(state.currentPlayerId).toBe(players[1]!.playerId)
  roll(1)
  vi.advanceTimersByTime(25)
  expect(state.phase).toBe("SHOP")
  server.disconnect("p1")
  vi.advanceTimersByTime(100)
  expect(state.players[1]!.tileId).toBe("tile-6")
  expect(state.shop).toBeNull()
})

it("cancels disconnect recovery when the current phone rejoins, without adding a new deadline", () => {
  setup()
  server.disconnect("p0")
  vi.advanceTimersByTime(59_000)
  server.handle("p0-returned", "room.join", {
    roomCode: room.roomCode,
    name: "Player 0",
    color: "coral",
    existingSessionId: players[0]!.playerSessionId,
  })
  vi.advanceTimersByTime(600_000)
  expect(state).toMatchObject({
    phase: "AWAITING_ROLL",
    currentPlayerId: players[0]!.playerId,
    turnNumber: 1,
  })
})

it("waits on Hot Potato instructions/results, starts a fresh fuse and pays only once", () => {
  setup()
  round()
  const introId = state.waitingForHost!.id
  vi.advanceTimersByTime(600_000)
  expect(state.potato?.stage).toBe("intro")
  continueGame(introId, "p0")
  expect(errors.at(-1)).toBe("UNAUTHORIZED")
  continueGame()
  expect(state.potato?.stage).toBe("active")
  expect(state.potato!.fuseAt - Date.now()).toBe(500)
  continueGame(introId)
  expect(errors.at(-1)).toBe("INVALID_PHASE")
  vi.advanceTimersByTime(500)
  expect(state.potato?.stage).toBe("result")
  const balances = state.players.map((player) => player.coins)
  vi.advanceTimersByTime(600_000)
  expect(state.potato?.stage).toBe("result")
  expect(state.players.map((player) => player.coins)).toEqual(balances)
  continueGame()
  expect(state).toMatchObject({ phase: "AWAITING_ROLL", waitingForHost: null, roundNumber: 2 })
})

for (const kind of ["balance", "fishing", "dodge", "archery", "rhythm"] as const)
  it(`gives ${kind} its full playing time after an untimed intro and holds the results`, () => {
    setup(2, kind)
    round()
    vi.advanceTimersByTime(600_000)
    expect(state.minigame?.stage).toBe("intro")
    continueGame()
    expect(state.minigame).toMatchObject({
      stage: "active",
      startsAt: Date.now(),
      endsAt: Date.now() + 1000,
    })
    vi.advanceTimersByTime(1000)
    expect(state.minigame?.stage).toBe("result")
    const coins = state.players.map((player) => player.coins)
    vi.advanceTimersByTime(600_000)
    expect(state.minigame?.stage).toBe("result")
    expect(state.players.map((player) => player.coins)).toEqual(coins)
    continueGame()
    expect(state).toMatchObject({ phase: "AWAITING_ROLL", minigame: null, roundNumber: 2 })
  })

it("waits before/after a duel and invalidates an old Continue after a disconnect or restart", () => {
  setup()
  roll(0, 1)
  settle()
  roll(1, 1)
  settle()
  expect(state.duel?.stage).toBe("intro")
  const introId = state.waitingForHost!.id
  vi.advanceTimersByTime(600_000)
  expect(state.duel?.stage).toBe("intro")
  server.disconnect("p0")
  expect(state.duel?.stage).toBe("result")
  continueGame(introId)
  expect(state.duel?.stage).toBe("result")
  expect(errors.at(-1)).toBe("INVALID_PHASE")
  const resultId = state.waitingForHost!.id
  server.handle("host", "game.restart", { roomCode: room.roomCode, hostToken: room.hostToken })
  continueGame(resultId)
  vi.advanceTimersByTime(600_000)
  expect(state).toMatchObject({ phase: "AWAITING_ROLL", waitingForHost: null, duel: null })
})

it("shows an authoritative power-up effect on the owner's turn and clears it on rolling", () => {
  setup(1)
  roll(0)
  vi.advanceTimersByTime(25)
  command(0, "shop.choice", { visitId: state.shop!.id, item: "boots" })
  settle()
  const requestId = command(0, "item.use", { item: "boots", turnNumber: state.turnNumber })
  expect(state.itemEffect).toMatchObject({
    item: "boots",
    playerId: players[0]!.playerId,
    targetId: players[0]!.playerId,
    blocked: false,
  })
  expect(state.itemEffect!.message).toContain("+2 spaces")
  const effectId = state.itemEffect!.id
  command(0, "item.use", { item: "boots", turnNumber: state.turnNumber }, requestId)
  expect(state.itemEffect!.id).toBe(effectId)
  vi.advanceTimersByTime(600_000)
  expect(state.itemEffect!.id).toBe(effectId)
  roll(0, 1)
  expect(state.itemEffect).toBeNull()
  expect(state.notice).toBeUndefined()
  settle()
  expect(state.players[0]!.tileId).toBe("tile-9")
})

it("preserves the pending rules screen across host reconnect and gives a duel its full fight clock", () => {
  setup()
  roll(0, 1)
  settle()
  roll(1, 1)
  settle()
  const continueId = state.waitingForHost!.id
  server.disconnect("host")
  vi.advanceTimersByTime(600_000)
  server.handle("host", "room.host.resume", { roomCode: room.roomCode, hostToken: room.hostToken })
  expect(state.waitingForHost!.id).toBe(continueId)
  continueGame()
  expect(state.duel).toMatchObject({ stage: "active", stageEndsAt: Date.now() + 1500 })
  vi.advanceTimersByTime(1500)
  expect(state.duel?.stage).toBe("result")
  vi.advanceTimersByTime(600_000)
  expect(state.duel?.stage).toBe("result")
})
