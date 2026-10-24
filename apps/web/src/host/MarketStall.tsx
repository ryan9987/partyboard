import { defaultBoard, SHOP_TILE_IDS } from "@party-board/board"

function Stall({ position }: { position: readonly [number, number, number] }) {
  return (
    <group position={[position[0] + 2.55, -0.08, position[2]]}>
      <mesh castShadow receiveShadow position={[0, 0.04, 0]}>
        <boxGeometry args={[2.2, 0.15, 1.45]} />
        <meshStandardMaterial color="#89744e" roughness={1} />
      </mesh>
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} castShadow position={[x, 1, -0.45]}>
          <cylinderGeometry args={[0.045, 0.07, 2.1, 8]} />
          <meshStandardMaterial color="#755432" roughness={0.9} />
        </mesh>
      ))}
      {Array.from({ length: 7 }, (_, index) => (
        <group key={index} position={[-0.93 + index * 0.31, 1.95, -0.05]}>
          <mesh castShadow rotation={[-0.16, 0, 0]}>
            <boxGeometry args={[0.31, 0.045, 1.45]} />
            <meshStandardMaterial color={index % 2 ? "#ece2be" : "#597d58"} roughness={0.95} />
          </mesh>
          <mesh castShadow position={[0, -0.05, 0.71]}>
            <boxGeometry args={[0.31, 0.18, 0.04]} />
            <meshStandardMaterial color={index % 2 ? "#ece2be" : "#597d58"} />
          </mesh>
        </group>
      ))}
      <mesh castShadow position={[0, 0.7, 0.28]}>
        <boxGeometry args={[2.05, 0.12, 0.72]} />
        <meshStandardMaterial color="#bf945c" roughness={0.85} />
      </mesh>
      {[-0.85, -0.42, 0, 0.42, 0.85].map((x) => (
        <mesh key={x} castShadow position={[x, 0.35, 0.53]}>
          <boxGeometry args={[0.4, 0.64, 0.06]} />
          <meshStandardMaterial color="#9f7746" roughness={0.9} />
        </mesh>
      ))}
      {[-0.65, 0, 0.65].map((x, index) => (
        <group key={x} position={[x, 0.85, 0.25]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.1, 0.13, 0.2, 12]} />
            <meshStandardMaterial
              color={["#a9d6df", "#d5b479", "#99b675"][index]!}
              roughness={0.35}
              metalness={0.15}
            />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <sphereGeometry args={[0.12, 14, 10]} />
            <meshStandardMaterial
              color={["#c9f2ff", "#dda85e", "#a7c88a"][index]!}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0, -0.1, 0.16]} rotation={[-Math.PI / 2, 0, 0]}>
            <boxGeometry args={[0.2, 0.13, 0.02]} />
            <meshStandardMaterial color="#f4e9ce" />
          </mesh>
        </group>
      ))}
      <mesh castShadow position={[-1.25, 0.25, -0.1]}>
        <boxGeometry args={[0.45, 0.5, 0.55]} />
        <meshStandardMaterial color="#8c6942" />
      </mesh>
      <mesh position={[0, 1.62, -0.43]}>
        <boxGeometry args={[0.6, 0.28, 0.04]} />
        <meshStandardMaterial color="#ead9af" />
      </mesh>
      <mesh position={[0, 1.62, -0.39]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.14, 0.14, 0.03]} />
        <meshStandardMaterial color="#b18c43" metalness={0.4} />
      </mesh>
    </group>
  )
}

export function TrailMarkets() {
  return (
    <>
      {defaultBoard.tiles
        .filter((tile) => SHOP_TILE_IDS.includes(tile.id))
        .map((tile) => (
          <Stall key={tile.id} position={tile.position} />
        ))}
    </>
  )
}
