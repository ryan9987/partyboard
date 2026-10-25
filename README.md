# Party Board

Partyboard is a woodland board game for up to **eight players**, controlled by phone motion.
The laptop shows the shared 3D world; phones shake to roll, tilt to balance/aim, and flick
to cast, reel, release arrows, pass, swing and strike. Touch fallbacks remain accessible.

Race to the end of the 48-space trail, shop for power-ups, duel over occupied spaces, and
compete in Hot Potato, Balance, Fishing, Archery and Rhythm. Dice, results, coins and turns
are server-authoritative. Dodge is retired.

Presenting alone? Join one phone, click **Demo mode** in the host lobby, then **Start game**.
Three gentle bots handle their own turns and activities. See the
[presenter's guide](docs/PRESENTER_DEMO.md) for setup and physical-phone checks.

The original first milestone (historical) was intentionally narrow:

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
- [Deployment and preflight](docs/DEPLOYMENT.md)

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

Open `http://localhost:5173/host` and join using its QR code. The live server runs on port 3001.
Use the configured HTTPS deployment for phone sensor permission. `/rehearsal` and
`/phone-preview` are development-only visual tools; the former can preview four/eight players.

Run the same verification used by CI:

```powershell
pnpm check
```

## Repository status

Ryan and Jack's host, server, controller and motion work is integrated. Main includes the
eight-player motion-first demo flow. Run `pnpm check` before pushing, and rehearse on the
actual presentation phone/network; automated desktop checks do not certify physical sensors.

## Named owners

- **Ryan:** host, 3D board, shared protocol, browser networking, workspace configuration, and final integration.
- **Jack:** authoritative server, phone controller, motion detection, and the tests for those areas.

Each person's coding agent must read the matching brief under `docs/roles` before editing.
