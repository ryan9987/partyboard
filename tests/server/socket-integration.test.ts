import { afterEach, expect, it } from "vitest"

import { createGameApp } from "../../apps/server/src/server"
import { createGameSocket, type GameSocket } from "../../apps/web/src/networking/socket"
import {
  gameErrorEventSchema,
  gameStateSchema,
  roomCreatedEventSchema,
  roomJoinedEventSchema,
  type ServerToClientEvents,
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
async function listen() {
  app = createGameApp({
    allowedOrigins: ["http://localhost:5173"],
    gameOptions: {
      dice: () => 2,
      rollDurationMs: 10,
      millisecondsPerTile: 5,
      turnEndMs: 10,
      rollTimeoutMs: 30_000,
      disconnectTimeoutMs: 50,
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
})

it("rejects WebSocket handshakes from an unconfigured browser origin", async () => {
  const socket = client(await listen())
  socket.io.opts.extraHeaders = { Origin: "https://untrusted.example" }
  const failure = new Promise<Error>((resolve) => socket.once("connect_error", resolve))
  socket.connect()
  expect((await failure).message).toBeTruthy()
  expect(socket.connected).toBe(false)
})

it("completes five four-controller rotations over actual sockets without duplicate rolls", async () => {
  const url = await listen()
  const host = client(url)
  await connected(host)
  const created = next(host, "room.created")
  host.emit("room.create", {})
  const room = roomCreatedEventSchema.parse(await created)
  const players: Array<{ socket: GameSocket; playerId: string; playerSessionId: string }> = []
  for (const [index, color] of (["coral", "cyan", "gold", "violet"] as const).entries()) {
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
  for (let turn = 0; turn < 20; turn++) {
    const player = players[turn % 4]!
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
  expect(rolls).toBe(20)
  expect(latestState).toMatchObject({ turnNumber: 21, currentPlayerId: players[0]!.playerId })
  expect(gameStateSchema.parse(latestState).players.map((player) => player.tileId)).toEqual(
    Array(4).fill("tile-10"),
  )
})
