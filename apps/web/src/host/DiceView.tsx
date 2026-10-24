import { useFrame } from "@react-three/fiber"
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
  value: number | null
  rolling: boolean
}

export function DiceView({ value, rolling }: DiceViewProps) {
  const dieRef = useRef<THREE.Mesh>(null)

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
    <group position={[0, 1.25, 0]}>
      <mesh castShadow ref={dieRef}>
        <boxGeometry args={[1.25, 1.25, 1.25, 4, 4, 4]} />
        <meshStandardMaterial color="#f8fbff" metalness={0.2} roughness={0.2} />
      </mesh>
      <pointLight color="#68e7f0" intensity={rolling ? 15 : 6} distance={7} />
    </group>
  )
}
