import { afterEach, expect, it } from "vitest"

import { createGameApp } from "../../apps/server/src/server"
import { createGameSocket, type GameSocket } from "../../apps/web/src/networking/socket"
import {
  gameErrorEventSchema,
  gameStateSchema,
  roomCreatedEventSchema,
  roomJoinedEventSchema,
  type ServerToClientEvents,
  type MinigameKind,
  PLAYER_COLORS,
} from "../../packages/protocol/src/index"

const sockets: GameSocket[] = []
let app: ReturnType<typeof createGameApp> | undefined
const next = (socket: GameSocket, event: keyof ServerToClientEvents) =>
  new Promise<unknown>((resolve) => {
    socket.once(event, resolve as never)
  })
const connected = (socket: GameSocket) =>
  new Promise<void>((resolve, reject) => {
    socket.once("connect", resolve)
    socket.once("connect_error", reject)
    socket.connect()
  })
afterEach(async () => {
  sockets.splice(0).forEach((socket) => socket.disconnect())
  await app?.close()
  app = undefined
})
async function listen(roundGame: MinigameKind | "potato" = "potato", durationMs = 1500) {
  app = createGameApp({
    allowedOrigins: ["http://localhost:5173"],
    gameOptions: {
      roundGame,
      minigameIntroMs: 100,
      manualStageAdvance: false,
      minigameDurationMs: durationMs,
      minigameResultMs: 100,
      dice: () => 2,
      rollDurationMs: 10,
      millisecondsPerTile: 5,
      turnEndMs: 10,
      rollTimeoutMs: 30_000,
      disconnectTimeoutMs: 50,
      duelIntroMs: 10,
      duelDurationMs: 50,
      duelResultMs: 10,
      shopDurationMs: 1,
      potatoIntroMs: 1,
      potatoFuseMs: 1,
      potatoResultMs: 1,
    },
  })
  await new Promise<void>((resolve) => app!.httpServer.listen(0, "127.0.0.1", resolve))
  const address = app.httpServer.address()
  if (!address || typeof address === "string") throw Error("Missing server address")
  return `http://127.0.0.1:${address.port}`
}
function client(url: string) {
  const socket = createGameSocket(url)
  socket.io.opts.reconnection = false
  sockets.push(socket)
  return socket
}

it("uses actual Socket.IO for private joins, schema errors, a roll, and refresh recovery", async () => {
  const url = await listen()
  const host = client(url)
  const phone = client(url)
  await Promise.all([connected(host), connected(phone)])
  const roomCreated = next(host, "room.created")
  host.emit("room.create", {})
  const room = roomCreatedEventSchema.parse(await roomCreated)
  const roomJoined = next(phone, "room.joined")
  const snapshotEvent = next(host, "room.snapshot")
  phone.emit("room.join", { roomCode: room.roomCode, name: "Jack", color: "coral" })
  const joined = roomJoinedEventSchema.parse(await roomJoined)
  const publicSnapshot = gameStateSchema.parse(await snapshotEvent)
  expect(JSON.stringify(publicSnapshot)).not.toContain(joined.playerSessionId)
  const started = next(phone, "turn.started")
  host.emit("game.start", { roomCode: room.roomCode, hostToken: room.hostToken })
  await started
  const rejected = next(phone, "game.error")
  // Deliberately exercise runtime validation beyond TypeScript's compile-time event types.
  phone.emit("dice.roll.request", { roomCode: room.roomCode } as never)
  expect(gameErrorEventSchema.parse(await rejected).code).toBe("INVALID_PAYLOAD")
  const rolled = next(host, "dice.rolled")
  const crossingCoins: number[] = []
  host.on("room.snapshot", (state) => {
    crossingCoins.push(gameStateSchema.parse(state).players[0]!.coins!)
  })
  const moved = next(host, "player.moving")
  const ended = next(host, "turn.ended")
  phone.emit("dice.roll.request", {
    roomCode: room.roomCode,
    playerSessionId: joined.playerSessionId,
    requestId: crypto.randomUUID(),
  })
  expect(await rolled).toMatchObject({ playerId: joined.playerId, value: 2 })
  expect(await moved).toMatchObject({
    fromTileId: "tile-0",
    toTileId: "tile-2",
    path: ["tile-1", "tile-2"],
  })
  await ended
  expect(crossingCoins).toContain(7)
  expect(crossingCoins).not.toContain(8)
  expect(crossingCoins.every((coins) => coins === 6 || coins === 7)).toBe(true)
  phone.disconnect()
  const replacement = client(url)
  await connected(replacement)
  const restored = next(replacement, "room.joined")
  replacement.emit("room.join", {
    roomCode: room.roomCode,
    name: "Jack",
    color: "coral",
    existingSessionId: joined.playerSessionId,
  })
  expect(roomJoinedEventSchema.parse(await restored)).toMatchObject({
    playerId: joined.playerId,
    state: { players: [{ tileId: "tile-2" }] },
  })

  host.disconnect()
  const replacementHost = client(url)
  await connected(replacementHost)
  const hostSnapshot = next(replacementHost, "room.snapshot")
  replacementHost.emit("room.host.resume", {
    roomCode: room.roomCode,
    hostToken: room.hostToken,
  })
  expect(gameStateSchema.parse(await hostSnapshot)).toMatchObject({
    roomCode: room.roomCode,
    players: [{ id: joined.playerId, tileId: "tile-2" }],
  })
})

