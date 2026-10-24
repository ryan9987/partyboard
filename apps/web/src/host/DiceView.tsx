import { useFrame } from "@react-three/fiber"
import { RoundedBox } from "@react-three/drei"
import { useRef } from "react"
import * as THREE from "three"

const VALUE_ROTATIONS: Record<number, readonly [number, number, number]> = {
  1: [0.15, 0.2, 0],
  2: [0.2, Math.PI / 2, 0.05],
  3: [-Math.PI / 2, 0.15, 0],
  4: [Math.PI / 2, -0.15, 0],
  5: [0.1, -Math.PI / 2, -0.05],
  6: [Math.PI, 0.15, 0],
}

const DEFAULT_ROTATION: readonly [number, number, number] = [0.15, 0.2, 0]

type DiceViewProps = {
  position?: readonly [number, number, number]
  value: number | null
  rolling: boolean
}

export function DiceView({ position = [0, 1.38, 0], value, rolling }: DiceViewProps) {
  const dieRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    const die = dieRef.current
    if (!die) return

    if (rolling) {
      die.rotation.x += delta * 8.5
      die.rotation.y += delta * 10
      die.rotation.z += delta * 5
      return
    }

    const target = VALUE_ROTATIONS[value ?? 1] ?? DEFAULT_ROTATION
    die.rotation.x = THREE.MathUtils.damp(die.rotation.x, target[0], 9, delta)
    die.rotation.y = THREE.MathUtils.damp(die.rotation.y, target[1], 9, delta)
    die.rotation.z = THREE.MathUtils.damp(die.rotation.z, target[2], 9, delta)
  })

  return (
    <group position={position}>
      <group ref={dieRef}>
        <RoundedBox args={[1.25, 1.25, 1.25]} castShadow radius={0.14} smoothness={5}>
          <meshStandardMaterial color="#fffdf7" metalness={0.04} roughness={0.32} />
        </RoundedBox>
        <mesh position={[0, 0, 0.625]} scale={[1, 1, 0.35]}>
          <sphereGeometry args={[0.105, 14, 10]} />
          <meshStandardMaterial color="#17223a" roughness={0.55} />
        </mesh>
        {[-0.25, 0.25].flatMap((x) =>
          [-0.25, 0.25].map((y) => (
            <mesh key={`back-${x}-${y}`} position={[x, y, -0.625]} scale={[1, 1, 0.35]}>
              <sphereGeometry args={[0.095, 14, 10]} />
              <meshStandardMaterial color="#17223a" roughness={0.55} />
            </mesh>
          )),
        )}
        {[-0.25, 0, 0.25].map((x) => (
          <mesh key={`top-${x}`} position={[x, 0.625, x]} scale={[1, 0.35, 1]}>
            <sphereGeometry args={[0.09, 14, 10]} />
            <meshStandardMaterial color="#17223a" roughness={0.55} />
          </mesh>
        ))}
      </group>
      <pointLight color="#fff3c4" intensity={rolling ? 13 : 5} distance={7} />
    </group>
  )
}
