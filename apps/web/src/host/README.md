# Host client

Laptop-facing code belongs here.

Planned components:

- `HostPage.tsx`: room lifecycle and top-level host state
- `LobbyOverlay.tsx`: room code, QR code, players, and Start
- `GameOverlay.tsx`: current player, phase, and restart controls
- `BoardScene.tsx`: React Three Fiber scene
- `BoardTile.tsx`: one visual board tile
- `PlayerPiece.tsx`: one colored placeholder piece
- `DiceView.tsx`: visual die driven by a server result
- `usePieceAnimation.ts`: path animation driven by `player.moving`

The host renders authoritative state but never generates dice values or advances turns.
