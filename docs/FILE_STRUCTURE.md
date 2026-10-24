# File structure

This document is the map for contributors and agents. The structure separates the shared contracts from the host, controller, and server so two people can work without editing the same files.

```text
party-board/
├── AGENTS.md                     contributor and coding-agent rules
├── README.md                     project entry point
├── package.json                  root workspace commands
├── pnpm-workspace.yaml           workspace package discovery
├── tsconfig.base.json            shared strict TypeScript settings
├── .env.example                  documented environment variables
├── docs/
│   ├── SCOPE.md                  exact first milestone and exclusions
│   ├── FILE_STRUCTURE.md         this file
│   ├── ARCHITECTURE.md           system responsibilities and flow
│   ├── PROTOCOL.md               shared state and network events
│   ├── BOARD_MODEL.md            tile graph and movement rules
│   ├── MOTION_CONTROLLER.md      permission and shake behavior
│   ├── COLLABORATION.md          ownership, branches, and merge rules
│   ├── INTEGRATION_NOTES.md      cross-lane requests and blockers
│   ├── DEMO_CHECKLIST.md         real-device acceptance checks
│   ├── decisions/                durable architectural decisions
│   ├── roles/                    Ryan and Jack agent briefs
│   ├── status/                   separate collision-free progress logs
│   └── tasks/                    current and later work
├── apps/
│   ├── web/                      React application
│   │   └── src/
│   │       ├── app/              routing and global providers
│   │       ├── host/             laptop lobby and 3D board
│   │       ├── controller/       phone join, permission, and roll UI
│   │       └── networking/       browser socket adapter and hooks
│   └── server/                   authoritative Node/Socket.IO server
│       └── src/
│           ├── rooms/            room creation and membership
│           ├── game/             turns, dice, and movement
│           ├── sessions/         persistent player identity
│           └── sockets/          validated event handlers
├── packages/
│   ├── protocol/                 shared schemas and event types
│   ├── board/                    board definition and traversal
│   └── motion/                   browser motion permission and shake detection
└── tests/                        cross-package integration scenarios
```

## `apps/web`

One Vite application provides two role-based routes:

- `/host` loads the laptop lobby and 3D board.
- `/controller/:roomCode` loads the small phone controller.

The host route must be dynamically imported so controller devices do not need to load the 3D bundle.

## `apps/server`

The only authoritative runtime. It owns room membership, current phase, turn order, dice generation, player positions, timeouts, and reconnection decisions. It does not render animations.

## `packages/protocol`

The most sensitive shared package. It contains data only: Zod schemas, inferred TypeScript types, event names, and state snapshots. It must not import React, Three.js, browser APIs, or server implementations.

## `packages/board`

Pure board data and traversal functions. It should be testable without a browser or 3D renderer. The first board is a single loop with one outgoing edge per tile.

## `packages/motion`

Browser-side motion permission and shake recognition. It reports a discrete `onShake` signal. It never rolls dice or sends network messages directly.

## `tests`

Cross-package scenarios that are larger than a package unit test, such as joining a room, rejecting an out-of-turn roll, reconnecting, and completing a full rotation.

## `docs/roles` and `docs/status`

`roles` contains the durable boundaries and deliverables for Ryan and Jack. `status` gives each person a separate progress file so their agents can report work without editing the same task document.
