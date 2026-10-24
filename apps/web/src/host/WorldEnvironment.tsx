import { defaultBoard } from "@party-board/board"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"

const CLOUD_PUFFS = [
  [-0.75, 0, 0, 0.58],
  [0, 0.18, 0, 0.82],
  [0.78, 0, 0, 0.62],
  [0.1, -0.12, 0.2, 0.72],
] as const

const ROUTE_CENTER_Z =
  ((defaultBoard.tiles[0]?.position[2] ?? 0) + (defaultBoard.tiles.at(-1)?.position[2] ?? 0)) / 2

function Tree({ position, scale }: { position: readonly [number, number]; scale: number }) {
  return (
    <group position={[position[0], -0.12, position[1]]} scale={scale}>
      <mesh castShadow position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.17, 0.25, 1.5, 9]} />
        <meshStandardMaterial color="#865332" roughness={0.96} />
      </mesh>
      <mesh castShadow position={[0, 1.72, 0]}>
        <coneGeometry args={[0.9, 1.55, 9]} />
        <meshStandardMaterial color="#257d50" roughness={0.88} />
      </mesh>
      <mesh castShadow position={[0, 2.35, 0]}>
        <coneGeometry args={[0.66, 1.25, 9]} />
        <meshStandardMaterial color="#36a966" roughness={0.85} />
      </mesh>
    </group>
  )
}

function Cloud({
  position,
  speed,
}: {
  position: readonly [number, number, number]
  speed: number
}) {
  const cloudRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    const cloud = cloudRef.current
    if (!cloud) return
    cloud.position.x += delta * speed
    if (cloud.position.x > 14) cloud.position.x = -14
  })

  return (
    <group ref={cloudRef} position={position}>
      {CLOUD_PUFFS.map(([x, y, z, scale], index) => (
        <mesh key={index} position={[x, y, z]} scale={scale}>
          <sphereGeometry args={[0.8, 14, 10]} />
          <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0.92} />
        </mesh>
      ))}
    </group>
  )
}

function StartGate() {
  const start = defaultBoard.tiles[0]?.position ?? [0, 0, 8]

  return (
    <group position={[start[0], 0, start[2] - 1.3]}>
      {[-1.2, 1.2].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh castShadow position={[0, 1.15, 0]}>
            <cylinderGeometry args={[0.16, 0.22, 2.3, 8]} />
            <meshStandardMaterial color="#825230" roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0, 2.3, 0]}>
            <sphereGeometry args={[0.23, 10, 8]} />
            <meshStandardMaterial color="#f4c64f" roughness={0.6} />
          </mesh>
        </group>
      ))}
      <mesh castShadow position={[0, 2.05, 0]}>
        <boxGeometry args={[2.65, 0.5, 0.22]} />
        <meshStandardMaterial color="#f2d78c" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.06, 0.12]}>
        <boxGeometry args={[1.45, 0.12, 0.03]} />
        <meshStandardMaterial color="#cf6a54" roughness={0.7} />
      </mesh>
    </group>
  )
}

export function WorldEnvironment() {
  const decorations = useMemo(
    () =>
      defaultBoard.tiles.map((tile, index) => ({
        flowerColor: index % 3 === 0 ? "#ffd966" : index % 3 === 1 ? "#ff8ca1" : "#f7f4ff",
        side: index % 2 === 0 ? 1 : -1,
        tile,
      })),
    [],
  )

  return (
    <>
      <mesh receiveShadow position={[0, -0.82, ROUTE_CENTER_Z]}>
        <boxGeometry args={[19, 1.2, 64]} />
        <meshStandardMaterial color="#69452d" roughness={1} />
      </mesh>
      <mesh receiveShadow position={[0, -0.17, ROUTE_CENTER_Z]}>
        <boxGeometry args={[19, 0.16, 64]} />
        <meshStandardMaterial color="#55ad5b" roughness={0.98} />
      </mesh>

      {decorations.map(({ flowerColor, side, tile }, index) => (
        <group key={tile.id}>
          {index % 2 === 0 && (
            <Tree
              position={[tile.position[0] + side * (4.25 + (index % 3) * 0.45), tile.position[2]]}
              scale={0.78 + (index % 5) * 0.07}
            />
          )}
          {index % 6 === 2 && (
            <mesh
              castShadow
              position={[tile.position[0] - side * 3.25, 0.03, tile.position[2] + 0.35]}
              rotation={[0.2, index * 0.7, 0.1]}
              scale={[0.62, 0.45, 0.56]}
            >
              <dodecahedronGeometry args={[0.7, 0]} />
              <meshStandardMaterial color="#8e9aa0" roughness={0.92} />
            </mesh>
          )}
          <group position={[tile.position[0] + side * 2.35, -0.08, tile.position[2] + 0.42]}>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.018, 0.025, 0.26, 6]} />
              <meshStandardMaterial color="#3c8d48" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.27, 0]}>
              <sphereGeometry args={[0.07, 8, 6]} />
              <meshStandardMaterial color={flowerColor} roughness={0.78} />
            </mesh>
          </group>
        </group>
      ))}

      <StartGate />
      <Cloud position={[-8, 7.2, 2]} speed={0.18} />
      <Cloud position={[5, 8.1, -17]} speed={0.11} />
      <Cloud position={[-3, 7.5, -38]} speed={0.14} />
    </>
  )
}
