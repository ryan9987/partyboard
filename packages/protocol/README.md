# Protocol package

Shared data-only package for:

- Event-name constants
- Zod request and response schemas
- Types inferred from those schemas
- Public room snapshots
- Private join/create responses

This package cannot depend on React, Three.js, browser motion APIs, Socket.IO server implementations, or application state stores.

Only one designated person edits this package at a time.
