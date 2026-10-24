# Authoritative server

Node.js / Socket.IO authority for in-memory rooms, private player sessions, dice, positions, phases, turn rotation, request deduplication, and reconnection. Room state is deliberately lost when the server stops.

## Development

After `pnpm install --frozen-lockfile`, run `pnpm dev` from the root to start Vite and the server together, or `pnpm --filter @party-board/server dev` for the server alone. The entry point reads optional root `.env` values:

- `PORT`: defaults to 3001.
- `ALLOWED_ORIGINS`: comma-separated exact web origins, default `http://localhost:5173`. Include the LAN web origin when testing from phones. Both WebSocket and polling handshakes enforce this list; native debug clients may omit Origin.

Socket.IO 4.8.4 supplies the actual network transport, matching the browser client version. `tsx` 4.23.15 runs TypeScript workspace sources in development and the initial demo without adding a separate compilation pipeline. `socket.io-client` 4.8.4 is a development dependency for the temporary text host. All versions are committed in the coordinated lockfile update. Board/protocol packages supply the frozen public APIs.

`GameServer` is independently testable: deliver validated events using its `deliver(connectionId, event, payload)` callback; route raw client commands through `handle`; call `disconnect` for transport detach and `dispose` on shutdown. Its connection map only attaches transports to separately generated player/session IDs. `attachGameConnection` binds the exact shared event names to Socket.IO. `createGameApp` creates the HTTP and Socket.IO listeners and an asynchronous close operation.

## Live host and optional text host

Ryan's `/host` now connects to this server when `VITE_SOCKET_URL` is configured for Vite. It creates the real room, displays its controller QR URL, starts/restarts the game, and consumes authoritative dice/movement events. With no server URL, it retains the fixture preview.

For an independent backend check, the optional text host still supports real controllers:

1. Put `VITE_SOCKET_URL=http://localhost:3001` in `apps/web/.env.local` and run `pnpm dev`.
2. In another terminal, run `pnpm --filter @party-board/server debug:host`.
3. Open the printed `/controller/ROOM` URL in up to four browser profiles or phones and choose distinct colors.
4. Type `start` in the text-host terminal. Players use touch or shake while the terminal prints authoritative snapshots. Type `restart`, `show`, or `quit` as needed.

For phones, replace localhost with the laptop's LAN address in the browser-facing URLs and include that web origin in `ALLOWED_ORIGINS`. Set root `VITE_CONTROLLER_URL` for the printed URL. `SOCKET_URL` can override the debug host's default local server address. Motion still requires a secure context on real devices; touch can be tested on local HTTP.

## Turn and recovery behavior

- Up to four players join the lobby with distinct colors. Names, colors, room codes, tokens, request IDs, unknown fields, and outgoing state/events are validated against shared schemas.
- Host commands require the private host token. Private create/join replies go only to their requesting connection. Public snapshots never contain credentials.
- Refreshing with an existing private session reattaches the same player and replaces the previous transport. A superseded connection cannot roll or mark that player disconnected.
- Only the active attached player can roll during `AWAITING_ROLL`. Each accepted session/request pair remains deduplicated for the room lifetime, including across restarts.
- Server dice use `crypto.randomInt(1, 7)`. Board movement uses `getMovementPath(defaultBoard, tileId, diceValue)`.
- The server schedules 900 ms rolling, 300 ms per tile, and a 500 ms turn-end pause. It requires no animation completion acknowledgement. At movement start, snapshots contain the destination so rejoining screens can recover immediately.
- Connected players have 30 seconds to request a roll. An awaiting active player's disconnect replaces that deadline with a 60-second reconnect grace period. Reattachment restores a 30-second deadline.
- Turn order skips disconnected players. With nobody connected, the room pauses in `TURN_END` with no active player or timer; a rejoining player resumes it. No `turn.ended` event is emitted while no next player exists, because the shared schema requires a next player. Public snapshots remain authoritative.
- Membership/session reservations last for the room lifetime; disconnected players are not evicted or replaced. Restart cancels pending animation timers, resets positions, retains membership and request deduplication, and starts a new turn. Turn numbers remain monotonic across restarts to distinguish old UI events.

Read-only host reattachment is not defined in the current shared protocol. An authenticated start/restart can attach a host connection; a future host resume command needs joint protocol approval. No new events or fields are invented here.

## Verification

`pnpm exec vitest run tests/server` exercises room privacy, four-player/five-rotation loops, wraparound, duplicate and unauthorized requests, restart timer cancellation, disconnects, reattachment, and controller input/session behavior. `pnpm --filter @party-board/server typecheck` checks server code.

A physical four-phone test on the intended demo network remains required. Automated tests do not satisfy that milestone.
