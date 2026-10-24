# Phone controller

Phone-facing code belongs here.

Planned screens and components:

- `JoinPage.tsx`: room code, name, and color
- `MotionPermission.tsx`: explicit permission request and status
- `LobbyPage.tsx`: connected players and ready state
- `TurnPage.tsx`: active-player shake and Roll button UI
- `WaitingPage.tsx`: current player and connection state
- `RollButton.tsx`: accessible fallback that is always available

The controller sends one roll request. It never selects a dice value or changes a tile position.
