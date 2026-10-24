import { expect, it } from "vitest"
import { getDuelGesture } from "../apps/web/src/controller/duel-motion"

it("distinguishes a deliberate swing, sideways guard, and ordinary stationary motion", () => {
  const resting = {
    rotationRate: null,
    acceleration: { x: 0, y: 0, z: 0 },
    accelerationIncludingGravity: { x: 0, y: 9.8, z: 0 },
  }
  expect(getDuelGesture(resting)).toBeNull()
  expect(getDuelGesture({ ...resting, accelerationIncludingGravity: { x: 8, y: 4, z: 0 } })).toBe(
    "guard",
  )
  expect(getDuelGesture({ ...resting, rotationRate: { alpha: 200, beta: 0, gamma: 0 } })).toBe(
    "swing",
  )
  expect(getDuelGesture({ ...resting, acceleration: { x: 13, y: 0, z: 0 } })).toBe("swing")
  expect(getDuelGesture({ ...resting, acceleration: { x: Infinity, y: NaN, z: 0 } })).toBeNull()
})
