import { expect, it } from "vitest"
import { getWristGesture } from "../apps/web/src/controller/game-motion"

it("distinguishes a deliberate flick, sideways tilt, and ordinary stationary motion", () => {
  const resting = {
    rotationRate: null,
    acceleration: { x: 0, y: 0, z: 0 },
    accelerationIncludingGravity: { x: 0, y: 9.8, z: 0 },
  }
  expect(getWristGesture(resting)).toBeNull()
  expect(getWristGesture({ ...resting, accelerationIncludingGravity: { x: 8, y: 4, z: 0 } })).toBe(
    "tilt",
  )
  expect(getWristGesture({ ...resting, rotationRate: { alpha: 200, beta: 0, gamma: 0 } })).toBe(
    "flick",
  )
  expect(getWristGesture({ ...resting, acceleration: { x: 13, y: 0, z: 0 } })).toBe("flick")
  expect(getWristGesture({ ...resting, acceleration: { x: Infinity, y: NaN, z: 0 } })).toBeNull()
})
