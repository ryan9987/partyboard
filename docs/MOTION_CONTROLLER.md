# Motion controller

## Responsibility

The motion package turns noisy browser sensor readings into a single discrete `onShake` callback. It does not know about rooms, players, dice, sockets, or turns.

## Permission flow

1. The controller displays an `Enable motion` button.
2. The user taps it.
3. The button handler feature-detects and requests motion permission where required.
4. The controller shows `enabled`, `denied`, or `unavailable` status.
5. The Roll button stays visible in every status.

Permission must be requested from a user gesture. The production controller must be served over HTTPS.

## Detector interface

```ts
type ShakeDetector = {
  start(): void
  stop(): void
}

type ShakeDetectorOptions = {
  onShake(): void
  threshold?: number
  requiredPeaks?: number
  windowMs?: number
  cooldownMs?: number
}
```

Suggested starting values, subject to real-device tuning:

```text
threshold:      14
required peaks: 3
window:         650 ms
cooldown:       1500 ms
```

## Turn behavior

- Start the detector only while this controller is the active player and the server phase is `AWAITING_ROLL`.
- On the first recognized shake, stop the detector immediately.
- Generate one unique request ID.
- Disable both motion and the Roll button while the request is pending.
- Do not restart the detector unless a new turn begins or the server explicitly rejects the request as retryable.
- Remove event listeners when the component unmounts.

## Testing

Unit tests should feed recorded or constructed acceleration samples into the recognition logic. Manual testing must include at least one iPhone and one Android phone if available. Tune the detector for deliberate short shakes while rejecting walking, rotating the phone, and setting it on a table.
