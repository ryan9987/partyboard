import { expect, it } from "vitest"
import { getMinigameMotionReading } from "../apps/web/src/controller/game-motion"
import { canFlickAct } from "../apps/web/src/controller/minigame-gestures"
import type { MinigamePlayer } from "../packages/protocol/src"
import {
  canFishingAct,
  createFishingFlickDetector,
} from "../apps/web/src/controller/fishing-motion"

it("calibrates neutral, clamps tilt and does not mistake a flick for line tension", () => {
  const event = {
    rotationRate: null,
    acceleration: null,
    accelerationIncludingGravity: { x: 2, y: 9, z: 0 },
  }
  expect(getMinigameMotionReading(event, 0, null)).toEqual({ axis: 0, neutral: 2, flick: false })
  expect(
    getMinigameMotionReading({ ...event, accelerationIncludingGravity: { x: 9, y: 0, z: 0 } }, 0, 2)
      .axis,
  ).toBe(1)
  expect(
    getMinigameMotionReading({ ...event, acceleration: { x: 15, y: 0, z: 0 } }, 0.1, 2),
  ).toEqual({ axis: 0.1, neutral: 2, flick: true })
  expect(
    getMinigameMotionReading(
      { ...event, accelerationIncludingGravity: { x: NaN, y: 0, z: 0 } },
      0.1,
      2,
    ).axis,
  ).toBe(0.1)
})

const still = {
  rotationRate: null,
  acceleration: null,
  accelerationIncludingGravity: { x: 1, y: 9.7, z: 0 },
}
const flick = { ...still, rotationRate: { alpha: 0, beta: 125, gamma: 0 } }

it("releases arrows by a gentle, settled wrist flick without changing aim or firing a fourth shot", () => {
  const player: MinigamePlayer = {
    playerId: "p",
    score: 0,
    alive: true,
    axis: 0.2,
    position: 0,
    actionAt: 1000,
    attempts: 1,
    status: "hit",
  }
  const detect = createFishingFlickDetector()
  expect(getMinigameMotionReading(flick, 0.2, 1, true).axis).toBe(0.2)
  expect(detect(flick, 0)).toBe(true)
  expect(canFlickAct("archery", player, 1899)).toBe(false)
  expect(canFlickAct("archery", player, 1900)).toBe(true)
  expect(detect(flick, 900)).toBe(false)
  detect(still, 1000)
  detect(still, 1200)
  expect(detect(flick, 1300)).toBe(true)
  expect(canFlickAct("archery", { ...player, attempts: 3 }, 5000)).toBe(false)
  expect(canFlickAct("archery", { ...player, alive: false }, 5000)).toBe(false)
})

it("accepts a gentle Fishing wrist flick without changing the general action/rhythm threshold or tilt", () => {
  expect(getMinigameMotionReading(flick, 0.1, 1, true)).toEqual({
    axis: 0.1,
    neutral: 1,
    flick: true,
  })
  expect(getMinigameMotionReading(flick, 0.1, 1).flick).toBe(false)
  expect(getMinigameMotionReading(still, 0.1, 1, true).flick).toBe(false)
})

it("requires a settled wrist between a cast and a reel instead of firing on every motion frame", () => {
  const detect = createFishingFlickDetector()
  expect(detect(flick, 0)).toBe(true)
  for (const time of [50, 100, 300, 700, 1800]) expect(detect(flick, time)).toBe(false)
  expect(detect(still, 1900)).toBe(false)
  expect(detect(still, 2100)).toBe(false)
  expect(detect(flick, 2200)).toBe(true)
  expect(detect(flick, 2250)).toBe(false)
})

it("never treats gravity, invalid sensor values, or tiny movement as a Fishing action", () => {
  const detect = createFishingFlickDetector()
  expect(detect({ ...still, accelerationIncludingGravity: { x: 9.8, y: 0, z: 0 } }, 0)).toBe(false)
  expect(detect({ ...still, rotationRate: { alpha: NaN, beta: Infinity, gamma: null } }, 100)).toBe(
    false,
  )
  expect(detect({ ...still, acceleration: { x: 1, y: 1, z: 1 } }, 200)).toBe(false)
})

it("allows Fishing actions only when ready or biting, not during flight, waiting or catch animation", () => {
  expect(canFishingAct("ready", 1000, 1000)).toBe(true)
  expect(canFishingAct("bite", 1000, 2800)).toBe(true)
  for (const status of ["casting", "waiting", "out"] as const)
    expect(canFishingAct(status, 1000, 4000)).toBe(false)
  for (const status of ["caught", "miss"] as const) {
    expect(canFishingAct(status, 1000, 2199)).toBe(false)
    expect(canFishingAct(status, 1000, 2200)).toBe(true)
  }
})
