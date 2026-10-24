# Party Board

Party Board is the working repository for a four-player browser board game controlled by phones. The laptop shows a shared 3D board; each phone joins the room and acts as a private controller.

The first milestone is intentionally narrow:

1. A host creates a room and displays a QR code.
2. Four phones join with a name and color.
3. The host starts the game.
4. The active player shakes their phone, or presses a fallback button, to request a roll.
5. The server generates the dice value.
6. The host animates the die and moves the player's piece.
7. The turn advances and the loop repeats.

No mini-games, power-ups, currency, branching paths, or finished art belong in the first milestone.

## Start here

- [Project scope](docs/SCOPE.md)
- [File structure](docs/FILE_STRUCTURE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Network protocol](docs/PROTOCOL.md)
- [Board model](docs/BOARD_MODEL.md)
- [Phone motion](docs/MOTION_CONTROLLER.md)
- [Collaboration workflow](docs/COLLABORATION.md)
- [Ryan's role](docs/roles/RYAN.md)
- [Jack's role](docs/roles/JACK.md)
- [Current task board](docs/tasks/NOW.md)
- [Demo checklist](docs/DEMO_CHECKLIST.md)

## Planned technology

- TypeScript
- React and Vite
- React Three Fiber and Three.js
- Node.js and Socket.IO
- Zod for runtime message validation
- Zustand for client UI state
- Vitest for unit and integration tests
- pnpm workspaces

Exact dependency versions are committed in `pnpm-lock.yaml`.

## Run Ryan's host preview

```powershell
pnpm install
pnpm dev
```

Open `http://localhost:5173/host`. Start the fixture preview and use **Preview roll** to exercise the dice, movement, and four-player turn rotation without depending on the unfinished server.

Run the same verification used by CI:

```powershell
pnpm check
```

## Repository status

Ryan's host/board foundation is implemented on `feat/host-board`. Jack-owned server, controller, and motion areas remain documentation-only until Jack's branch is integrated.

## Named owners

- **Ryan:** host, 3D board, shared protocol, browser networking, workspace configuration, and final integration.
- **Jack:** authoritative server, phone controller, motion detection, and the tests for those areas.

Each person's coding agent must read the matching brief under `docs/roles` before editing.
