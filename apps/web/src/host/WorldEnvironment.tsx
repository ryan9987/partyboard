import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"

const TREE_POSITIONS = [
  [-10.5, -5.5, 0.9],
  [-9.8, 5.7, 1.08],
  [-7.6, -7.1, 0.82],
  [-5.4, 7.5, 0.96],
  [-1.8, -7.7, 0.88],
  [2.3, 7.8, 1.04],
  [6.5, -7.2, 0.9],
  [9.2, 6.2, 1.1],
  [10.8, -3.7, 0.82],
] as const

const ROCK_POSITIONS = [
  [-8.8, -3.7, 0.7],
  [-7.4, 6.4, 0.5],
  [8.2, -5.8, 0.75],
  [10.1, 3.9, 0.55],
] as const

const CLOUD_PUFFS = [
  [-0.75, 0, 0, 0.58],
  [0, 0.18, 0, 0.82],
  [0.78, 0, 0, 0.62],
  [0.1, -0.12, 0.2, 0.72],
] as const

function Tree({ position, scale }: { position: readonly [number, number]; scale: number }) {
  return (
    <group position={[position[0], -0.15, position[1]]} scale={scale}>
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

function Flowers() {
  const flowers = Array.from({ length: 28 }, (_, index) => {
    const angle = (index / 28) * Math.PI * 2 + (index % 3) * 0.22
    const radius = 8.2 + (index % 4) * 0.44
    return {
      color: index % 3 === 0 ? "#ffd966" : index % 3 === 1 ? "#ff8ca1" : "#f7f4ff",
      position: [Math.cos(angle) * radius, -0.18, Math.sin(angle) * radius] as const,
    }
  })

  return (
    <group>
      {flowers.map((flower, index) => (
        <group key={index} position={flower.position}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.018, 0.025, 0.26, 6]} />
            <meshStandardMaterial color="#3c8d48" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.27, 0]}>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshStandardMaterial color={flower.color} roughness={0.78} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function WorldEnvironment() {
  return (
    <>
      <mesh receiveShadow position={[0, -0.82, 0]}>
        <cylinderGeometry args={[11.8, 12.5, 1.1, 64]} />
        <meshStandardMaterial color="#6a452b" roughness={1} />
      </mesh>
      <mesh receiveShadow position={[0, -0.24, 0]}>
        <cylinderGeometry args={[11.8, 11.8, 0.18, 64]} />
        <meshStandardMaterial color="#55ad5b" roughness={0.98} />
      </mesh>

      {TREE_POSITIONS.map(([x, z, scale], index) => (
        <Tree key={index} position={[x, z]} scale={scale} />
      ))}

      {ROCK_POSITIONS.map(([x, z, scale], index) => (
        <mesh
          castShadow
          key={index}
          position={[x, 0, z]}
          rotation={[0.2, index * 0.7, 0.1]}
          scale={[scale, scale * 0.72, scale * 0.86]}
        >
          <dodecahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial color="#8e9aa0" roughness={0.92} />
        </mesh>
      ))}

      <Flowers />
      <Cloud position={[-8, 6.8, -8]} speed={0.18} />
      <Cloud position={[5, 7.8, -10]} speed={0.11} />
    </>
  )
}
