# Phone controller

Occupied-space duels replace Roll with `DuelControls.tsx`: Swing/Guard buttons, score, recovery,
and a spectator state. `duel-motion.ts` classifies deliberate wrist motion and sideways tilt. The
existing permission flow enables sensors; no inputs are buffered across disconnects. See
`docs/SWORD_DUEL.md` for timings and real-device verification still needed.

`ControllerPage.tsx` renders the join form, lobby/waiting/current-turn status, connection state, explicit motion permission, and the always-visible touch Roll button. `/controller/ABCD` pre-fills the room code; `/controller?room=ABCD` and manually entering a code also work.

Set `VITE_SOCKET_URL` in root `.env` (for example `http://localhost:3001`), or export it before starting Vite. Vite and the server now both read root `.env`. A missing connection URL produces a readable error screen with a disabled Roll button. Deployment requires HTTPS/WSS and a configured public server URL.

`ControllerClient` consumes the shared browser socket factory and validates every consumed game payload against the public protocol. It stores the private per-room session in browser localStorage and restores it on refresh/reconnect. Storage failure does not prevent joining, but the screen explains that the page must stay open. Missing rooms or expired credentials return to the join screen.

Touch and motion share a synchronous request latch. Neither can submit while disconnected, joining, inactive, outside `AWAITING_ROLL`, or pending. A pending request interrupted by transport loss is retried with its original ID only after session reattachment to the same awaiting turn. A new turn unlocks input. Errors do not unlock a submitted turn because the protocol has no retryable-error flag. `crypto.getRandomValues` supplies UUIDs on local HTTP browsers without `randomUUID`; the browser never calculates dice or movement.

Motion permission is requested directly from a button gesture. The detector runs only during the local awaiting turn, stops immediately on submission, and removes its listener on cleanup. Permission denial or missing motion hardware leaves touch play available.

Run `pnpm exec vitest run tests/server/controller-client.test.ts` for session/input tests, and `pnpm typecheck` for component and client types. Browser checks cover join, touch submission, permission denial, synthetic shake recognition, and refresh recovery at a 390 px viewport. Actual iPhone/Android sensor tuning remains pending.

Configure `VITE_SOCKET_URL` and open `/host` to create/start a real room in the 3D host, then join its QR URL here. The server's optional `debug:host` command can also create/start a real room independently of the 3D screen. See `apps/server/README.md`. The host now resumes with the shared `room.host.resume` command; refreshing a controller restores its existing session.

On iPhone, shaking may open the system's Shake to Undo prompt after typing a name. The web controller cannot change this system setting. The motion controls include a disclosure directing players to Settings → Accessibility → Touch → Shake to Undo, with the touch Roll button as the alternative. Apple documents the setting at https://support.apple.com/guide/iphone/adjust-how-iphone-responds-to-your-touch-iph77bcdd132/ios. No `devicemotion.preventDefault()` workaround is used: the system editing gesture is separate from the game's sensor handler. Physical-device confirmation is still required.
