import { expect, it } from "vitest"
import { getMinigameMotionReading } from "../apps/web/src/controller/duel-motion"

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
