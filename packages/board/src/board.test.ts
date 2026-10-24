import { describe, expect, it } from "vitest"

import {
  defaultBoard,
  getMovementPath,
  InvalidBoardError,
  validateBoard,
  type BoardDefinition,
} from "./index"

describe("default board", () => {
  it("contains one valid 20-tile loop", () => {
    expect(() => validateBoard(defaultBoard)).not.toThrow()
    expect(defaultBoard.tiles).toHaveLength(20)
  })

  it("returns each visited tile and wraps around", () => {
    expect(getMovementPath(defaultBoard, "tile-18", 4)).toEqual([
      "tile-19",
      "tile-0",
      "tile-1",
      "tile-2",
    ])
  })

  it("rejects movement outside a dice range", () => {
    expect(() => getMovementPath(defaultBoard, "tile-0", 0)).toThrow(RangeError)
    expect(() => getMovementPath(defaultBoard, "tile-0", 7)).toThrow(RangeError)
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
