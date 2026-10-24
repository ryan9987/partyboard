import { CLIENT_EVENTS } from "@party-board/protocol"
import type { GameServer } from "../game/game-server"

/** Minimal Socket.IO-compatible surface; credentials never depend on this transient ID. */
export type ServerConnection = {
  id: string
  on(event: string, listener: (payload?: unknown) => void): unknown
  off(event: string, listener: (payload?: unknown) => void): unknown
}

export function attachGameConnection(server: GameServer, connection: ServerConnection): () => void {
  const listeners = Object.values(CLIENT_EVENTS).map((event) => {
    const listener = (payload?: unknown) => server.handle(connection.id, event, payload)
    connection.on(event, listener)
    return { event, listener }
  })
  const disconnected = () => server.disconnect(connection.id)
  connection.on("disconnect", disconnected)
  return () => {
    for (const { event, listener } of listeners) connection.off(event, listener)
    connection.off("disconnect", disconnected)
    server.disconnect(connection.id)
  }
}