it("rejects WebSocket handshakes from an unconfigured browser origin", async () => {
  const socket = client(await listen())
  socket.io.opts.extraHeaders = { Origin: "https://untrusted.example" }
  const failure = new Promise<Error>((resolve) => socket.once("connect_error", resolve))
  socket.connect()
  expect((await failure).message).toBeTruthy()
  expect(socket.connected).toBe(false)
})

it.each([4, 8])(
  "completes five %i-controller rotations over actual sockets without duplicate rolls",
  async (count) => {
    const url = await listen()
    const host = client(url)
    await connected(host)
    const created = next(host, "room.created")
    host.emit("room.create", {})
    const room = roomCreatedEventSchema.parse(await created)
    const players: Array<{ socket: GameSocket; playerId: string; playerSessionId: string }> = []
    for (const [index, color] of PLAYER_COLORS.slice(0, count).entries()) {
      const phone = client(url)
      await connected(phone)
      const joined = next(phone, "room.joined")
      phone.emit("room.join", { roomCode: room.roomCode, name: `Player ${index}`, color })
      const player = roomJoinedEventSchema.parse(await joined)
      players.push({
        socket: phone,
        playerId: player.playerId,
        playerSessionId: player.playerSessionId,
      })
    }
    let rolls = 0
    let latestState: ReturnType<typeof gameStateSchema.parse> | null = null
    host.on("dice.rolled", () => {
      rolls++
    })
    host.on("room.snapshot", (payload) => {
      latestState = gameStateSchema.parse(payload)
    })
    const started = next(host, "game.started")
    host.emit("game.start", { roomCode: room.roomCode, hostToken: room.hostToken })
    await started
    for (let turn = 0; turn < count * 5; turn++) {
      const player = players[turn % count]!
      const ended = next(host, "turn.ended")
      const newTurnSnapshot = new Promise<void>((resolve) => {
        const handler = (payload: unknown) => {
          const state = gameStateSchema.parse(payload)
          if (state.phase === "AWAITING_ROLL" && state.turnNumber === turn + 2) {
            host.off("room.snapshot", handler)
            resolve()
          }
        }
        host.on("room.snapshot", handler)
      })
      const request = {
        roomCode: room.roomCode,
        playerSessionId: player.playerSessionId,
        requestId: crypto.randomUUID(),
      }
      player.socket.emit("dice.roll.request", request)
      player.socket.emit("dice.roll.request", request)
      await ended
      await newTurnSnapshot
    }
    expect(rolls).toBe(count * 5)
    expect(latestState).toMatchObject({
      turnNumber: count * 5 + 1,
      currentPlayerId: players[0]!.playerId,
    })
    expect(gameStateSchema.parse(latestState).players.map((player) => player.tileId)).toEqual(
      Array(count).fill("tile-10"),
    )
  },
  15000,
)

