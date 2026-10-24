# Ryan's role: host, board, and integration

## Branch

Use `feat/host-board` for the initial implementation. Do not develop directly on `main`.

## Owned paths

Ryan and Ryan's agents may edit:

- `apps/web/src/host/**`
- `packages/board/**`
- `packages/protocol/**`
- `apps/web/src/app/**`
- `apps/web/src/networking/**`
- Root package manifests and lockfile
- Shared TypeScript, lint, formatter, test, and CI configuration
- Board and host tests
- `docs/status/RYAN.md`

Ryan is also the integration owner responsible for connecting Jack's server events to the host after each lane works independently.

## Initial deliverables

1. Convert `docs/PROTOCOL.md` into Zod schemas and inferred TypeScript types.
2. Scaffold the workspace dependencies and shared configuration.
3. Define and validate a winding 32-tile route with safe wraparound.
4. Test movement and wraparound traversal.
5. Create `/host` and lazy role-based routing.
6. Render the board from its data definition.
7. Render four colored placeholder pieces.
8. Animate a supplied dice value.
9. Animate a supplied movement path.
10. Build the lobby and turn overlays against typed fixtures.
11. Implement the typed browser socket adapter after Jack's server contract is available.
12. Integrate the live host flow without changing Jack-owned server code.

## Files Ryan must not edit without coordination

- `apps/server/**`
- `apps/web/src/controller/**`
- `packages/motion/**`
- Jack-owned tests
- `docs/status/JACK.md`

If Jack-owned behavior appears incorrect, add a concise entry to `docs/INTEGRATION_NOTES.md` and notify Jack. Do not silently repair his lane.

## First acceptance checkpoint

With no live server required, the host can render a typed four-player fixture, animate a supplied dice value from 1 through 6, and move the specified piece through an exact path including board wraparound. Board tests and type checking pass.

## Agent kickoff text

```text
You are working as Ryan's agent for this repository. Read AGENTS.md,
docs/roles/RYAN.md, docs/SCOPE.md, docs/PROTOCOL.md, docs/BOARD_MODEL.md,
and docs/tasks/NOW.md completely before editing. Work only in Ryan-owned paths.
Do not implement mini-games or edit Jack-owned files. Verify tests and type
checking, then update docs/status/RYAN.md with the result.
```
