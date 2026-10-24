import type { BoardTile as BoardTileData } from "@party-board/board"
import { useMemo } from "react"

import { PropInstances } from "./worldAssets"
import type { Placement } from "./worldProps"

type BoardTilesProps = {
  tiles: readonly BoardTileData[]
  activeTileId: string | undefined
  startTileId: string
}

/** Every trail space in one instanced draw call; the active space is lifted and tinted. */
export function BoardTiles({ tiles, activeTileId, startTileId }: BoardTilesProps) {
  const placements = useMemo<Placement[]>(
    () =>
      tiles.map((tile, index) => {
        const active = tile.id === activeTileId
        const start = tile.id === startTileId
        return {
          position: [tile.position[0], active ? 0.1 : 0, tile.position[2]],
          rotation: index * 0.37,
          color: active ? "#a9e6e2" : start ? "#f2c654" : index % 2 ? "#efe7d6" : "#ffffff",
        }
      }),
    [activeTileId, startTileId, tiles],
  )

  return <PropInstances name="Tile" placements={placements} receiveShadow />
}
