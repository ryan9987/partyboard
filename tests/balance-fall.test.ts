import { expect, it } from "vitest"
import {
  BALANCE_FALL_MS,
  BALANCE_SPLASH_AT_MS,
  createBalanceFallSample,
  sampleBalanceFall,
} from "../apps/web/src/host/balanceFall"

it("starts at the standing pose, tumbles to the lean side, then submerges", () => {
  const sample = createBalanceFallSample()
  expect(sampleBalanceFall(0, 1.15, sample)).toEqual({
    x: 0,
    y: 0,
    z: 0,
    roll: -0,
    splash: 0,
    visible: true,
  })
  sampleBalanceFall(700, 1.15, sample)
  expect(sample.x).toBeGreaterThan(0)
  expect(sample.y).toBeLessThan(0)
  expect(sample.roll).toBeLessThan(-0.5)
  expect(sample.visible).toBe(true)
  sampleBalanceFall(BALANCE_FALL_MS, 1.15, sample)
  expect(sample.visible).toBe(false)
  expect(sample.y).toBeLessThan(-1.5)
  const left = sampleBalanceFall(700, -1.15, createBalanceFallSample())
  const right = sampleBalanceFall(700, 1.15, createBalanceFallSample())
  expect(left.x).toBe(-right.x)
  expect(left.roll).toBe(-right.roll)
})

it("splashes only after water contact, with bounded motion after reconnect or a stalled frame", () => {
  const sample = createBalanceFallSample()
  expect(sampleBalanceFall(BALANCE_SPLASH_AT_MS, 1, sample).splash).toBe(0)
  expect(sampleBalanceFall(BALANCE_SPLASH_AT_MS + 450, 1, sample).splash).toBe(0.5)
  expect(sampleBalanceFall(100_000, 1, sample).splash).toBe(1)
  expect(sampleBalanceFall(-100, 1, sample).x).toBe(0)
})

it("uses the same trajectory at 30, 60 and 120fps without allocating per-frame objects", () => {
  const results = [30, 60, 120].map((fps) => {
    const sample = createBalanceFallSample()
    for (let t = 0; t < 900; t += 1000 / fps)
      expect(sampleBalanceFall(t, -1.15, sample)).toBe(sample)
    return { ...sampleBalanceFall(900, -1.15, sample) }
  })
  expect(results[0]).toEqual(results[1])
  expect(results[1]).toEqual(results[2])
})
