# Host client

Laptop-facing code belongs here.

Implemented components:

- `HostPage.tsx`: room lifecycle and top-level host state
- `LobbyOverlay.tsx`: room code, QR code, players, and Start
- `GameOverlay.tsx`: current player, phase, and restart controls
- `DemoPreflight.tsx`: production URL, security, server, and controller readiness checks
- `BoardScene.tsx`: React Three Fiber scene
- `BoardTile.tsx`: one visual board tile
- `CharacterModel.tsx`: animated humanoid assembled from local Three.js geometry with customization-ready appearance data
- `DiceView.tsx`: visual die driven by a server result
- `WorldEnvironment.tsx`: grass island, trees, rocks, flowers, clouds, and daylight environment
- `hostState.ts`: pure projection of authoritative server events into display state
- `useLiveHostGame.ts`: validated Socket.IO room creation, snapshots, host commands, and animation events
- `usePieceAnimation.ts`: path animation driven by `player.moving`

The host renders authoritative state but never generates dice values or advances turns.

Character appearances are data-driven through `CharacterAppearance`, so a future pre-game
customizer can swap skin tone, hair, outfit, shoes, and accessories without replacing movement or
networking code. The current four presets are intentionally distinct and require no external model
files, keeping the hackathon demo deterministic and offline-friendly.

The board uses layered route stones, denser trees and shrubs, small flowers and mushrooms, and a
clearly labeled start gate. The die floats without a pedestal and includes six fully modeled pip
faces, a rounded translucent edge treatment, camera-facing result poses, hover motion, and a light
ring during rolls.

The host selects its mode from `VITE_SOCKET_URL`. With no URL it runs the deterministic fixture
preview. With a URL it creates a live room, validates every received payload, renders snapshots and
incremental player updates, animates server-supplied dice and movement events, and sends only
authenticated Start/Restart commands. It never chooses a live dice value or movement path.

The live host keeps its room code and private host token in tab-scoped session storage. On a socket
reconnect or page refresh it authenticates with `room.host.resume` and renders the server snapshot;
if the in-memory room no longer exists, it clears the stale credentials and creates a new room.
During `MOVING`, the display preserves the animated piece position even though recovery snapshots
already contain the destination, then accepts the final authoritative position at turn end.
