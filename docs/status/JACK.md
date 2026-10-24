# Jack status

Jack or Jack's agent owns this file.

## Current

- Working on `feat/server-controller` in the separate `../partyboard-jack` worktree.
- Motion foundation implemented independently while shared server/controller dependencies remain pending.

## Completed

- Motion permission helper: secure-context/API detection, explicit permission requests, denial handling.
- Pure shake recognizer: distinct peaks, time window, cooldown, configurable thresholds, invalid sample rejection.
- Browser listener lifecycle with gravity fallback and idempotent start/stop.
- Ten automated motion and permission tests plus consumer integration documentation.

## Blockers and handoffs

- Ryan must commit the shared workspace manifests, dependencies, protocol schemas, board traversal API, and browser adapter before connected server/controller implementation.
- Public snapshots must exclude private session credentials; protocol approval remains a joint decision.
- Exact requests recorded in `docs/INTEGRATION_NOTES.md`.
- No controller UI or server implemented yet. No real-device motion verification yet.

## Verification

- Node.js v26.5.0: `node --test packages/motion/test/motion.test.mjs` — 10 passing.
- Strict standalone TypeScript check of the motion entry point — passed (temporary npm-exec compiler; no repository dependency changes).
- Full workspace build/test scripts are pending the shared foundation.
