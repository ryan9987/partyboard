import { randomUUID } from "node:crypto"
import { afterEach, expect, it, vi } from "vitest"
import { GameServer, type GameServerOptions } from "../../apps/server/src/game/game-server"
import {
  PLAYER_COLORS,
  MAX_PLAYERS,
  balanceLean,
  gameStateSchema,
  roomCreatedEventSchema,
  roomJoinedEventSchema,
  type GameState,
  type MinigameKind,
} from "../../packages/protocol/src"
import { getCharacterOffset } from "../../apps/web/src/host/characterLayout"

let server: GameServer
afterEach(() => {
  server?.dispose()
  vi.useRealTimers()
})
function setup(count = 1, options: Partial<GameServerOptions> = {}) {
  vi.useFakeTimers()
  let state: GameState
  let room: ReturnType<typeof roomCreatedEventSchema.parse>
  const players: Array<ReturnType<typeof roomJoinedEventSchema.parse>> = []
  const errors: string[] = []
  const rolls: number[] = []
  let die = 0
  server = new GameServer({
    dice: () => (++die % 4) + 1,
    rollDurationMs: 10,
    millisecondsPerTile: 10,
    turnEndMs: 10,
    duelIntroMs: 100,
    duelDurationMs: 100,
    duelResultMs: 100,
    minigameIntroMs: 1000,
    minigameDurationMs: 12000,
    minigameResultMs: 1000,
    potatoIntroMs: 1000,
    potatoFuseMs: 4000,
    potatoResultMs: 1000,
    ...options,
    deliver: (connection, event, payload) => {
      if (event === "room.created") room = roomCreatedEventSchema.parse(payload)
      if (event === "room.joined") players.push(roomJoinedEventSchema.parse(payload))
      if (event === "game.error") errors.push((payload as { code: string }).code)
      if (connection === "host" && event === "room.snapshot") state = gameStateSchema.parse(payload)
      if (connection === "host" && event === "dice.rolled")
        rolls.push((payload as { value: number }).value)
    },
  })
  server.handle("host", "room.create", {})
  for (let i = 0; i < count; i++)
    server.handle(`p${i}`, "room.join", {
      roomCode: room!.roomCode,
      name: `Player ${i}`,
      color: PLAYER_COLORS[i],
    })
  const credentials = { roomCode: room!.roomCode, hostToken: room!.hostToken }
  const demo = (enabled = true, connection = "host") =>
    server.handle(connection, "room.demo", { ...credentials, enabled })
  const start = () => server.handle("host", "game.restart", credentials)
  const send = (index: number, event: string, fields = {}) =>
    server.handle(`p${index}`, event, {
      roomCode: credentials.roomCode,
      playerSessionId: players[index]!.playerSessionId,
      requestId: randomUUID(),
      ...fields,
    })
  const until = (condition: () => boolean, limit = 60000) => {
    for (let ms = 0; ms < limit && !condition(); ms += 100) vi.advanceTimersByTime(100)
    expect(condition(), `No expected state after ${limit}ms`).toBe(true)
  }
  const boardRound = () => {
    for (let ms = 0; ms < 60000; ms += 100) {
      if (["MINIGAME", "POTATO"].includes(state!.phase)) return
      if (state!.phase === "AWAITING_ROLL") {
        const i = players.findIndex((p) => p.playerId === state!.currentPlayerId)
        if (i >= 0) send(i, "dice.roll.request")
      }
      if (state!.phase === "SHOP") {
        const i = players.findIndex((p) => p.playerId === state!.shop?.playerId)
        if (i >= 0) send(i, "shop.choice", { visitId: state!.shop!.id, item: "skip" })
      }
      vi.advanceTimersByTime(100)
    }
    throw Error("Round stalled")
  }
  return {
    state: () => state!,
    players,
    errors,
    rolls,
    demo,
    start,
    send,
    until,
    boardRound,
    credentials,
  }
}

