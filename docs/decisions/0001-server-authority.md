# Decision 0001: server-authoritative turns and dice

## Status

Accepted for the core milestone.

## Decision

The server owns the current phase, current player, dice value, tile positions, and turn advancement. Phones send roll requests, and the host renders server events.

## Why

This prevents duplicate or conflicting rolls, keeps reconnecting clients consistent, and avoids making gameplay correctness depend on a particular host browser remaining connected.

## Consequences

- Server tests cover turn correctness.
- Clients may optimistically animate presentation but cannot authoritatively change state.
- Animation durations must be known to the server.
- Reconnecting clients receive a complete snapshot.
