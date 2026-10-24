import type { ClientToServerEvents, ServerToClientEvents } from "@party-board/protocol"
import { io, type Socket } from "socket.io-client"

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export function createGameSocket(serverUrl = import.meta.env.VITE_SOCKET_URL): GameSocket {
  if (!serverUrl) {
    throw new Error("VITE_SOCKET_URL is required to connect to the game server")
  }

  return io(serverUrl, {
    autoConnect: false,
    transports: ["websocket", "polling"],
  })
}
