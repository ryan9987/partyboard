import { expect, it } from "vitest"
import { defaultBoard, type BoardTile } from "../packages/board/src"
import {
  createBoardPath,
  getStartGatePlacement,
  liftStartGateVertex,
} from "../apps/web/src/host/boardPath"

it("centers the start gate on the exact rendered curve and squares its posts to the trail", () => {
  const curve = createBoardPath(defaultBoard.tiles)
  const placement = getStartGatePlacement(defaultBoard.tiles)
  const t = 0.5 / (defaultBoard.tiles.length - 1)
  const center = curve.getPoint(t)
  const tangent = curve.getTangent(t)
  const across = [Math.cos(placement.rotation), -Math.sin(placement.rotation)]
  expect(placement.position).toEqual([center.x, 0, center.z])
  expect(across[0]! * tangent.x + across[1]! * tangent.z).toBeCloseTo(0, 10)
  expect(
    Math.sin(placement.rotation) * tangent.x + Math.cos(placement.rotation) * tangent.z,
  ).toBeCloseTo(-1, 8)

  // The actual Blender gate has posts at ±1.2 and footings of radius0.24.
  // The rendered trail radius is0.62: neither footing may enter that corridor.
  for (const side of [-1, 1]) {
    const postX = center.x + side * 1.2 * across[0]!
    const postZ = center.z + side * 1.2 * across[1]!
    let clearance = Infinity
    for (let i = 0; i <= 4000; i++) {
      const point = curve.getPoint(i / 4000)
      clearance = Math.min(clearance, Math.hypot(postX - point.x, postZ - point.z))
    }
    expect(clearance).toBeGreaterThan(0.62 + 0.24 + 0.15)
  }
})

it("keeps the feet grounded and raises the header without stretching its lettering", () => {
  expect(liftStartGateVertex(0)).toBe(0)
  // The sign starts at1.71; characters including their hair are about2.15 tall.
  expect(liftStartGateVertex(1.71)).toBeGreaterThan(2.15 + 0.15)
  expect(liftStartGateVertex(2.3) - liftStartGateVertex(1.8)).toBeCloseTo(0.5)
  expect(liftStartGateVertex(2.7)).toBeCloseTo(3.35)
})

it.each([
  [3, 0],
  [0, -3],
  [-3, -3],
])("adapts to another initial direction (%i,%i)", (x, z) => {
  const tiles: BoardTile[] = [
    { id: "start", position: [4, 0, 8], nextTileId: "next" },
    { id: "next", position: [4 + x, 0, 8 + z], nextTileId: "next" },
  ]
  const placement = getStartGatePlacement(tiles)
  expect(placement.position[0]).toBeCloseTo(4 + x / 2)
  expect(placement.position[2]).toBeCloseTo(8 + z / 2)
})
