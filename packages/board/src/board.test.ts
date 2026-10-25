import { describe, expect, it } from "vitest"

import {
  defaultBoard,
  getMovementPath,
  InvalidBoardError,
  validateBoard,
  type BoardDefinition,
} from "./index"

describe("default board", () => {
  it("contains one valid 48-tile winding route", () => {
    expect(() => validateBoard(defaultBoard)).not.toThrow()
    expect(defaultBoard.tiles).toHaveLength(48)
    expect(defaultBoard.tiles.at(-1)?.position[2]).toBeLessThan(-40)
  })

  it("clamps overshoots at the finish instead of wrapping", () => {
    expect(getMovementPath(defaultBoard, "tile-46", 4)).toEqual(["tile-47"])
  })
  it("has a terminal finish and cannot move past it", () => {
    expect(defaultBoard.finishTileId).toBe("tile-47")
    expect(getMovementPath(defaultBoard, "tile-47", 6)).toEqual([])
    expect(getMovementPath(defaultBoard, "tile-44", 8)).toEqual(["tile-45", "tile-46", "tile-47"])
    const broken = { ...defaultBoard, tiles: defaultBoard.tiles.map((tile) => ({ ...tile })) }
    broken.tiles.at(-1)!.nextTileId = "tile-0"
    expect(() => validateBoard(broken)).toThrow("stop at the finish")
  })

  it("rejects movement outside a dice range", () => {
    expect(() => getMovementPath(defaultBoard, "tile-0", 0)).toThrow(RangeError)
    expect(() => getMovementPath(defaultBoard, "tile-0", 9)).toThrow(RangeError)
    expect(getMovementPath(defaultBoard, "tile-0", 8)).toHaveLength(8)
  })

  it("rejects a missing edge target", () => {
    const invalidBoard: BoardDefinition = {
      id: "invalid",
      startingTileId: "tile-0",
      tiles: [{ id: "tile-0", position: [0, 0, 0], nextTileId: "missing" }],
    }

    expect(() => validateBoard(invalidBoard)).toThrow(InvalidBoardError)
  })

  it("rejects duplicate tile IDs", () => {
    const invalidBoard: BoardDefinition = {
      id: "invalid",
      startingTileId: "tile-0",
      tiles: [
        { id: "tile-0", position: [0, 0, 0], nextTileId: "tile-0" },
        { id: "tile-0", position: [1, 0, 0], nextTileId: "tile-0" },
      ],
    }

    expect(() => validateBoard(invalidBoard)).toThrow("Duplicate tile id")
  })
})
