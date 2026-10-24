import type { BoardTile as BoardTileData } from "@party-board/board"
import type { Texture } from "three"

type BoardTileProps = {
  tile: BoardTileData
  active: boolean
  start: boolean
  texture: Texture
}

export function BoardTile({ tile, active, start, texture }: BoardTileProps) {
  const tileIndex = Number(tile.id.replace("tile-", ""))
  const color = start ? "#f5c952" : active ? "#6be4e8" : tileIndex % 2 === 0 ? "#eee5d0" : "#dcd1b9"
  const emissive = active ? "#27aeb9" : start ? "#8d6f16" : "#000000"
  const lift = active ? 0.12 : 0

  return (
    <group position={[tile.position[0], lift, tile.position[2]]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.72, 0.82, active ? 0.38 : 0.3, 10]} />
        <meshStandardMaterial
          color={color}
          map={texture}
          emissive={emissive}
          emissiveIntensity={active ? 0.42 : start ? 0.12 : 0}
          metalness={0.05}
          roughness={0.76}
        />
      </mesh>
      <mesh position={[0, active ? 0.205 : 0.165, 0]}>
        <cylinderGeometry args={[0.59, 0.62, 0.035, 10]} />
        <meshStandardMaterial
          color={start ? "#fff0a1" : active ? "#c7fbff" : "#fffaf0"}
          emissive={emissive}
          emissiveIntensity={active ? 0.3 : 0}
          roughness={0.52}
        />
      </mesh>
      <mesh position={[0, active ? 0.23 : 0.19, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.54, 0.026, 7, 30]} />
        <meshStandardMaterial color={start ? "#d39c22" : "#b6a88e"} metalness={0.12} />
      </mesh>
      {[0, 1, 2, 3].map((index) => (
        <group key={index} rotation={[0, (index * Math.PI) / 2 + tileIndex * 0.17, 0]}>
          <mesh
            receiveShadow
            position={[0.64, active ? 0.21 : 0.17, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[0.07, 0.13]} />
            <meshStandardMaterial color="#998d70" roughness={1} />
          </mesh>
          <mesh
            castShadow
            receiveShadow
            position={[0.52, -0.16, 0.38]}
            rotation={[0.1, 0.3, 0.1]}
            scale={[0.2, 0.12, 0.16]}
          >
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={tileIndex % 2 ? "#899779" : "#b2a58c"} roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
