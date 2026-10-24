# Game engine

This directory will contain:

- Authoritative turn state machine
- Secure dice generation
- Roll-request validation and deduplication
- Movement path calculation using `packages/board`
- Phase and disconnect timers

The engine should expose state transitions independently of Socket.IO so they can be unit tested.
