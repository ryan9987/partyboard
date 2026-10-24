# Jack's role: server, controller, and motion

## Branch

Use `feat/server-controller` for the initial implementation. Do not develop directly on `main`.

## Owned paths

Jack and Jack's agents may edit:

- `apps/server/**`
- `apps/web/src/controller/**`
- `packages/motion/**`
- Room, session, turn, controller, and shake-detector tests
- `docs/status/JACK.md`

## Initial deliverables

1. Implement in-memory room creation and lookup.
2. Join up to four controllers with name and available color.
3. Issue private persistent player session IDs.
4. Reattach a refreshed controller to its existing player.
5. Implement the authoritative turn state machine.
6. Validate that only the active player can request a roll.
7. Deduplicate roll requests by `requestId`.
8. Generate dice values from 1 through 6 on the server.
9. Calculate movement using the public board-package API.
10. Broadcast snapshots, dice results, and movement events defined by the protocol.
11. Implement phone join, lobby, waiting, and active-turn screens.
12. Implement an always-available touch Roll button.
13. Implement motion permission and discrete shake recognition.
14. Add active-player disconnect timeout behavior.

## Files Jack must not edit without coordination

- `apps/web/src/host/**`
- `packages/board/**`
- `packages/protocol/**`
- `apps/web/src/app/**`
- `apps/web/src/networking/**`
- Root package manifests or lockfile
- Shared build, lint, test, or CI configuration
- Ryan-owned tests
- `docs/status/RYAN.md`

If a shared schema, dependency, script, or board API is missing, add an exact request to `docs/INTEGRATION_NOTES.md` and notify Ryan. Continue with unblocked work rather than editing shared files.

## First acceptance checkpoint

Using the committed protocol and board APIs, a debug client can create a room, join four players, start a game, accept one roll request only from the active player, produce one dice result, advance positions and turns, and reject duplicate requests. Controller and server tests pass.

## Agent kickoff text

```text
You are working as Jack's agent for this repository. Read AGENTS.md,
docs/roles/JACK.md, docs/SCOPE.md, docs/PROTOCOL.md,
docs/MOTION_CONTROLLER.md, and docs/tasks/NOW.md completely before editing.
Work only in Jack-owned paths. Do not implement mini-games or edit Ryan-owned
files. Request shared changes through docs/INTEGRATION_NOTES.md. Verify tests
and type checking, then update docs/status/JACK.md with the result.
```
