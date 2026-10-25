import { randomUUID } from "node:crypto"
import { afterEach, expect, it, vi } from "vitest"
import { GameServer, type GameServerOptions } from "../../apps/server/src/game/game-server"
import {
  gameStateSchema,
  roomCreatedEventSchema,
  roomJoinedEventSchema,
  type GameState,
  type MinigameKind,
  balanceLean,
} from "../../packages/protocol/src"

let server: GameServer
afterEach(() => {
  server?.dispose()
  vi.useRealTimers()
})
function setup(kind?: MinigameKind, options: Partial<GameServerOptions> = {}) {
  vi.useFakeTimers()
  let state: GameState
  let room: ReturnType<typeof roomCreatedEventSchema.parse>
  const players: Array<ReturnType<typeof roomJoinedEventSchema.parse>> = []
  const errors: string[] = []
  server = new GameServer({
    ...(kind ? { roundGame: kind } : {}),
    dice: () => 1,
    rollDurationMs: 1,
    millisecondsPerTile: 1,
    turnEndMs: 1,
    shopDurationMs: 1,
    potatoIntroMs: 1,
    potatoFuseMs: 1,
    potatoResultMs: 1,
    minigameIntroMs: 100,
    minigameDurationMs: 1000,
    minigameResultMs: 100,
    ...options,
    deliver: (connection, event, payload) => {
      if (event === "room.created") room = roomCreatedEventSchema.parse(payload)
      if (event === "room.joined") players.push(roomJoinedEventSchema.parse(payload))
      if (connection === "host" && event === "room.snapshot") state = gameStateSchema.parse(payload)
      if (event === "game.error") errors.push((payload as { code: string }).code)
    },
  })
  server.handle("host", "room.create", {})
  for (const [i, color] of (["coral", "cyan", "gold", "violet"] as const).entries())
    server.handle(`p${i}`, "room.join", { roomCode: room!.roomCode, name: `Player ${i}`, color })
  const startGame = () =>
    server.handle("host", "game.restart", { roomCode: room!.roomCode, hostToken: room!.hostToken })
  startGame()
  function boardRound() {
    for (let step = 0; step < 1000; step++) {
      const current = state!
      if (current.phase === "MINIGAME" || current.phase === "POTATO") return
      if (current.phase === "AWAITING_ROLL") {
        const i = players.findIndex((player) => player.playerId === current.currentPlayerId)
        server.handle(`p${i}`, "dice.roll.request", {
          roomCode: room!.roomCode,
          playerSessionId: players[i]!.playerSessionId,
          requestId: randomUUID(),
        })
      }
      vi.advanceTimersByTime(1)
    }
    throw Error("No round game")
  }
  return { snapshot: () => state!, players, room: () => room!, errors, boardRound, startGame }
}

it.each(["balance", "fishing", "archery", "rhythm"] as const)(
  "finishes %s, pays exactly once and resumes the correct player",
  (kind) => {
    const game = setup(kind)
    game.boardRound()
    expect(game.snapshot().minigame?.stage).toBe("intro")
    const balances = game.snapshot().players.map((player) => player.coins!)
    vi.advanceTimersByTime(1100)
    const result = game.snapshot()
    expect(result.minigame?.stage).toBe("result")
    expect(result.players.map((player, i) => player.coins! - balances[i]!)).toEqual(
      result.players.map((player) => (result.minigame!.winnerIds.includes(player.id) ? 4 : 1)),
    )
    vi.advanceTimersByTime(100)
    expect(game.snapshot()).toMatchObject({
      phase: "AWAITING_ROLL",
      roundNumber: 2,
      currentPlayerId: game.players[0]!.playerId,
      minigame: null,
    })
    expect(game.snapshot().players.map((player) => player.coins)).toEqual(
      result.players.map((player) => player.coins),
    )
    expect(game.errors).toEqual([])
  },
)

it("rotates all five games without repeats within a bag", () => {
  const game = setup()
  const kinds: string[] = []
  for (let i = 0; i < 5; i++) {
    game.boardRound()
    kinds.push(game.snapshot().minigame?.kind ?? "potato")
    while (["POTATO", "MINIGAME"].includes(game.snapshot().phase)) vi.advanceTimersByTime(10)
  }
  expect(kinds[0]).toBe("potato")
  expect(new Set(kinds).size).toBe(5)
  expect(kinds).not.toContain("dodge")
})