it.each(["archery", "fishing"] as const)(
  "carries %s inputs and refresh recovery over real sockets, returning coin rewards to the board",
  async (kind) => {
    const url = await listen(kind, kind === "fishing" ? 5000 : 1500)
    const host = client(url)
    await connected(host)
    const created = next(host, "room.created")
    host.emit("room.create", {})
    const room = roomCreatedEventSchema.parse(await created)
    const phones: Array<{ socket: GameSocket; playerSessionId: string }> = []
    for (const color of ["coral", "cyan"] as const) {
      const phone = client(url)
      await connected(phone)
      const joined = next(phone, "room.joined")
      phone.emit("room.join", { roomCode: room.roomCode, name: color, color })
      phones.push({
        socket: phone,
        playerSessionId: roomJoinedEventSchema.parse(await joined).playerSessionId,
      })
    }
    const waitState = (predicate: (state: ReturnType<typeof gameStateSchema.parse>) => boolean) =>
      new Promise<ReturnType<typeof gameStateSchema.parse>>((resolve) => {
        const handler = (payload: unknown) => {
          const state = gameStateSchema.parse(payload)
          if (predicate(state)) {
            host.off("room.snapshot", handler)
            resolve(state)
          }
        }
        host.on("room.snapshot", handler)
      })
    const started = next(host, "game.started")
    host.emit("game.start", { roomCode: room.roomCode, hostToken: room.hostToken })
    await started
    const command = (i: number) =>
      phones[i]!.socket.emit("dice.roll.request", {
        roomCode: room.roomCode,
        playerSessionId: phones[i]!.playerSessionId,
        requestId: crypto.randomUUID(),
      })
    const turn2 = waitState((state) => state.phase === "AWAITING_ROLL" && state.turnNumber === 2)
    command(0)
    await turn2
    const active = waitState((state) => state.minigame?.stage === "active")
    command(1)
    const game = (await active).minigame!
    const scored = waitState((state) => state.minigame?.players[0]?.attempts === 1)
    phones[0]!.socket.emit("minigame.input", {
      roomCode: room.roomCode,
      playerSessionId: phones[0]!.playerSessionId,
      requestId: crypto.randomUUID(),
      gameId: game.id,
      sequence: 100,
      axis: 0,
      action: true,
    })
    const firstAction = (await scored).minigame!.players[0]!
    if (kind === "archery") expect(firstAction.score).toBeGreaterThan(0)
    else expect(firstAction.status).toBe("casting")
    phones[0]!.socket.disconnect()
    const refreshed = client(url)
    await connected(refreshed)
    const rejoined = next(refreshed, "room.joined")
    refreshed.emit("room.join", {
      roomCode: room.roomCode,
      name: "coral",
      color: "coral",
      existingSessionId: phones[0]!.playerSessionId,
    })
    const recovered = roomJoinedEventSchema.parse(await rejoined)
    expect(recovered.state.minigame!.players[0]).toMatchObject({ alive: true, attempts: 1 })
    const steering = waitState((state) => state.minigame?.players[0]?.axis === 0.6)
    refreshed.emit("minigame.input", {
      roomCode: room.roomCode,
      playerSessionId: phones[0]!.playerSessionId,
      requestId: crypto.randomUUID(),
      gameId: game.id,
      sequence: 0,
      axis: 0.6,
      action: false,
    })
    expect((await steering).players).toHaveLength(2)
    if (kind === "fishing") {
      await waitState((state) => state.minigame?.players[0]?.status === "bite")
      const caught = waitState((state) => state.minigame?.players[0]?.status === "caught")
      refreshed.emit("minigame.input", {
        roomCode: room.roomCode,
        playerSessionId: phones[0]!.playerSessionId,
        requestId: crypto.randomUUID(),
        gameId: game.id,
        sequence: 1,
        axis: 0,
        action: true,
      })
      expect((await caught).minigame!.players[0]!.score).toBe(100)
    }
    const result = await waitState((state) => state.minigame?.stage === "result")
    expect(result.minigame!.winnerIds).toEqual([result.players[0]!.id])
    const resumed = await waitState(
      (state) => state.phase === "AWAITING_ROLL" && state.roundNumber === 2,
    )
    expect(resumed.currentPlayerId).toBe(result.players[0]!.id)
    expect(resumed.players[0]!.coins).toBe(11)
    expect(resumed.players[1]!.coins).toBe(8)
  },
  10_000,
)
