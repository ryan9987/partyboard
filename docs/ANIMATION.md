# Continuous travel and animation

Ryan requested this pass together with per-space travel coins. It keeps Jack's instanced Blender
scenery, camera-facing authoritative die, and untimed shops/connected board turns. The subsequent
seamless-round pass replaces manual mini-game starts/results with automatic countdowns/results.

## Travel

- `player.moving` still supplies the exact path and milliseconds per tile; no wire fields changed.
- The default is 420 ms per tile. `trailMotion.ts` builds the curve once, then samples position
  and velocity without allocating vectors/arrays or updating React state every frame.
- Hermite tangents are shared between segments, keeping velocity continuous through intermediate
  spaces. Only the beginning and end of the full movement segment ease to rest (including shops).
- Every tile is reached at its specified deadline. UI tile callbacks use absolute monotonic
  deadlines, so delayed callbacks do not accumulate a separate animation backlog.
- Stable initial transform props prevent React snapshots from snapping a rendered character onto
  the next tile. Walking stride follows traveled distance, turns use the shortest angle, and idle,
  carry, cast, strike, guard, balance and hit poses blend using frame-rate-independent damping.
- Camera, die and sunlight share the sampled active-player focus. Scratch vectors and projectile
  targets are reused; fishing line updates reuse their existing buffer.
- The last tile wraps logically to Start. The character/world briefly fade while the camera
  reframes, rather than generating a long flight/line across the entire map.
- Scene switches have a short flat-color reveal under the HUD. Reduced-motion CSS applies to UI
  animations. No physics engine, additional model copies, extra shadow passes or dependencies.

## Authority and recovery

The server retains the existing authoritative destination snapshots for reconnect recovery. A
fresh/reconnected host snaps to that state rather than replaying an unknown old path. Live movement
snapshots update balances but cannot replace the currently animated tile. Restart or a new phase
cancels the pending path; an older animation cannot clear a replacement run.

Each server crossing timer awards one coin, capped at 999, then publishes the existing snapshot.
Markets split movement and preserve the remaining path. They cannot replay paid spaces. Coins
are never computed from frame count, animation completion, a client's position, or a supplied die.
Backwards duel displacement and frozen/skipped turns are not rewarding movement.

## Verification

Automated checks cover exact tile arrivals, continuous middle-tile velocities, endpoints,
30/60/120 Hz sampling and rotation equivalence, caller-owned output storage, eight-step Boots,
every normal board edge, bounded wrap behavior, reward ticks before/after shops, duplicates,
restart cancellation, coin caps, duel penalties and real Socket.IO reward snapshots.

Manual: join a host/controller, roll into the first market, check one coin per space and 9 coins
after a three-space arrival from a fresh purse. Buy Boots for 4, finish the original roll, and
activate them next turn. Watch continuous bends, walking starts/stops, overhead die/camera, and
coin increments; inspect the held acorn, casts, strikes and guards in the rehearsal gallery.

Preserve instanced draw calls and the existing DPR/shadow budgets. Hardware frame rate, thermal
behavior and phone sensor accuracy still need testing on the presentation laptop and real phones;
unit tests are not an FPS benchmark.
