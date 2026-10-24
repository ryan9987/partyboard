# Ryan status

Ryan or Ryan's agent owns this file.

## Current

- Ryan's host/board foundation is implemented on `feat/host-board`.
- Waiting for Jack's live server events before replacing the typed fixture.

## Completed

- Named ownership assigned.
- Exact workspace dependencies and lockfile added.
- Public protocol implemented with Zod; private session IDs are excluded from snapshots.
- Validated 20-tile board and wraparound traversal implemented.
- Lazy `/host` route, lobby, QR code, four pieces, die, and turn overlay implemented.
- Fixture-driven dice and movement sequence completes a full player rotation.
- Typed Socket.IO client and room-state hook added for integration.
- CI, lint, formatting, tests, type checking, and production build configured.

## Blockers and handoffs

- Live room creation, host authentication, and authoritative game events depend on Jack's server lane.
- The controller route deliberately remains a placeholder until Jack's controller is integrated.

## Verification

- `pnpm check` passes.
- 8 unit tests pass across board and protocol packages.
- Production Vite build succeeds with the host isolated into a lazy-loaded chunk.
- Browser-tested lobby, QR display, one dice/movement turn, a full four-player rotation, and Reset.
- No browser console errors were observed. Two non-blocking Three.js deprecation warnings originate from the current renderer stack.
