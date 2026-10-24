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

- [x] Define and validate a winding 32-tile route with safe wraparound.
- [x] Test wraparound traversal.
- [x] Render board tiles from the board definition.
- [x] Render four placeholder player pieces.
- [x] Animate a supplied dice value.
- [x] Animate a supplied movement path.
- [x] Build a host lobby against a typed fixture.
- [x] Render the route as a forward journey with distance fog and a following camera.

### Jack — server/controller lane

- [x] Create and join an in-memory room.
- [x] Issue private player session IDs.
- [x] Store the controller session ID locally.
- [x] Implement the authoritative phase machine.
- [x] Validate and deduplicate roll requests.
- [x] Generate dice values on the server.
- [x] Implement the touch Roll button.
- [x] Build motion permission and shake detection.

## Phase 2: integration

- [x] Replace the host fixture with live room snapshots.
- [x] Connect dice events to the host animation.
- [x] Connect movement events to the correct piece.
- [x] Confirm the controller disables after submission.
- [x] Confirm the server advances turns on its own timers.
- [x] Add reconnection and active-player timeout behavior.

## Phase 3: deployment and proof

- [ ] Deploy an HTTPS build.
- [x] Generate and validate the controller QR code from environment configuration.
- [x] Add an in-app preflight for HTTPS, server connection, and controller readiness.
- [x] Complete the automated and desktop-browser portions of the demo checklist.
- [x] Polish the floating die, start marker, route tiles, and world dressing for presentation.
- [ ] Test iPhone motion permission.
- [ ] Test Android motion behavior.
- [ ] Complete the full demo checklist.
- [ ] Tag a known-good demo version.