it("only an authenticated attached host can add/remove bots in a lobby with a phone", () => {
  const g = setup(0)
  g.demo()
  expect(g.errors.pop()).toBe("NO_PLAYERS")
  server.handle("p0", "room.join", {
    roomCode: g.credentials.roomCode,
    name: "Ryan",
    color: "coral",
  })
  g.demo(true, "p0")
  expect(g.errors.pop()).toBe("UNAUTHORIZED")
  g.demo()
  g.demo()
  expect(g.state().players).toHaveLength(4)
  expect(g.state().players.filter((p) => p.isBot)).toHaveLength(3)
  expect(g.state().players.every((p) => p.connected)).toBe(true)
  expect(JSON.stringify(g.state())).not.toContain("sessionId")
  g.demo(false)
  expect(g.state().players).toHaveLength(1)
  expect(g.state().demoMode).toBe(false)
  expect(vi.getTimerCount()).toBe(0)
  g.demo()
  g.start()
  g.demo(false)
  expect(g.errors.pop()).toBe("INVALID_PHASE")
})

it.each(["balance", "fishing", "archery", "rhythm", "potato"] as const)(
  "runs %s with eight real players, rewards once and returns to the trail",
  (kind) => {
    const g = setup(MAX_PLAYERS, {
      roundGame: kind,
      minigameDurationMs: 500,
      potatoFuseMs: 10,
      shopDurationMs: 1,
    })
    g.start()
    g.boardRound()
    expect(g.state().players).toHaveLength(8)
    const participants =
      g.state().minigame?.players.length ?? g.state().potato?.participantIds.length
    expect(participants).toBe(8)
    const before = g.state().players.map((p) => p.coins!)
    g.until(() => g.state().roundNumber === 2)
    expect(g.state().currentPlayerId).toBe(g.players[0]!.playerId)
    expect(g.state().players.every((p, i) => [1, 4].includes(p.coins! - before[i]!))).toBe(true)
    expect(g.errors).toEqual([])
  },
)

it.each(["balance", "fishing", "archery", "rhythm"] as MinigameKind[])(
  "gentle bots play %s through genuine inputs and a skilled visitor can win",
  (kind) => {
    const g = setup(1, { roundGame: kind })
    g.demo()
    g.start()
    g.boardRound()
    expect(g.rolls).toEqual([2, 3, 4, 1])
    let sequence = 0
    let lastBeat = -1
    g.until(() => g.state().minigame?.stage === "active")
    while (g.state().minigame?.stage === "active") {
      const game = g.state().minigame!
      const me = game.players[0]!
      const elapsed = Date.now() - game.startsAt
      const beat = Math.round(elapsed / 750)
      const action =
        kind === "archery"
          ? me.attempts < 3
          : kind === "fishing"
            ? ["ready", "bite", "caught", "miss"].includes(me.status)
            : kind === "rhythm" && beat > lastBeat && Math.abs(elapsed - beat * 750) <= 60
      if (kind === "rhythm" && action) lastBeat = beat
      g.send(0, "minigame.input", {
        gameId: game.id,
        sequence: ++sequence,
        axis:
          kind === "balance"
            ? Math.max(-1, Math.min(1, -balanceLean(elapsed, 0) - me.position * 0.8))
            : kind === "archery"
              ? -Math.sin(elapsed / 730) * 0.28
              : 0,
        action,
      })
      vi.advanceTimersByTime(50)
    }
    expect(g.state().minigame?.winnerIds).toEqual([g.players[0]!.playerId])
    expect(
      g
        .state()
        .minigame!.players.slice(1)
        .every((p) => (kind === "balance" ? !p.alive : p.attempts > 0)),
    ).toBe(true)
    expect(g.errors).toEqual([])
    g.until(() => g.state().roundNumber === 2)
  },
)

it("demo Hot Potato passes, eliminates holders, and pays only real winners", () => {
  const g = setup(1, { roundGame: "potato" })
  g.demo()
  g.start()
  g.boardRound()
  g.until(() => g.state().potato?.stage === "active")
  let revisions = 0
  while (g.state().potato?.stage === "active") {
    const game = g.state().potato!
    if (game.holderId === g.players[0]!.playerId)
      g.send(0, "potato.pass", { gameId: game.id, revision: game.revision })
    revisions = Math.max(revisions, game.revision)
    vi.advanceTimersByTime(100)
  }
  expect(g.state().potato!.aliveIds).toHaveLength(1)
  expect(revisions).toBeGreaterThan(3)
  expect(g.errors).toEqual([])
})

