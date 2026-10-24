# Agent and contributor rules

These instructions apply to every contributor and coding agent working in this repository.

## Current objective

Build only the core board loop: room creation, four phone controllers, server-authoritative dice rolls, 3D piece movement, turn rotation, and reconnection.

## Scope guardrails

- Do not implement mini-games yet.
- Do not implement power-ups, shops, currency, combat, accounts, matchmaking, databases, multiple boards, or detailed character assets.
- Use generated placeholder geometry until the core loop is reliable.
- The server is authoritative for game phase, turn order, dice values, and player positions.
- A phone shake requests a roll; it never calculates the dice value.
- Every motion action must retain a visible touch fallback.
- Every network payload must be validated against a shared schema.
- Use a persistent player session ID; never use a Socket.IO socket ID as player identity.

## Ownership

The named ownership split is documented in `docs/COLLABORATION.md`.

- Ryan owns the host, board, shared protocol, browser networking, workspace configuration, and integration.
- Jack owns the server, phone controller, motion package, and their tests.
- An agent told it is working for Ryan must read `docs/roles/RYAN.md` before editing.
- An agent told it is working for Jack must read `docs/roles/JACK.md` before editing.
- If an agent has not been told which person it represents, it must stop before editing and ask whether it is Ryan's or Jack's agent.
- If a change is needed outside assigned ownership, record it in `docs/INTEGRATION_NOTES.md` rather than editing the other person's area without coordination.
- Each owner maintains only their own file in `docs/status`.

## Engineering rules

- Make small, reviewable commits.
- Do not silently rename protocol events or shared fields.
- Do not add dependencies without documenting why.
- Do not overwrite another contributor's unrelated edits.
- Run relevant tests and type checking before declaring a task complete.
- Update the corresponding documentation when a contract changes.
- Keep `main` in a demonstrable state.

## Completion standard

The core milestone is done only after four controllers can complete five consecutive turn rotations on the intended demo network without a duplicate roll, stuck turn, incorrect piece movement, or unrecoverable disconnect.