it("awards the last Balance survivor once, rejects late inputs, and resumes the board early", () => {
  const game = setup("balance", { minigameDurationMs: 20_000, minigameResultMs: 3500 })
  game.boardRound()
  const before = game.snapshot().players.map((player) => player.coins!)
  vi.advanceTimersByTime(100)
  let sequence = 0
  while (game.snapshot().minigame!.stage === "active" && sequence < 150) {
    const state = game.snapshot().minigame!
    const elapsed = Date.now() - state.startsAt + 100
    state.players.forEach((entry, i) => {
      server.handle(`p${i}`, "minigame.input", {
        roomCode: game.room().roomCode,
        playerSessionId: game.players[i]!.playerSessionId,
        requestId: randomUUID(),
        gameId: state.id,
        sequence,
        axis:
          i === 0 ? Math.max(-1, Math.min(1, -balanceLean(elapsed, 0) - entry.position * 0.8)) : 1,
        action: false,
      })
    })
    vi.advanceTimersByTime(100)
    sequence++
  }
  const result = game.snapshot()
  expect(result.minigame!.stage).toBe("result")
  expect(result.minigame!.winnerIds).toEqual([game.players[0]!.playerId])
  expect(result.minigame!.players.filter((player) => player.alive)).toHaveLength(1)
  expect(Date.now() - result.minigame!.startsAt).toBeLessThan(20_000)
  expect(result.players.map((player, i) => player.coins! - before[i]!)).toEqual([4, 1, 1, 1])
  server.handle("p1", "minigame.input", {
    roomCode: game.room().roomCode,
    playerSessionId: game.players[1]!.playerSessionId,
    requestId: randomUUID(),
    gameId: result.minigame!.id,
    sequence: 999,
    axis: -1,
    action: false,
  })
  vi.advanceTimersByTime(3500)
  expect(game.snapshot()).toMatchObject({ phase: "AWAITING_ROLL", minigame: null, roundNumber: 2 })
  expect(game.snapshot().players.map((player) => player.coins)).toEqual(
    result.players.map((player) => player.coins),
  )
})

it("validates authentication and clears the game timer on host restart", () => {
  const game = setup("archery")
  game.boardRound()
  vi.advanceTimersByTime(100)
  const payload = {
    roomCode: game.room().roomCode,
    playerSessionId: game.players[0]!.playerSessionId,
    requestId: randomUUID(),
    gameId: game.snapshot().minigame!.id,
    sequence: 1,
    axis: 0,
    action: true,
  }
  server.handle("p1", "minigame.input", payload)
  expect(game.errors.at(-1)).toBe("UNAUTHORIZED")
  server.handle("p0", "minigame.input", { ...payload, axis: 99 })
  expect(game.errors.at(-1)).toBe("INVALID_PAYLOAD")
  server.handle("p0", "minigame.input", payload)
  vi.advanceTimersByTime(100)
  expect(game.snapshot().minigame!.players[0]!.attempts).toBe(1)
  server.disconnect("p0")
  expect(game.snapshot().minigame!.players[0]!.alive).toBe(true)
  game.startGame()
  vi.advanceTimersByTime(2000)
  expect(game.snapshot().phase).toBe("AWAITING_ROLL")
  expect(game.snapshot().minigame).toBeNull()
  expect(game.snapshot().players.every((player) => player.coins === 6)).toBe(true)
})

it("preserves Archery arrows, score and eligibility through refresh, accepting a new input sequence", () => {
  const game = setup("archery", { minigameDurationMs: 20_000 })
  game.boardRound()
  vi.advanceTimersByTime(100)
  const input = {
    roomCode: game.room().roomCode,
    playerSessionId: game.players[0]!.playerSessionId,
    requestId: randomUUID(),
    gameId: game.snapshot().minigame!.id,
    sequence: 100,
    axis: 0,
    action: true,
  }
  server.handle("p0", "minigame.input", input)
  vi.advanceTimersByTime(100)
  const original = game.snapshot().minigame!.players[0]!
  server.disconnect("p0")
  vi.advanceTimersByTime(2000)
  expect(game.snapshot().minigame!.players[0]!.alive).toBe(true)
  server.handle("p0-new", "room.join", {
    roomCode: game.room().roomCode,
    name: "Player 0",
    color: "coral",
    existingSessionId: input.playerSessionId,
  })
  server.handle("p0-new", "minigame.input", { ...input, requestId: randomUUID(), sequence: 0 })
  vi.advanceTimersByTime(100)
  expect(game.snapshot().minigame!.players[0]).toMatchObject({ attempts: 2, alive: true })
  expect(game.snapshot().minigame!.players[0]!.score).toBeGreaterThanOrEqual(original.score)
  vi.advanceTimersByTime(8000)
  expect(game.snapshot().minigame!.players[0]!.alive).toBe(true)
  expect(game.errors).toEqual([])
})

it("forfeits after the default eight-second grace, but never in a later restarted game", () => {
  const game = setup("archery", { minigameDurationMs: 20_000 })
  game.boardRound()
  vi.advanceTimersByTime(100)
  server.disconnect("p0")
  vi.advanceTimersByTime(7999)
  expect(game.snapshot().minigame!.players[0]!.alive).toBe(true)
  vi.advanceTimersByTime(1)
  expect(game.snapshot().minigame!.players[0]!.alive).toBe(false)
  game.startGame()
  vi.advanceTimersByTime(8000)
  expect(game.snapshot().minigame).toBeNull()
  expect(game.snapshot().players.every((player) => player.coins === 6)).toBe(true)
})
