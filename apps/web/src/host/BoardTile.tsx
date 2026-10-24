import type { BoardTile as BoardTileData } from "@party-board/board"

type BoardTileProps = {
  tile: BoardTileData
  active: boolean
  start: boolean
}

export function BoardTile({ tile, active, start }: BoardTileProps) {
  const color = start ? "#f5c952" : active ? "#6be4e8" : "#e8dfc8"
  const emissive = active ? "#27aeb9" : start ? "#8d6f16" : "#000000"

  return (
    <mesh
      castShadow
      receiveShadow
      position={[tile.position[0], active ? 0.12 : 0, tile.position[2]]}
    >
      <cylinderGeometry args={[0.72, 0.82, active ? 0.38 : 0.3, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={active ? 0.42 : start ? 0.12 : 0}
        metalness={0.05}
        roughness={0.76}
      />
    </mesh>
  )
}
