import type { BoardTile as BoardTileData } from "@party-board/board"

type BoardTileProps = {
  tile: BoardTileData
  active: boolean
  start: boolean
}

export function BoardTile({ tile, active, start }: BoardTileProps) {
  const color = start ? "#f3d56a" : active ? "#6fe8f0" : "#27365b"
  const emissive = active ? "#21aebb" : start ? "#746521" : "#0b1124"

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
        emissiveIntensity={active ? 0.75 : 0.25}
        metalness={0.35}
        roughness={0.35}
      />
    </mesh>
  )
}
