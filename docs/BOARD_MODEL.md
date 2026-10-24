# Board model

## First board

The first board is a deterministic 32-tile winding expedition. Every tile has exactly one next tile. There are no branches or tile effects. The data graph wraps from the last tile to the start so the core turn loop can run indefinitely, but the host deliberately renders an open physical trail and hides distant spaces with fog.

```ts
type Vec3 = readonly [number, number, number]

type BoardTile = {
  id: string
  position: Vec3
  nextTileId: string
}

type BoardDefinition = {
  id: string
  startingTileId: string
  tiles: BoardTile[]
}
```

The board package contains pure data and traversal logic. It must not contain React or Three.js objects.

## Traversal

The core function returns every tile visited, excluding the starting tile:

```ts
getMovementPath(board, "tile-30", 4)
// ["tile-31", "tile-0", "tile-1", "tile-2"]
```

Required validation:

- Board IDs and tile IDs are unique.
- The starting tile exists.
- Every `nextTileId` exists.
- Traversal cannot enter an unexpected infinite loop.
- A roll from 1 through 6 returns exactly that many tile IDs.

## Rendering

The host converts tile positions into rendered meshes. Board data should not prescribe materials, geometry, or animation. The host renders the route as an open curve, follows the active piece with the camera, and may interpolate between the positions returned by the movement path.

## Future compatibility

Branching paths may later replace `nextTileId` with multiple connections. Do not implement that abstraction now. A focused migration later will be cheaper than supporting unneeded route-selection states during the core milestone.