it("pauses bot turns without the phone, preserves bots on host resume, and clears all timers on disposal", () => {
  const g = setup()
  g.demo()
  g.start()
  g.send(0, "dice.roll.request")
  g.until(() => g.state().currentPlayerId !== g.players[0]!.playerId)
  server.disconnect("p0")
  const turn = g.state().turnNumber
  vi.advanceTimersByTime(5000)
  expect(g.state().turnNumber).toBe(turn)
  server.handle("host2", "room.host.resume", g.credentials)
  expect(g.state().players.filter((p) => p.isBot)).toHaveLength(3)
  server.handle("p0", "room.join", {
    roomCode: g.credentials.roomCode,
    name: "Player 0",
    color: "coral",
    existingSessionId: g.players[0]!.playerSessionId,
  })
  g.until(() => g.state().turnNumber > turn)
  server.dispose()
  expect(vi.getTimerCount()).toBe(0)
})

it("gives all eight characters unique, separated trail positions", () => {
  const offsets = Array.from({ length: MAX_PLAYERS }, (_, i) => getCharacterOffset(i))
  expect(new Set(offsets.map((p) => p.join(","))).size).toBe(8)
  offsets.forEach((a, i) =>
    offsets
      .slice(i + 1)
      .forEach((b) => expect(Math.hypot(a[0] - b[0], a[2] - b[2])).toBeGreaterThan(0.5)),
  )
})

it("keeps eight-player compact footprints inside the stone plinth", () => {
  const offsets = Array.from({ length: MAX_PLAYERS }, (_, i) => getCharacterOffset(i, true))
  expect(new Set(offsets.map((p) => p.join(","))).size).toBe(8)
  offsets.forEach((a, i) => {
    expect(Math.hypot(a[0], a[2]) + 0.13).toBeLessThan(0.82)
    offsets
      .slice(i + 1)
      .forEach((b) => expect(Math.hypot(a[0] - b[0], a[2] - b[2])).toBeGreaterThan(0.39))
  })
})

it("a visitor can beat a bot in a real two-hit duel without waiting for a timeout", () => {
  const g = setup(1, { dice: () => 1, duelDurationMs: 25000 })
  g.demo()
  g.start()
  g.send(0, "dice.roll.request")
  g.until(() => g.state().duel?.stage === "active")
  const duelId = g.state().duel!.id
  g.send(0, "duel.action", { duelId, action: "swing" })
  vi.advanceTimersByTime(1000)
  g.send(0, "duel.action", { duelId, action: "swing" })
  vi.advanceTimersByTime(500)
  expect(g.state().duel).toMatchObject({
    stage: "result",
    winnerId: g.players[0]!.playerId,
    outcome: "victory",
  })
  expect(g.state().duel!.fighters.find((p) => p.playerId === g.players[0]!.playerId)?.score).toBe(2)
  expect(g.errors).toEqual([])
})

it("finishes a complete demo match, stops bot timers, and restarts without duplicating bots", () => {
  const g = setup(1, {
    dice: () => 6,
    shopDurationMs: 1,
    roundGame: "archery",
    minigameIntroMs: 1,
    minigameDurationMs: 1,
    minigameResultMs: 1,
  })
  g.demo()
  g.start()
  for (let ms = 0; ms < 300000 && g.state().phase !== "FINISHED"; ms += 100) {
    if (g.state().phase === "AWAITING_ROLL" && g.state().currentPlayerId === g.players[0]!.playerId)
      g.send(0, "dice.roll.request")
    vi.advanceTimersByTime(100)
  }
  expect(g.state().phase).toBe("FINISHED")
  expect(g.state().players.find((p) => p.id === g.state().winnerId)?.tileId).toBe("tile-47")
  expect(vi.getTimerCount()).toBe(0)
  g.start()
  expect(g.state().players.filter((p) => p.isBot)).toHaveLength(3)
  expect(g.state().phase).toBe("AWAITING_ROLL")
  expect(g.errors).toEqual([])
})
