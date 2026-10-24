# Current task board

No mini-game work belongs on this board.

## Phase 0: joint foundation

- [ ] Confirm the project name and GitHub repository destination.
- [x] Assign Ryan as host/board and integration owner.
- [x] Assign Jack as server/controller and motion owner.
- [x] Assign Ryan as the sole editor of shared manifests and `packages/protocol`.
- [ ] Review and approve `docs/PROTOCOL.md`.
- [ ] Decide whether public snapshots omit private session IDs.
- [ ] Scaffold the pnpm packages and commit exact dependency versions.
- [ ] Add formatting, linting, test, and type-check configuration.
- [ ] Add a CI workflow that runs build, tests, and type checking.

## Phase 1: parallel foundations

### Ryan — host/board lane

- [ ] Define and validate a 20-tile loop.
- [ ] Test wraparound traversal.
- [ ] Render board tiles from the board definition.
- [ ] Render four placeholder player pieces.
- [ ] Animate a supplied dice value.
- [ ] Animate a supplied movement path.
- [ ] Build a host lobby against a typed fixture.

### Jack — server/controller lane

- [ ] Create and join an in-memory room.
- [ ] Issue private player session IDs.
- [ ] Store the controller session ID locally.
- [ ] Implement the authoritative phase machine.
- [ ] Validate and deduplicate roll requests.
- [ ] Generate dice values on the server.
- [ ] Implement the touch Roll button.
- [ ] Build motion permission and shake detection.

## Phase 2: integration

- [ ] Replace the host fixture with live room snapshots.
- [ ] Connect dice events to the host animation.
- [ ] Connect movement events to the correct piece.
- [ ] Confirm the controller disables after submission.
- [ ] Confirm the server advances turns on its own timers.
- [ ] Add reconnection and active-player timeout behavior.

## Phase 3: deployment and proof

- [ ] Deploy an HTTPS build.
- [ ] Generate the controller QR code from environment configuration.
- [ ] Test iPhone motion permission.
- [ ] Test Android motion behavior.
- [ ] Complete the full demo checklist.
- [ ] Tag a known-good demo version.
