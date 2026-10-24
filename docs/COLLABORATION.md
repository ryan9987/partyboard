# Collaboration workflow

## Named ownership

### Ryan — host, board, and integration owner

Owns:

- `apps/web/src/host`
- `packages/board`
- `packages/protocol`
- `apps/web/src/app`
- `apps/web/src/networking`
- Root package manifests and dependency lockfile
- Shared TypeScript, lint, test, and CI configuration
- `docs/status/RYAN.md`
- Board traversal tests

Delivers:

- A 20-tile generated 3D board
- Four placeholder pieces
- Dice animation driven by a supplied value
- Piece animation driven by a supplied path
- Lobby and current-turn overlays
- QR code presentation
- Initial work against protocol fixtures before live integration
- Shared schemas and typed browser socket adapter
- Final connection between the host and live server events

Ryan's working branch is `feat/host-board`.

### Jack — server, controller, and motion owner

Owns:

- `apps/server`
- `apps/web/src/controller`
- `packages/motion`
- Room, session, turn, and motion tests
- `docs/status/JACK.md`

Delivers:

- Room creation and joining
- Persistent player sessions
- Turn enforcement
- Server-generated dice rolls
- Phone motion permission and shake recognition
- Touch Roll fallback
- Reconnection
- Snapshots and events matching the frozen protocol

Jack's working branch is `feat/server-controller`.

### Coordinated files

Ryan is the designated editor for:

- `packages/protocol`
- `apps/web/src/networking`
- Root package manifests
- Dependency lockfile
- Shared TypeScript and lint configuration

Jack records requested changes to these files in `docs/INTEGRATION_NOTES.md`. Ryan should either make the change or discuss and temporarily delegate that exact file. This rule exists to prevent two agents from independently changing schemas, dependencies, or the lockfile.

Both humans approve changes to the public protocol before Ryan implements them. Ownership means one editor, not unilateral product decisions.

## Branches and worktrees

Initial branches:

```text
main
feat/host-board
feat/server-controller
```

Each person and coding agent must use a separate worktree. Never point two agents at the same checkout, and never check out the same branch in two worktrees.

If Ryan and Jack work on different computers, their separate clones already isolate the files; they should still use their assigned branches.

## Integration order

1. Jointly approve and merge the protocol and workspace foundation.
2. Host lane renders against a typed fixture.
3. Server/controller lane completes a text or debug-page turn loop.
4. Merge the first working room/join slice.
5. Connect the host to real snapshots.
6. Connect real roll and movement events.
7. Add motion after the Roll button works end to end.
8. Add reconnection after normal turns work.
9. Deploy and test on real devices.

## Pull request expectations

Every change should state:

- What now works
- Which directories changed
- Which protocol fields changed, if any
- Tests run
- Manual checks run
- Known limitations

Avoid long-lived branches. Merge small, coherent slices while `main` remains demonstrable.

## Coding-agent prompt template

```text
Implement <specific outcome> according to the repository documentation.

You own only:
- <directories>

Do not edit:
- <other owner's directories>
- packages/protocol
- root package manifests or the lockfile

If the shared contract is insufficient, record the exact requested change in
docs/INTEGRATION_NOTES.md and continue with work that does not require it.
Run relevant tests and type checking before finishing. Report changed files,
verification performed, and remaining risks.
```

## Agent identity rule

Ryan should begin an agent request with:

```text
You are working as Ryan's agent for this repository. Read AGENTS.md and
docs/roles/RYAN.md completely before editing, then stay within Ryan's ownership.
```

Jack should begin an agent request with:

```text
You are working as Jack's agent for this repository. Read AGENTS.md and
docs/roles/JACK.md completely before editing, then stay within Jack's ownership.
```
