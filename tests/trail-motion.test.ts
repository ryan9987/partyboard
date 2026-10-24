import { describe, expect, it } from "vitest"
import { defaultBoard, getMovementPath } from "../packages/board/src"
import {
  createMotionSample,
  createTrailMotion,
  dampAngle,
  sampleTrailMotion,
  smoothStep,
} from "../apps/web/src/host/trailMotion"

const base = {
  playerId: "ryan",
  turnNumber: 4,
  fromTileId: "tile-0",
  path: ["tile-1", "tile-2", "tile-3"],
  millisecondsPerTile: 420,
}

describe("continuous trail travel", () => {
  it("starts moving immediately, reaches every server tile exactly, and stops at the destination", () => {
    const motion = createTrailMotion(base, 1000)!
    const sample = createMotionSample()
    sampleTrailMotion(motion, 1040, sample)
    expect(sample.position).not.toEqual(motion.points[0])
    for (let step = 0; step <= base.path.length; step++) {
      sampleTrailMotion(motion, 1000 + step * 420, sample)
      expect(sample.position).toEqual(motion.points[step])
    }
    expect(sample.done).toBe(true)
    expect(sample.velocity).toEqual([0, 0, 0])
    sampleTrailMotion(motion, 100_000, sample)
    expect(sample.position).toEqual(motion.points.at(-1))
  })

  it("has continuous position and velocity through the middle spaces, not stop-start easing", () => {
    const motion = createTrailMotion(base, 0)!
    const before = createMotionSample()
    const after = createMotionSample()
    for (const time of [420, 840]) {
      sampleTrailMotion(motion, time - 0.001, before)
      sampleTrailMotion(motion, time + 0.001, after)
      for (let axis = 0; axis < 3; axis++) {
        expect(before.position[axis]).toBeCloseTo(after.position[axis]!, 4)
        expect(before.velocity[axis]).toBeCloseTo(after.velocity[axis]!, 3)
      }
      expect(Math.hypot(...before.velocity)).toBeGreaterThan(1)
    }
    sampleTrailMotion(motion, 0, before)
    expect(before.velocity).toEqual([0, 0, 0])
  })

  it("is frame-rate independent and reuses its output storage", () => {
    const motion = createTrailMotion(base, 0)!
    const results: number[][] = []
    for (const fps of [30, 60, 120]) {
      const out = createMotionSample()
      const position = out.position
      const velocity = out.velocity
      for (let frame = 0; frame < fps; frame++) sampleTrailMotion(motion, (frame * 1000) / fps, out)
      sampleTrailMotion(motion, 1000, out)
      expect(out.position).toBe(position)
      expect(out.velocity).toBe(velocity)
      results.push([...out.position])
    }
    expect(results[0]).toEqual(results[1])
    expect(results[1]).toEqual(results[2])
  })

  it("handles the maximum Boots route and clamps negative elapsed time", () => {
    const motion = createTrailMotion(
      { ...base, path: getMovementPath(defaultBoard, "tile-0", 8) },
      500,
    )!
    const sample = createMotionSample()
    sampleTrailMotion(motion, -1000, sample)
    expect(sample.position).toEqual(motion.points[0])
    expect(sample.velocity).toEqual([0, 0, 0])
    sampleTrailMotion(motion, 500 + 8 * 420, sample)
    expect(sample.done).toBe(true)
    expect(sample.position).toEqual(motion.points[8])
  })

  it("wraps to Start with a brief avatar fade, never a flight through the entire map", () => {
    const motion = createTrailMotion(
      { ...base, fromTileId: "tile-47", path: ["tile-0", "tile-1"] },
      0,
    )!
    const sample = createMotionSample()
    expect(motion.warps).toEqual([true, false])
    sampleTrailMotion(motion, 209, sample)
    expect(sample.position).toEqual(motion.points[0])
    sampleTrailMotion(motion, 210, sample)
    expect(sample.position).toEqual(motion.points[1])
    expect(sample.opacity).toBe(0)
    sampleTrailMotion(motion, 420, sample)
    expect(sample.opacity).toBe(1)
    expect(sample.position).toEqual(motion.points[1])
  })

  it("does not flag any normal board edge as a world wrap", () => {
    for (let index = 0; index < defaultBoard.tiles.length - 1; index++) {
      const motion = createTrailMotion(
        { ...base, fromTileId: `tile-${index}`, path: [`tile-${index + 1}`] },
        0,
      )!
      expect(motion.warps).toEqual([false])
    }
  })

  it("rejects empty or unknown routes rather than producing NaN transforms", () => {
    expect(createTrailMotion({ ...base, path: [] }, 0)).toBeNull()
    expect(createTrailMotion({ ...base, path: ["missing-tile"] }, 0)).toBeNull()
    expect(createTrailMotion({ ...base, millisecondsPerTile: 0 }, 0)).toBeNull()
  })
})

describe("pose easing", () => {
  it("takes the short turn across the ±pi boundary", () => {
    const angle = dampAngle(Math.PI - 0.05, -Math.PI + 0.05, 12, 1 / 60)
    expect(angle).toBeGreaterThan(Math.PI - 0.05)
    expect(angle).toBeLessThan(Math.PI + 0.05)
  })
  it("turns the same amount after a second at different frame rates", () => {
    const turns = [30, 60, 120].map((fps) => {
      let angle = 0
      for (let frame = 0; frame < fps; frame++) angle = dampAngle(angle, 2, 6, 1 / fps)
      return angle
    })
    expect(turns[0]).toBeCloseTo(turns[1]!, 10)
    expect(turns[1]).toBeCloseTo(turns[2]!, 10)
  })
  it("eases prop passes/casts without overshoot", () => {
    expect(smoothStep(-1)).toBe(0)
    expect(smoothStep(0.5)).toBe(0.5)
    expect(smoothStep(2)).toBe(1)
    expect(smoothStep(0.01)).toBeLessThan(0.01)
    expect(smoothStep(0.99)).toBeGreaterThan(0.99)
  })
})
