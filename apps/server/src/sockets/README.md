# Socket handlers

This directory will contain thin Socket.IO handlers that:

1. Validate incoming payloads with `packages/protocol`.
2. Authenticate host or player sessions.
3. Invoke room or game-engine methods.
4. Emit typed results and safe errors.

Game rules should remain in `src/game`, not inside event callbacks.
