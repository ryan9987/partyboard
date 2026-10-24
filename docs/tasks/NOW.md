# Current task board

No mini-game work belongs on this board.

## Phase 0: joint foundation

- [x] Confirm the project name and GitHub repository destination.
- [x] Assign Ryan as host/board and integration owner.
- [x] Assign Jack as server/controller and motion owner.
- [x] Assign Ryan as the sole editor of shared manifests and `packages/protocol`.
- [x] Review and implement `docs/PROTOCOL.md` for the initial integration contract.
- [x] Keep private session IDs out of public snapshots.
- [x] Scaffold the pnpm packages and lock exact dependency versions.
- [x] Add formatting, linting, test, and type-check configuration.
- [x] Add a CI workflow that runs the full repository check.

## Phase 1: parallel foundations

### Ryan — host/board lane

- [x] Define and validate a 20-tile loop.
- [x] Test wraparound traversal.
- [x] Render board tiles from the board definition.
- [x] Render four placeholder player pieces.
- [x] Animate a supplied dice value.
- [x] Animate a supplied movement path.
- [x] Build a host lobby against a typed fixture.

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
- [x] Generate and validate the controller QR code from environment configuration.
- [x] Add an in-app preflight for HTTPS, server connection, and controller readiness.
- [ ] Test iPhone motion permission.
- [ ] Test Android motion behavior.
- [ ] Complete the full demo checklist.
- [ ] Tag a known-good demo version.
