import type { Vec3 } from "@party-board/board"
import type { PlayerColor } from "@party-board/protocol"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"

import { getCharacterOffset } from "./characterLayout"

export type HairStyle = "short" | "bun" | "spikes" | "cap"

export type CharacterAppearance = {
  skinTone: string
  hairColor: string
  hairStyle: HairStyle
  shirtColor: string
  pantsColor: string
  shoeColor: string
  accessoryColor: string
}

const APPEARANCES: Record<PlayerColor, CharacterAppearance> = {
  cyan: {
    skinTone: "#9d6546",
    hairColor: "#201712",
    hairStyle: "short",
    shirtColor: "#28c8d0",
    pantsColor: "#27365f",
    shoeColor: "#f8fbff",
    accessoryColor: "#ffdf70",
  },
  coral: {
    skinTone: "#efb48e",
    hairColor: "#5b2f1d",
    hairStyle: "bun",
    shirtColor: "#ff6678",
    pantsColor: "#4c285b",
    shoeColor: "#fff4ef",
    accessoryColor: "#5de2e7",
  },
  gold: {
    skinTone: "#74462f",
    hairColor: "#171311",
    hairStyle: "spikes",
    shirtColor: "#f3bf3f",
    pantsColor: "#31594e",
    shoeColor: "#fff8dc",
    accessoryColor: "#ff6d7c",
  },
  violet: {
    skinTone: "#d58c67",
    hairColor: "#37224f",
    hairStyle: "cap",
    shirtColor: "#8c67ef",
    pantsColor: "#243657",
    shoeColor: "#eef4ff",
    accessoryColor: "#79e4ee",
  },
}

type CharacterModelProps = {
  active: boolean
  appearance?: CharacterAppearance
  color: PlayerColor
  moving: boolean
  playerIndex: number
  position: Vec3
}

type LimbProps = {
  color: string
  limbRef: React.RefObject<THREE.Group | null>
  position: readonly [number, number, number]
  side: "left" | "right"
  skinTone: string
}

function Arm({ color, limbRef, position, side, skinTone }: LimbProps) {
  return (
    <group ref={limbRef} position={position}>
      <mesh castShadow position={[0, -0.17, 0]}>
        <capsuleGeometry args={[0.065, 0.24, 5, 10]} />
        <meshStandardMaterial color={color} roughness={0.62} />
      </mesh>
      <mesh castShadow position={[0, -0.37, 0]}>
        <sphereGeometry args={[0.075, 12, 10]} />
        <meshStandardMaterial color={skinTone} roughness={0.72} />
      </mesh>
      {side === "right" && (
        <mesh castShadow position={[0, -0.1, -0.09]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.085, 0.25, 0.05]} />
          <meshStandardMaterial color="#f7fbff" roughness={0.5} />
        </mesh>
      )}
    </group>
  )
}

function Leg({ color, limbRef, position }: Omit<LimbProps, "side" | "skinTone">) {
  return (
    <group ref={limbRef} position={position}>
      <mesh castShadow position={[0, -0.2, 0]}>
        <capsuleGeometry args={[0.08, 0.28, 5, 10]} />
        <meshStandardMaterial color={color} roughness={0.66} />
      </mesh>
      <mesh castShadow position={[0, -0.42, 0.055]}>
        <boxGeometry args={[0.17, 0.1, 0.27]} />
        <meshStandardMaterial color="#f5f7ff" roughness={0.38} />
      </mesh>
    </group>
  )
}

