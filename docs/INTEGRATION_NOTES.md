# Integration notes

Use this file for changes one lane needs from another lane or from a shared contract. Resolve entries during an integration checkpoint instead of making surprise cross-ownership edits.

## Open requests

### 2026-10-24 — Shared foundation needed for Jack's server/controller slice

- Requested by: Jack's agent.
- Owning area: Ryan — workspace, protocol, board, browser networking.
- Blocking or non-blocking: Blocks connected server/controller work; standalone motion work is unblocked.
- Requested contract or behavior change: Scaffold package manifests and exact dependency versions for the documented stack, including test/typecheck scripts. Commit shared event schemas and inferred types, a public snapshot type excluding session/host tokens, private create/join response schemas, allowed colors, host authentication payloads, and reconnect/error semantics. Supply the board start tile and movement traversal API and typed browser adapter. Jointly approve final protocol details before implementation.
- Reason: Only documentation exists today. Jack must validate network messages against shared schemas and consume the public board API rather than invent competing contracts or edit Ryan-owned files.
- Proposed acceptance check: A consumer can import shared schemas/types and board traversal, validate all documented events, create/join/rejoin rooms privately, and run package tests/type checking. Wire the dependency-free motion source and tests into the shared toolchain; preserve the visible touch Roll fallback in the controller.
- Resolution: Open; recorded for Ryan. No external message sent.

## Template

```md
### YYYY-MM-DD — Short request title

- Requested by:
- Owning area:
- Blocking or non-blocking:
- Requested contract or behavior change:
- Reason:
- Proposed acceptance check:
- Resolution:
```
