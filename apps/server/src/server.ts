import { createServer } from "node:http"
import { Server } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents } from "@party-board/protocol"

import { GameServer, type GameServerOptions } from "./game/game-server"
import { attachGameConnection } from "./sockets/connection"

export function createGameApp({
  allowedOrigins,
  gameOptions = {},
}: {
  allowedOrigins: string[]
  gameOptions?: Omit<GameServerOptions, "deliver">
}) {
  if (!allowedOrigins.length) throw new Error("At least one browser origin must be configured")
  const httpServer = createServer((_request, response) => {
    response.writeHead(404)
    response.end()
  })
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: allowedOrigins },
    // CORS alone does not restrict WebSocket connections. Native debug clients have no Origin.
    allowRequest: (request, callback) =>
      callback(null, !request.headers.origin || allowedOrigins.includes(request.headers.origin)),
    maxHttpBufferSize: 16_384,
  })
  const game = new GameServer({
    ...gameOptions,
    deliver: (connectionId, event, payload) => {
      // Dynamic event/payload pairing is validated by GameServer before delivery.
      io.sockets.sockets.get(connectionId)?.emit(event, payload as never)
    },
  })
  io.on("connection", (socket) => {
    attachGameConnection(game, socket)
  })
  return {
    httpServer,
    io,
    game,
    close: () => {
      game.dispose()
      return new Promise<void>((resolve) => {
        io.close(() => resolve())
      })
    },
  }
}
