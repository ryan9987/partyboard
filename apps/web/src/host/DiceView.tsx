import { RoundedBox } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"

const VALUE_ROTATIONS: Record<number, readonly [number, number, number]> = {
  1: [0, 0, 0],
  2: [Math.PI / 2, 0, 0],
  3: [0, -Math.PI / 2, 0],
  4: [0, Math.PI / 2, 0],
  5: [-Math.PI / 2, 0, 0],
  6: [0, Math.PI, 0],
}

const DEFAULT_ROTATION: readonly [number, number, number] = [0.22, -0.35, 0.08]
const PIP_LAYOUTS: Record<number, readonly (readonly [number, number])[]> = {
  1: [[0, 0]],
  2: [
    [-0.24, 0.24],
    [0.24, -0.24],
  ],
  3: [
    [-0.25, 0.25],
    [0, 0],
    [0.25, -0.25],
  ],
  4: [
    [-0.24, 0.24],
    [0.24, 0.24],
    [-0.24, -0.24],
    [0.24, -0.24],
  ],
  5: [
    [-0.25, 0.25],
    [0.25, 0.25],
    [0, 0],
    [-0.25, -0.25],
    [0.25, -0.25],
  ],
  6: [
    [-0.24, 0.27],
    [-0.24, 0],
    [-0.24, -0.27],
    [0.24, 0.27],
    [0.24, 0],
    [0.24, -0.27],
  ],
}

const FACES = [
  { normal: [0, 0, 1], rotation: [0, 0, 0], value: 1 },
  { normal: [0, 1, 0], rotation: [-Math.PI / 2, 0, 0], value: 2 },
  { normal: [1, 0, 0], rotation: [0, Math.PI / 2, 0], value: 3 },
  { normal: [-1, 0, 0], rotation: [0, -Math.PI / 2, 0], value: 4 },
  { normal: [0, -1, 0], rotation: [Math.PI / 2, 0, 0], value: 5 },
  { normal: [0, 0, -1], rotation: [0, Math.PI, 0], value: 6 },
] as const

type DiceViewProps = {
  position?: readonly [number, number, number]
  value: number | null
  rolling: boolean
}

function PipFace({ face }: { face: (typeof FACES)[number] }) {
  const pips = PIP_LAYOUTS[face.value] ?? []

  return (
    <group
      position={face.normal.map((coordinate) => coordinate * 0.685) as [number, number, number]}
      rotation={face.rotation}
    >
      {pips.map(([x, y], index) => (
        <mesh key={index} position={[x, y, 0.008]} scale={[1, 1, 0.18]}>
          <sphereGeometry args={[0.092, 20, 14]} />
          <meshPhysicalMaterial
            clearcoat={0.75}
            color="#10182b"
            metalness={0.14}
            roughness={0.24}
          />
        </mesh>
      ))}
    </group>
  )
}

export function DiceView({ position = [0, 1.85, 0], value, rolling }: DiceViewProps) {
  const floatRef = useRef<THREE.Group>(null)
  const dieRef = useRef<THREE.Group>(null)
  const basePosition = useMemo(() => new THREE.Vector3(...position), [position])

  useFrame((state, delta) => {
    const floating = floatRef.current
    const die = dieRef.current
    if (!floating || !die) return

    floating.position.x = THREE.MathUtils.damp(floating.position.x, basePosition.x, 8, delta)
    floating.position.y = THREE.MathUtils.damp(
      floating.position.y,
      basePosition.y + Math.sin(state.clock.elapsedTime * 2.2) * 0.12,
      8,
      delta,
    )
    floating.position.z = THREE.MathUtils.damp(floating.position.z, basePosition.z, 8, delta)

    if (rolling) {
      die.rotation.x += delta * 8.5
      die.rotation.y += delta * 10
      die.rotation.z += delta * 5
      return
    }

    const target = VALUE_ROTATIONS[value ?? 0] ?? DEFAULT_ROTATION
    die.rotation.x = THREE.MathUtils.damp(die.rotation.x, target[0], 7, delta)
    die.rotation.y = THREE.MathUtils.damp(die.rotation.y, target[1], 7, delta)
    die.rotation.z = THREE.MathUtils.damp(die.rotation.z, target[2], 7, delta)
  })

  return (
    <group ref={floatRef} position={position}>
      <group ref={dieRef}>
        <RoundedBox args={[1.34, 1.34, 1.34]} castShadow radius={0.19} smoothness={8}>
          <meshPhysicalMaterial
            clearcoat={0.72}
            clearcoatRoughness={0.18}
            color="#fffaf0"
            metalness={0.03}
            roughness={0.24}
          />
        </RoundedBox>
        <RoundedBox args={[1.365, 1.365, 1.365]} radius={0.2} smoothness={8}>
          <meshPhysicalMaterial
            color="#bdefff"
            opacity={0.12}
            roughness={0.08}
            thickness={0.15}
            transparent
            transmission={0.18}
          />
        </RoundedBox>
        {FACES.map((face) => (
          <PipFace face={face} key={face.value} />
        ))}
      </group>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.97, 0.018, 8, 48]} />
        <meshBasicMaterial
          color={rolling ? "#fff0a8" : "#7cebf1"}
          opacity={rolling ? 0.75 : 0.34}
          transparent
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, Math.PI / 3]} scale={1.18}>
        <torusGeometry args={[0.97, 0.01, 8, 48]} />
        <meshBasicMaterial color="#ffffff" opacity={0.2} transparent />
      </mesh>
      <pointLight
        color={rolling ? "#fff0a8" : "#8cecf4"}
        intensity={rolling ? 16 : 6}
        distance={7}
      />
    </group>
  )
}
