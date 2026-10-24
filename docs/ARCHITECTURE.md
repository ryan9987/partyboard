# Architecture

## System overview

```text
Phone controller(s) ── Socket.IO ──▶ Authoritative server
       ▲                                  │
       │                                  │ snapshots and events
       └──────── player-specific UI       ▼
                                   Laptop host display
```

## Authority

The server owns:

- Room codes and membership
- Player session identity
- Player order
- Current phase and current player
- Dice values
- Player tile positions
- Duplicate request protection
- Disconnect and turn timeouts

The host owns:

- 3D rendering
- Dice and piece animation
- Lobby presentation
- QR code presentation
- Host controls such as Start and Restart

The controller owns:

- Motion permission UI
- Local shake recognition
- Touch fallback UI
- Player-specific turn status
- Sending a single roll request

## Authoritative flow

1. Active controller recognizes a shake.
2. Controller creates a unique `requestId` and emits `dice.roll.request`.
3. Server validates the payload and session.
4. Server confirms the player is active and the phase is `AWAITING_ROLL`.
5. Server ignores a previously processed `requestId`.
6. Server generates a value from 1 through 6.
7. Server calculates the complete tile path.
8. Server changes the phase to `ROLLING` and broadcasts the result.
9. At the defined time, the server changes to `MOVING` and broadcasts the path.
10. The host animates the path while the server schedules the next phase.
11. The server advances the turn and broadcasts a fresh snapshot.

The host does not send `animation.finished` to control the game. Known server durations prevent a lost host message from freezing the room. The browser keeps the room code and private host token in session storage. A reconnecting host sends `room.host.resume`, receives the latest authoritative snapshot, and does not create or reset a room.

## Timing defaults

| Action | Current default |
|---|---:|
| Dice animation | 900 ms |
| Movement per tile | 420 ms |
| Turn-end pause | 500 ms |
| Connected player's roll deadline | None |
| Shop deadline | None |
| Rules/results | Host continues when ready |
| Active-player disconnect grace | 60 seconds |

These are configuration values, not protocol constants.

## Deployment shape

The final demo must use HTTPS because mobile motion permission may require a secure context. Prefer one public origin for the web client and an HTTPS/WSS-compatible server endpoint. The browser-visible QR URL comes from `VITE_CONTROLLER_URL`; do not hard-code localhost into the host UI.

## Failure behavior

- Invalid payload: reject with a safe `game.error` response.
- Wrong player: reject without changing state.
- Duplicate request: acknowledge the previous outcome or ignore it; never roll again.
- Active player disconnects: reserve their session briefly, then skip if they do not return.
- Host disconnects: game state remains on the server.
- Motion denied: controller exposes the Roll button.
- Server restarts: losing in-memory rooms is acceptable for the first milestone, but the UI must show that the room no longer exists.
