import type { Vec3 } from "@party-board/board"
import type { PlayerColor } from "@party-board/protocol"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"

const COLOR_VALUES: Record<PlayerColor, string> = {
  coral: "#ff6f7d",
  cyan: "#51e7ee",
  gold: "#f6cc58",
  violet: "#9a72ff",
}

const PLAYER_OFFSETS: Vec3[] = [
  [-0.26, 0, -0.22],
  [0.26, 0, -0.22],
  [-0.26, 0, 0.22],
  [0.26, 0, 0.22],
]

const DEFAULT_PLAYER_OFFSET: Vec3 = [0, 0, 0]

type PlayerPieceProps = {
  color: PlayerColor
  playerIndex: number
  position: Vec3
  active: boolean
  moving: boolean
}

export function PlayerPiece({ color, playerIndex, position, active, moving }: PlayerPieceProps) {
  const groupRef = useRef<THREE.Group>(null)
  const offset = PLAYER_OFFSETS[playerIndex % PLAYER_OFFSETS.length] ?? DEFAULT_PLAYER_OFFSET
  const target = useMemo(
    () => new THREE.Vector3(position[0] + offset[0], position[1] + 0.64, position[2] + offset[2]),
    [offset, position],
  )

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group) return

    const smoothing = 1 - Math.exp(-delta * 10)
    group.position.lerp(target, smoothing)
    group.rotation.y += delta * (moving ? 5 : active ? 1.1 : 0.25)
    const bob = moving ? Math.abs(Math.sin(state.clock.elapsedTime * 9)) * 0.42 : 0
    group.position.y = THREE.MathUtils.lerp(group.position.y, target.y + bob, smoothing)
  })

  return (
    <group ref={groupRef} position={target}>
      {active && (
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.4, 28]} />
          <meshBasicMaterial color={COLOR_VALUES[color]} transparent opacity={0.8} />
        </mesh>
      )}
      <mesh castShadow position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.24, 0.34, 0.34, 20]} />
        <meshStandardMaterial
          color={COLOR_VALUES[color]}
          emissive={COLOR_VALUES[color]}
          emissiveIntensity={active ? 0.45 : 0.12}
          metalness={0.25}
          roughness={0.3}
        />
      </mesh>
      <mesh castShadow position={[0, 0.24, 0]}>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshStandardMaterial color="#f7fbff" metalness={0.15} roughness={0.25} />
      </mesh>
    </group>
  )
}
