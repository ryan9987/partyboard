import { test } from "node:test"
import assert from "node:assert/strict"
import { ShakeRecognizer, createShakeDetector } from "../src/shake-detector.ts"
import { requestMotionPermission } from "../src/permission.ts"

const sample = (x) => ({ x, y: 0, z: 0 })
function fixture(options = {}) {
  let count = 0
  const recognizer = new ShakeRecognizer({ onShake: () => count++, ...options })
  const peak = (time) => {
    recognizer.sample(sample(0), time)
    recognizer.sample(sample(16), time + 1)
  }
  return { recognizer, peak, count: () => count }
}

test("three deliberate peaks produce one shake; cooldown rejects repeats", () => {
  const f = fixture()
  ;[0, 100, 200, 300, 400, 500].forEach(f.peak)
  assert.equal(f.count(), 1)
  ;[1800, 1900, 2000].forEach(f.peak)
  assert.equal(f.count(), 2)
})

test("sustained acceleration is only one peak", () => {
  const f = fixture()
  for (let t = 0; t < 600; t += 10) f.recognizer.sample(sample(20), t)
  assert.equal(f.count(), 0)
})

test("walking-sized motion and isolated table bumps do not trigger", () => {
  const f = fixture()
  for (let t = 0; t < 1000; t += 50) f.recognizer.sample(sample(t % 100 ? 5 : 0), t)
  ;[1100, 2000, 2900].forEach(f.peak)
  assert.equal(f.count(), 0)
})

test("invalid readings and backwards timestamps cannot create peaks", () => {
  const f = fixture()
  f.peak(100)
  f.peak(0)
  f.recognizer.sample(null, 110)
  f.recognizer.sample({ x: null, y: 0, z: 0 }, 120)
  f.recognizer.sample(sample(NaN), 130)
  f.recognizer.sample(sample(Infinity), 140)
  f.recognizer.sample(sample(0), NaN)
  f.peak(200)
  assert.equal(f.count(), 0)
  f.peak(300)
  assert.equal(f.count(), 1)
})

test("reset clears partial peaks", () => {
  const f = fixture()
  ;[0, 100].forEach(f.peak)
  f.recognizer.reset()
  f.peak(200)
  assert.equal(f.count(), 0)
})

test("invalid settings fail immediately", () => {
  for (const options of [
    { threshold: 0 },
    { requiredPeaks: 1.5 },
    { windowMs: -1 },
    { cooldownMs: NaN },
  ]) {
    assert.throws(() => fixture(options), RangeError)
  }
})

function motionSource() {
  const listeners = new Set()
  return {
    addEventListener: (_, listener) => listeners.add(listener),
    removeEventListener: (_, listener) => listeners.delete(listener),
    emit: (event) => [...listeners].forEach((listener) => listener(event)),
    size: () => listeners.size,
  }
}

test("listener lifecycle is idempotent and onShake can stop immediately", () => {
  const source = motionSource()
  let count = 0
  let time = 0
  const detector = createShakeDetector(
    {
      onShake: () => {
        count++
        detector.stop()
      },
    },
    source,
    () => time++ * 50,
  )
  detector.start()
  detector.start()
  assert.equal(source.size(), 1)
  for (let i = 0; i < 10; i++) source.emit({ acceleration: sample(i % 2 ? 20 : 0) })
  assert.equal(count, 1)
  assert.equal(source.size(), 0)
  detector.stop()
  detector.start()
  assert.equal(source.size(), 1)
  detector.stop()
})

test("stationary gravity is ignored; changing gravity readings can detect a shake", () => {
  const source = motionSource()
  let count = 0
  let time = 0
  const detector = createShakeDetector({ onShake: () => count++ }, source, () => time++ * 25)
  detector.start()
  const emit = (x) =>
    source.emit({ acceleration: null, accelerationIncludingGravity: { x, y: 0, z: 9.8 } })
  for (let i = 0; i < 10; i++) emit(0)
  assert.equal(count, 0)
  ;[20, 20, 0, 0, 20].forEach(emit)
  assert.equal(count, 1)
  detector.stop()
})

test("permission supports grant, denial, rejection, and browsers with no prompt", async () => {
  assert.equal(
    await requestMotionPermission({ isSecureContext: true, DeviceMotionEvent: {} }),
    "enabled",
  )
  for (const [result, expected] of [
    ["granted", "enabled"],
    ["denied", "denied"],
  ]) {
    let invoked = false
    const motion = {
      requestPermission() {
        assert.equal(this, motion)
        invoked = true
        return Promise.resolve(result)
      },
    }
    const pending = requestMotionPermission({ isSecureContext: true, DeviceMotionEvent: motion })
    assert.equal(invoked, true, "permission is requested synchronously within the user gesture")
    assert.equal(await pending, expected)
  }
  assert.equal(
    await requestMotionPermission({
      isSecureContext: true,
      DeviceMotionEvent: {
        requestPermission: async () => {
          throw Error("denied")
        },
      },
    }),
    "denied",
  )
})

test("permission is unavailable outside supported secure browser contexts", async () => {
  assert.equal(await requestMotionPermission(), "unavailable")
  assert.equal(await requestMotionPermission({ isSecureContext: true }), "unavailable")
  assert.equal(
    await requestMotionPermission({ isSecureContext: false, DeviceMotionEvent: {} }),
    "unavailable",
  )
})
