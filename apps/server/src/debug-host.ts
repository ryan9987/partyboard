import { createInterface } from "node:readline"
import { io, type Socket } from "socket.io-client"
import {
  gameErrorEventSchema,
  gameStateSchema,
  hostCommandSchema,
  roomCreatedEventSchema,
  roomCreateRequestSchema,
  type ClientToServerEvents,
  type ServerToClientEvents,
  type GameState,
  type RoomCreatedEvent,
} from "@party-board/protocol"

// Temporary text host for Jack's acceptance checkpoint while Ryan connects the 3D host.
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  process.env.SOCKET_URL ?? "http://localhost:3001",
)
const terminal = createInterface({ input: process.stdin, output: process.stdout })
let room: RoomCreatedEvent | null = null
let state: GameState | null = null
socket.on("connect", () => {
  if (!room) socket.emit("room.create", roomCreateRequestSchema.parse({}))
  else console.log("Reconnected. Type restart to reattach this debug host and reset the match.")
})
socket.on("connect_error", () => console.log("Cannot reach the server. Retrying…"))
socket.on("room.created", (payload) => {
  const parsed = roomCreatedEventSchema.safeParse(payload)
  if (!parsed.success) {
    console.error("Invalid room response")
    return
  }
  room = parsed.data
  state = room.state
  const base = (process.env.VITE_CONTROLLER_URL ?? "http://localhost:5173/controller").replace(
    /\/+$/,
    "",
  )
  console.log(`Room ${room.roomCode}: ${base}/${room.roomCode}`)
  console.log("Join up to four phones, then type start. Other commands: restart, show, quit.")
})
socket.on("room.snapshot", (payload) => {
  const parsed = gameStateSchema.safeParse(payload)
  if (!parsed.success) {
    console.error("Invalid snapshot")
    return
  }
  state = parsed.data
  console.log(JSON.stringify(state))
})
socket.on("game.error", (payload) => {
  const parsed = gameErrorEventSchema.safeParse(payload)
  if (parsed.success) console.error(`${parsed.data.code}: ${parsed.data.message}`)
})
terminal.on("line", (line) => {
  const command = line.trim().toLowerCase()
  if (command === "quit") {
    terminal.close()
    return
  }
  if (command === "show") {
    console.log(JSON.stringify(state))
    return
  }
  if (command !== "start" && command !== "restart") {
    console.log("Commands: start, restart, show, quit")
    return
  }
  if (!room || !socket.connected) {
    console.log("Wait for a room connection.")
    return
  }
  socket.emit(
    command === "start" ? "game.start" : "game.restart",
    hostCommandSchema.parse({ roomCode: room.roomCode, hostToken: room.hostToken }),
  )
})
terminal.on("close", () => socket.disconnect())
