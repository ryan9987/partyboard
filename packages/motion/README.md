# Motion package

Browser-side permission and discrete shake recognition, independent of rooms, turns, sockets, and dice. No runtime dependencies.

## Consumer contract

Call `requestMotionPermission()` directly from an Enable motion button handler. It returns `enabled`, `denied`, or `unavailable`; browsers requiring no explicit permission return `enabled` when the API exists in a secure context. This does not guarantee hardware readings arrive. Keep a visible touch Roll button for every status.

Create a detector with `createShakeDetector({ onShake })`. Start it only for the local player's active `AWAITING_ROLL` turn. On either touch or shake, stop the detector immediately, create one request ID, and disable both inputs while submitting. Restart only for a new turn or an explicitly retryable server rejection. Call `stop()` on unmount. This package does not enforce network/turn rules; the controller and authoritative server must do so.

`start()` and `stop()` are idempotent. Stopping removes the listener and resets partial samples. Starting begins a new recognition session. The default detector requires three distinct peaks at acceleration magnitude 14 within 650 ms, then applies a 1500 ms cooldown. A peak must return below threshold before another counts. Gravity-free acceleration is preferred; changes between gravity-including readings are used when unavailable. Thresholds need real-device tuning, especially for rotation and gravity fallback.

`ShakeRecognizer.sample(acceleration, timeMs)` supports deterministic sample replay without browser events. Samples must use a monotonic millisecond clock. `createShakeDetector` also accepts an optional event source and clock for lifecycle tests.

## Verification before workspace scaffolding

With Node.js 22.18+ (native TypeScript stripping):

```sh
node --test packages/motion/test/motion.test.mjs
```

Until Ryan commits the package manifests and toolchain, type-check using a temporary npm-exec TypeScript installation; this does not add a repository dependency or change the lockfile:

```sh
npm exec --yes --package=typescript -- tsc --noEmit --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --isolatedModules --moduleResolution bundler --module esnext --target es2022 --lib es2022,dom packages/motion/src/index.ts
```

Tests cover recognition windows, cooldown, low motion, isolated impacts, sustained readings, malformed samples, listener cleanup, gravity fallback, and permission outcomes. Real iPhone and Android checks remain required. The standalone test runner may warn about the missing ESM package declaration until the shared workspace is scaffolded.
