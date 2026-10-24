# Host client

Laptop-facing code belongs here.

Implemented components:

- `HostPage.tsx`: room lifecycle and top-level host state
- `LobbyOverlay.tsx`: room code, QR code, players, and Start
- `GameOverlay.tsx`: current player, phase, and restart controls
- `BoardScene.tsx`: React Three Fiber scene
- `BoardTile.tsx`: one visual board tile
- `CharacterModel.tsx`: animated humanoid assembled from local Three.js geometry with customization-ready appearance data
- `DiceView.tsx`: visual die driven by a server result
- `WorldEnvironment.tsx`: grass island, trees, rocks, flowers, clouds, and daylight environment
- `usePieceAnimation.ts`: path animation driven by `player.moving`

The host renders authoritative state but never generates dice values or advances turns.

Character appearances are data-driven through `CharacterAppearance`, so a future pre-game
customizer can swap skin tone, hair, outfit, shoes, and accessories without replacing movement or
networking code. The current four presets are intentionally distinct and require no external model
files, keeping the hackathon demo deterministic and offline-friendly.