function Hair({ appearance }: { appearance: CharacterAppearance }) {
  if (appearance.hairStyle === "bun") {
    return (
      <group>
        <mesh castShadow position={[0, 0.015, -0.015]} scale={[1.04, 0.7, 1.02]}>
          <sphereGeometry args={[0.215, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.75]} />
          <meshStandardMaterial color={appearance.hairColor} roughness={0.92} />
        </mesh>
        <mesh castShadow position={[0, 0.18, -0.07]}>
          <sphereGeometry args={[0.105, 14, 10]} />
          <meshStandardMaterial color={appearance.hairColor} roughness={0.92} />
        </mesh>
      </group>
    )
  }

  if (appearance.hairStyle === "spikes") {
    return (
      <group position={[0, 0.1, -0.015]}>
        {[-0.13, -0.065, 0, 0.065, 0.13].map((x, index) => (
          <mesh
            castShadow
            key={x}
            position={[x, index % 2 === 0 ? 0.05 : 0.01, 0]}
            rotation={[0.15, 0, x * -2.2]}
          >
            <coneGeometry args={[0.065, 0.2, 7]} />
            <meshStandardMaterial color={appearance.hairColor} roughness={0.9} />
          </mesh>
        ))}
      </group>
    )
  }

  if (appearance.hairStyle === "cap") {
    return (
      <group>
        <mesh castShadow position={[0, 0.08, 0]} scale={[1.08, 0.48, 1.08]}>
          <sphereGeometry args={[0.22, 16, 12]} />
          <meshStandardMaterial color={appearance.accessoryColor} roughness={0.72} />
        </mesh>
        <mesh castShadow position={[0, 0.05, 0.2]}>
          <boxGeometry args={[0.25, 0.045, 0.14]} />
          <meshStandardMaterial color={appearance.accessoryColor} roughness={0.72} />
        </mesh>
      </group>
    )
  }

  return (
    <mesh castShadow position={[0, 0.04, -0.01]} scale={[1.04, 0.62, 1.03]}>
      <sphereGeometry args={[0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
      <meshStandardMaterial color={appearance.hairColor} roughness={0.92} />
    </mesh>
  )
}

export function CharacterModel({
  active,
  appearance: appearanceOverride,
  color,
  moving,
  playerIndex,
  position,
}: CharacterModelProps) {
  const rootRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Group>(null)
  const leftArmRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  const leftLegRef = useRef<THREE.Group>(null)
  const rightLegRef = useRef<THREE.Group>(null)
  const activeRingRef = useRef<THREE.Mesh>(null)
  const appearance = appearanceOverride ?? APPEARANCES[color]
  const offset = getCharacterOffset(playerIndex)
  const target = useMemo(
    () => new THREE.Vector3(position[0] + offset[0], position[1] + 0.86, position[2] + offset[2]),
    [offset, position],
  )

  useFrame((state, delta) => {
    const root = rootRef.current
    const body = bodyRef.current
    if (!root || !body) return

    const smoothing = 1 - Math.exp(-delta * 9)
    root.position.lerp(target, smoothing)
    root.rotation.y = THREE.MathUtils.damp(root.rotation.y, 0, 8, delta)

    const time = state.clock.elapsedTime
    const stride = moving ? Math.sin(time * 11) * 0.62 : Math.sin(time * 2.1) * 0.035
    const bounce = moving ? Math.abs(Math.sin(time * 11)) * 0.15 : Math.sin(time * 2.1) * 0.025
    body.position.y = bounce

    if (leftArmRef.current) leftArmRef.current.rotation.x = stride
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x =
        active && !moving ? -0.45 + Math.sin(time * 3) * 0.12 : -stride
    }
    if (leftLegRef.current) leftLegRef.current.rotation.x = -stride * 0.8
    if (rightLegRef.current) rightLegRef.current.rotation.x = stride * 0.8

    if (activeRingRef.current) {
      const pulse = 1 + Math.sin(time * 3.4) * 0.1
      activeRingRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group ref={rootRef} position={target} scale={1.02}>
      {active && (
        <group position={[0, -0.61, 0]}>
          <mesh ref={activeRingRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.36, 0.49, 40]} />
            <meshBasicMaterial color={appearance.shirtColor} transparent opacity={0.94} />
          </mesh>
          <pointLight color={appearance.shirtColor} distance={3.2} intensity={4.5} />
        </group>
      )}

      <group ref={bodyRef}>
        <Leg color={appearance.pantsColor} limbRef={leftLegRef} position={[-0.105, 0, 0]} />
        <Leg color={appearance.pantsColor} limbRef={rightLegRef} position={[0.105, 0, 0]} />

        <mesh castShadow position={[0, 0.28, 0]}>
          <capsuleGeometry args={[0.2, 0.32, 7, 14]} />
          <meshStandardMaterial
            color={appearance.shirtColor}
            emissive={active ? appearance.shirtColor : "#000000"}
            emissiveIntensity={active ? 0.12 : 0}
            roughness={0.58}
          />
        </mesh>

        <mesh castShadow position={[0, 0.32, -0.2]}>
          <boxGeometry args={[0.29, 0.35, 0.12]} />
          <meshStandardMaterial color={appearance.accessoryColor} roughness={0.65} />
        </mesh>

        <Arm
          color={appearance.shirtColor}
          limbRef={leftArmRef}
          position={[-0.255, 0.47, 0]}
          side="left"
          skinTone={appearance.skinTone}
        />
        <Arm
          color={appearance.shirtColor}
          limbRef={rightArmRef}
          position={[0.255, 0.47, 0]}
          side="right"
          skinTone={appearance.skinTone}
        />

        <group position={[0, 0.82, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.22, 18, 14]} />
            <meshStandardMaterial color={appearance.skinTone} roughness={0.72} />
          </mesh>
          <Hair appearance={appearance} />
          <mesh position={[-0.072, 0.02, 0.198]}>
            <sphereGeometry args={[0.026, 10, 8]} />
            <meshStandardMaterial color="#162033" roughness={0.38} />
          </mesh>
          <mesh position={[0.072, 0.02, 0.198]}>
            <sphereGeometry args={[0.026, 10, 8]} />
            <meshStandardMaterial color="#162033" roughness={0.38} />
          </mesh>
          <mesh position={[0, -0.055, 0.215]} scale={[1, 0.45, 0.35]}>
            <sphereGeometry args={[0.035, 10, 8]} />
            <meshStandardMaterial color="#9f4f54" roughness={0.65} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
