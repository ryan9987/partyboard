import type { Vec3 } from "@party-board/board"
import type { PlayerColor } from "@party-board/protocol"
import { RoundedBox } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import * as THREE from "three"

import { getCharacterOffset } from "./characterLayout"
import { createFabricTexture } from "./sceneryMaterials"
import { createMotionSample, dampAngle, sampleTrailMotion, type TrailMotion } from "./trailMotion"

const NO_OFFSET = [0, 0, 0] as const

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
  fern: {
    skinTone: "#a47150",
    hairColor: "#30231a",
    hairStyle: "bun",
    shirtColor: "#658b56",
    pantsColor: "#393b45",
    shoeColor: "#f4ecda",
    accessoryColor: "#e6c46c",
  },
  peach: {
    skinTone: "#f1c2a2",
    hairColor: "#9b5c34",
    hairStyle: "short",
    shirtColor: "#d58d55",
    pantsColor: "#354c60",
    shoeColor: "#faf3e1",
    accessoryColor: "#7caca2",
  },
  blue: {
    skinTone: "#694530",
    hairColor: "#211916",
    hairStyle: "cap",
    shirtColor: "#5886c4",
    pantsColor: "#37443b",
    shoeColor: "#f0ecd9",
    accessoryColor: "#ecd492",
  },
  rose: {
    skinTone: "#cf9470",
    hairColor: "#38262c",
    hairStyle: "spikes",
    shirtColor: "#bc689a",
    pantsColor: "#363956",
    shoeColor: "#f6e9e3",
    accessoryColor: "#91c1a3",
  },
}

type CharacterModelProps = {
  compactTrail?: boolean
  trailLift?: number
  clock?: () => number
  centered?: boolean
  pose?: "carry" | "fishing" | "archery" | "balance" | "fall" | "rhythm" | undefined
  actionAt?: number
  lean?: number
  rightHand?: ReactNode
  leftHand?: ReactNode
  facing?: number
  active: boolean
  appearance?: CharacterAppearance
  color: PlayerColor
  moving: boolean
  playerIndex: number
  position: Vec3
  motion?: TrailMotion | null
}

type LimbProps = {
  fabric?: THREE.Texture
  children?: ReactNode
  color: string
  limbRef: React.RefObject<THREE.Group | null>
  position: readonly [number, number, number]
  side: "left" | "right"
  skinTone: string
}

function Arm({ color, limbRef, position, side, skinTone, children, fabric }: LimbProps) {
  return (
    <group ref={limbRef} position={position}>
      <mesh castShadow position={[0, -0.135, 0]}>
        <capsuleGeometry args={[0.067, 0.15, 3, 8]} />
        <meshStandardMaterial color={color} roughness={0.95} map={fabric ?? null} />
      </mesh>
      <mesh castShadow position={[0, -0.28, 0]}>
        <capsuleGeometry args={[0.046, 0.1, 3, 8]} />
        <meshStandardMaterial color={skinTone} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.23, 0]}>
        <cylinderGeometry args={[0.057, 0.052, 0.045, 14]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <RoundedBox
        castShadow
        position={[0, -0.37, 0]}
        args={[0.105, 0.105, 0.07]}
        radius={0.025}
        smoothness={2}
      >
        <meshStandardMaterial color={skinTone} roughness={0.8} />
      </RoundedBox>
      <mesh
        castShadow
        position={[side === "right" ? -0.05 : 0.05, -0.365, 0.018]}
        rotation={[0, 0, side === "right" ? -0.4 : 0.4]}
      >
        <capsuleGeometry args={[0.021, 0.045, 2, 8]} />
        <meshStandardMaterial color={skinTone} roughness={0.8} />
      </mesh>
      {[-0.03, 0, 0.03].map((x) => (
        <mesh key={x} position={[x, -0.412, 0.025]}>
          <sphereGeometry args={[0.018, 8, 6]} />
          <meshStandardMaterial color={skinTone} roughness={0.8} />
        </mesh>
      ))}
      <group position={[0, -0.37, 0]}>{children}</group>
      {side === "right" && !children && (
        <mesh castShadow position={[0, -0.1, -0.09]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.085, 0.25, 0.05]} />
          <meshStandardMaterial color="#f7fbff" roughness={0.5} />
        </mesh>
      )}
    </group>
  )
}

function Leg({
  fabric,
  color,
  limbRef,
  position,
  shoeColor,
}: Omit<LimbProps, "side" | "skinTone"> & { shoeColor: string }) {
  return (
    <group ref={limbRef} position={position}>
      <mesh castShadow position={[0, -0.265, 0]}>
        <capsuleGeometry args={[0.08, 0.41, 4, 10]} />
        <meshStandardMaterial color={color} roughness={0.95} map={fabric ?? null} />
      </mesh>
      <RoundedBox
        castShadow
        position={[0, -0.535, 0.055]}
        args={[0.175, 0.13, 0.285]}
        radius={0.035}
        smoothness={2}
      >
        <meshStandardMaterial color={shoeColor} roughness={0.85} />
      </RoundedBox>
      <RoundedBox
        position={[0, -0.595, 0.055]}
        args={[0.185, 0.035, 0.29]}
        radius={0.012}
        smoothness={2}
      >
        <meshStandardMaterial color="#ddd7c4" roughness={0.85} />
      </RoundedBox>
      {[0.03, 0.07, 0.11].map((z) => (
        <mesh key={z} position={[0, -0.465, z]}>
          <boxGeometry args={[0.09, 0.012, 0.012]} />
          <meshStandardMaterial color="#faf4df" />
        </mesh>
      ))}
      <mesh position={[0, -0.34, 0.077]}>
        <boxGeometry args={[0.09, 0.095, 0.012]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <mesh position={[0, -0.485, 0.19]}>
        <boxGeometry args={[0.14, 0.035, 0.025]} />
        <meshStandardMaterial color="#cfc8b6" roughness={0.85} />
      </mesh>
    </group>
  )
}

function Hair({ appearance }: { appearance: CharacterAppearance }) {
  if (appearance.hairStyle === "bun") {
    return (
      <group>
        <mesh castShadow position={[0, 0.015, -0.015]} scale={[1.04, 1.04, 1.02]}>
          <sphereGeometry args={[0.215, 9, 7, 0, Math.PI * 2, 0, Math.PI / 1.75]} />
          <meshStandardMaterial color={appearance.hairColor} roughness={0.92} />
        </mesh>
        <mesh castShadow position={[0, 0.18, -0.07]}>
          <sphereGeometry args={[0.105, 8, 6]} />
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
          <sphereGeometry args={[0.22, 9, 7]} />
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
    <mesh castShadow position={[0, 0.04, -0.01]} scale={[1.04, 1, 1.03]}>
      <sphereGeometry args={[0.22, 9, 7, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
      <meshStandardMaterial color={appearance.hairColor} roughness={0.92} />
    </mesh>
  )
}

export function CharacterModel({
  compactTrail = false,
  trailLift,
  clock = Date.now,
  centered = false,
  pose,
  actionAt = 0,
  lean = 0,
  rightHand,
  leftHand,
  active,
  appearance: appearanceOverride,
  facing = 0,
  color,
  moving,
  playerIndex,
  position,
  motion,
}: CharacterModelProps) {
  const rootRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Group>(null)
  const leftArmRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  const leftLegRef = useRef<THREE.Group>(null)
  const rightLegRef = useRef<THREE.Group>(null)
  const activeRingRef = useRef<THREE.Mesh>(null)
  const fabric = useMemo(() => createFabricTexture(), [])
  const torso = useMemo(
    () =>
      new THREE.LatheGeometry(
        [
          [0, -0.04],
          [0.15, -0.04],
          [0.175, 0.02],
          [0.17, 0.18],
          [0.205, 0.36],
          [0.205, 0.43],
          [0.15, 0.54],
          [0.08, 0.58],
          [0, 0.58],
        ].map(([x, y]) => new THREE.Vector2(x!, y!)),
        32,
      ),
    [],
  )
  useEffect(() => () => fabric.dispose(), [fabric])
  useEffect(() => () => torso.dispose(), [torso])
  const appearance = appearanceOverride ?? APPEARANCES[color]
  const scale = compactTrail ? 0.74 : 1.02
  // Trail feet rest on the stone top, including its active-space lift.
  const height = centered ? 0.99 : 0.2 + 0.612 * scale + (trailLift ?? (active ? 0.1 : 0))
  const target = useMemo(() => {
    const offset = centered ? [0, 0, 0] : getCharacterOffset(playerIndex, compactTrail)
    return new THREE.Vector3(
      position[0] + offset[0]!,
      position[1] + height,
      position[2] + offset[2]!,
    )
  }, [centered, compactTrail, height, playerIndex, position])
  // R3F must not reapply a new position prop on every tile/snapshot: that bypasses smoothing.
  const [initialPosition] = useState(() => target.clone())
  const sampleRef = useRef(createMotionSample())
  const animation = useRef({
    walk: 0,
    gait: 0,
    gaitOffset: 0,
    motion: null as TrailMotion | null,
    heading: facing,
  })

  useFrame((state, delta) => {
    const root = rootRef.current
    const body = bodyRef.current
    if (!root || !body) return

    const anim = animation.current
    const sample = sampleRef.current
    let speed = moving ? 4 : 0
    if (motion) {
      sampleTrailMotion(motion, performance.now(), sample)
      const offset = centered ? NO_OFFSET : getCharacterOffset(playerIndex, compactTrail)
      root.position.set(
        sample.position[0] + offset[0]!,
        sample.position[1] + height,
        sample.position[2] + offset[2]!,
      )
      speed = Math.hypot(sample.velocity[0], sample.velocity[2])
      if (speed > 0.03) anim.heading = Math.atan2(sample.velocity[0], sample.velocity[2])
      if (anim.motion !== motion) {
        anim.motion = motion
        anim.gaitOffset = anim.gait
      }
      anim.gait = anim.gaitOffset + sample.distance * 4.6
      root.scale.setScalar(scale * Math.max(0.001, sample.opacity))
    } else {
      if (root.position.distanceToSquared(target) > 64) root.position.copy(target)
      else root.position.lerp(target, 1 - Math.exp(-delta * 12))
      anim.motion = null
      if (moving) anim.gait += delta * 9
      else anim.heading = facing
      root.scale.setScalar(THREE.MathUtils.damp(root.scale.x, scale, 12, delta))
    }
    anim.walk = THREE.MathUtils.damp(anim.walk, moving ? Math.min(1, speed / 4) : 0, 12, delta)
    root.rotation.y = dampAngle(root.rotation.y, anim.heading, 12, delta)

    const time = state.clock.elapsedTime
    const stride =
      Math.sin(anim.gait) * 0.48 * anim.walk + Math.sin(time * 2.1) * 0.025 * (1 - anim.walk)
    const bounce =
      (1 - Math.cos(anim.gait * 2)) * 0.022 * anim.walk +
      Math.sin(time * 2.1) * 0.012 * (1 - anim.walk)
    body.position.y = THREE.MathUtils.damp(body.position.y, bounce, 14, delta)
    let leftX = stride
    let leftZ = 0
    let rightX = active && !moving ? -0.45 + Math.sin(time * 3) * 0.12 : -stride
    let rightZ = 0
    if (pose && rightArmRef.current && leftArmRef.current) {
      const age = (clock() - actionAt) / 1000
      const gesture = age >= 0 && age < 0.75 ? Math.sin((age / 0.75) * Math.PI) : 0
      rightX =
        pose === "carry"
          ? -1.2
          : pose === "fishing"
            ? -0.75 - gesture * 1.1
            : pose === "archery"
              ? -1.35
              : pose === "rhythm"
                ? -0.75 - gesture * 0.85
                : -0.3
      leftX =
        pose === "archery" ? -1.4 : pose === "carry" ? -1.1 : pose === "rhythm" ? -0.75 : -0.25
      rightZ = pose === "balance" ? 1.2 : pose === "carry" ? -0.25 : 0
      leftZ = pose === "balance" ? -1.2 : pose === "carry" ? 0.25 : 0
      if (pose === "fall") {
        rightX = Math.sin(age * 13) * 0.5 - 0.6
        leftX = -Math.sin(age * 13) * 0.5 - 0.6
        rightZ = 1.4
        leftZ = -1.4
      }
    }
    const poseRate = 14
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = THREE.MathUtils.damp(
        leftArmRef.current.rotation.x,
        leftX,
        poseRate,
        delta,
      )
      leftArmRef.current.rotation.z = THREE.MathUtils.damp(
        leftArmRef.current.rotation.z,
        leftZ,
        poseRate,
        delta,
      )
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = THREE.MathUtils.damp(
        rightArmRef.current.rotation.x,
        rightX,
        poseRate,
        delta,
      )
      rightArmRef.current.rotation.z = THREE.MathUtils.damp(
        rightArmRef.current.rotation.z,
        rightZ,
        poseRate,
        delta,
      )
    }
    const bodyLean = pose === "balance" ? lean * -0.3 : 0
    body.rotation.z = THREE.MathUtils.damp(body.rotation.z, bodyLean, 16, delta)
    const kick = pose === "fall" ? Math.sin(Math.max(0, clock() - actionAt) / 90) * 0.5 : 0
    if (leftLegRef.current)
      leftLegRef.current.rotation.x = THREE.MathUtils.damp(
        leftLegRef.current.rotation.x,
        -stride * 0.8 + kick,
        20,
        delta,
      )
    if (rightLegRef.current)
      rightLegRef.current.rotation.x = THREE.MathUtils.damp(
        rightLegRef.current.rotation.x,
        stride * 0.8 - kick,
        20,
        delta,
      )

    if (activeRingRef.current) {
      const pulse = 1 + Math.sin(time * 3.4) * 0.1
      activeRingRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group ref={rootRef} position={initialPosition} scale={scale}>
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
        <Leg
          fabric={fabric}
          color={appearance.pantsColor}
          shoeColor={appearance.shoeColor}
          limbRef={leftLegRef}
          position={[-0.105, 0, 0]}
        />
        <Leg
          fabric={fabric}
          color={appearance.pantsColor}
          shoeColor={appearance.shoeColor}
          limbRef={rightLegRef}
          position={[0.105, 0, 0]}
        />

        <mesh castShadow geometry={torso} scale={[1, 1, 0.94]}>
          <meshStandardMaterial
            map={fabric}
            bumpMap={fabric}
            bumpScale={0.008}
            color={appearance.shirtColor}
            emissive={active ? appearance.shirtColor : "#000000"}
            emissiveIntensity={active ? 0.12 : 0}
            roughness={0.92}
          />
        </mesh>
        <mesh castShadow position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.073, 0.085, 0.15, 18]} />
          <meshStandardMaterial color={appearance.skinTone} roughness={0.8} />
        </mesh>
        <RoundedBox
          castShadow
          position={[0, -0.015, 0]}
          args={[0.34, 0.14, 0.25]}
          radius={0.05}
          smoothness={2}
        >
          <meshStandardMaterial color={appearance.pantsColor} roughness={0.95} map={fabric} />
        </RoundedBox>
        {[-1, 1].map((side) => (
          <group key={side}>
            <RoundedBox
              position={[side * 0.1, 0.24, 0.19]}
              args={[0.1, 0.12, 0.022]}
              radius={0.012}
              smoothness={2}
            >
              <meshStandardMaterial color={appearance.shirtColor} roughness={1} map={fabric} />
            </RoundedBox>
            <mesh position={[side * 0.1, 0.295, 0.208]}>
              <boxGeometry args={[0.105, 0.018, 0.015]} />
              <meshStandardMaterial color={appearance.accessoryColor} roughness={1} />
            </mesh>
            <mesh position={[side * 0.18, 0.38, 0.08]} rotation={[0, 0, side * 0.15]}>
              <boxGeometry args={[0.012, 0.22, 0.012]} />
              <meshStandardMaterial color="#e8dec7" roughness={1} />
            </mesh>
          </group>
        ))}

        <RoundedBox
          castShadow
          position={[0, 0.3, -0.225]}
          args={[0.32, 0.38, 0.17]}
          radius={0.045}
          smoothness={2}
        >
          <meshStandardMaterial
            color={appearance.accessoryColor}
            roughness={0.95}
            map={fabric}
            bumpMap={fabric}
            bumpScale={0.006}
          />
        </RoundedBox>
        <RoundedBox
          castShadow
          position={[0, 0.25, -0.325]}
          args={[0.22, 0.15, 0.06]}
          radius={0.02}
          smoothness={2}
        >
          <meshStandardMaterial color={appearance.shirtColor} roughness={0.85} />
        </RoundedBox>
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.145, 0.31, 0.155]} rotation={[0, 0, side * -0.11]}>
              <boxGeometry args={[0.038, 0.37, 0.028]} />
              <meshStandardMaterial color={appearance.accessoryColor} roughness={0.9} />
            </mesh>
            <mesh position={[side * 0.143, 0.23, 0.177]}>
              <boxGeometry args={[0.05, 0.05, 0.012]} />
              <meshStandardMaterial color="#d9d5bb" metalness={0.65} roughness={0.32} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.28, 0.2]}>
          <boxGeometry args={[0.012, 0.33, 0.012]} />
          <meshStandardMaterial color="#e9d7bd" roughness={0.8} />
        </mesh>
        <mesh position={[0.035, 0.34, 0.202]}>
          <boxGeometry args={[0.018, 0.04, 0.012]} />
          <meshStandardMaterial color="#f9ecd2" metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.56, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.125, 0.043, 8, 20]} />
          <meshStandardMaterial color={appearance.accessoryColor} roughness={0.9} />
        </mesh>
        <mesh castShadow position={[-0.07, 0.47, 0.185]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.085, 0.18, 0.03]} />
          <meshStandardMaterial color={appearance.accessoryColor} roughness={0.9} />
        </mesh>

        <Arm
          fabric={fabric}
          color={appearance.shirtColor}
          limbRef={leftArmRef}
          position={[-0.255, 0.47, 0]}
          side="left"
          skinTone={appearance.skinTone}
        >
          {leftHand}
        </Arm>
        <Arm
          fabric={fabric}
          color={appearance.shirtColor}
          limbRef={rightArmRef}
          position={[0.255, 0.47, 0]}
          side="right"
          skinTone={appearance.skinTone}
        >
          {rightHand}
        </Arm>

        <group position={[0, 0.82, 0]} scale={[0.88, 1, 0.88]}>
          <mesh castShadow>
            <sphereGeometry args={[0.22, 18, 13]} />
            <meshStandardMaterial color={appearance.skinTone} roughness={0.72} />
          </mesh>
          <Hair appearance={appearance} />
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh castShadow position={[side * 0.215, -0.015, 0]} scale={[0.6, 1, 0.8]}>
                <sphereGeometry args={[0.065, 8, 6]} />
                <meshStandardMaterial color={appearance.skinTone} roughness={0.8} />
              </mesh>
              <mesh position={[side * 0.072, 0.025, 0.204]} scale={[0.85, 1.08, 0.45]}>
                <sphereGeometry args={[0.034, 11, 8]} />
                <meshStandardMaterial color="#fff9e8" roughness={0.6} />
              </mesh>
              <mesh position={[side * 0.072, 0.023, 0.217]} scale={[0.82, 1, 0.2]}>
                <sphereGeometry args={[0.02, 10, 7]} />
                <meshStandardMaterial color="#342b27" roughness={0.3} />
              </mesh>
              <mesh position={[side * 0.072 - 0.006, 0.032, 0.223]}>
                <sphereGeometry args={[0.006, 8, 6]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh
                position={[side * 0.077, 0.092, 0.191]}
                rotation={[0, 0, Math.PI / 2 + side * -0.12]}
              >
                <capsuleGeometry args={[0.012, 0.049, 2, 8]} />
                <meshStandardMaterial color={appearance.hairColor} />
              </mesh>
              <mesh position={[side * 0.125, -0.055, 0.177]} scale={[1, 0.5, 0.2]}>
                <sphereGeometry args={[0.036, 8, 6]} />
                <meshStandardMaterial color="#d88d7b" transparent opacity={0.42} />
              </mesh>
            </group>
          ))}
          <mesh castShadow position={[0, -0.02, 0.221]} scale={[0.7, 0.7, 1]}>
            <sphereGeometry args={[0.038, 8, 6]} />
            <meshStandardMaterial color={appearance.skinTone} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, -0.115, 0.025]} scale={[0.76, 0.75, 0.85]}>
            <sphereGeometry args={[0.15, 13, 10]} />
            <meshStandardMaterial color={appearance.skinTone} roughness={0.82} />
          </mesh>
          <mesh position={[0, 0.015, 0.205]} scale={[0.6, 1.4, 0.6]}>
            <sphereGeometry args={[0.026, 9, 7]} />
            <meshStandardMaterial color={appearance.skinTone} roughness={0.8} />
          </mesh>
          {[-1, 1].flatMap((side) =>
            [0, 1, 2].map((i) => (
              <mesh
                key={`${side}-${i}`}
                position={[side * (0.105 + i * 0.014), -0.035 + (i % 2) * 0.016, 0.194 - i * 0.009]}
              >
                <sphereGeometry args={[0.0035, 8, 6]} />
                <meshStandardMaterial color={appearance.hairColor} transparent opacity={0.38} />
              </mesh>
            )),
          )}
          {[-0.12, -0.045, 0.03, 0.105].map((x) => (
            <mesh
              key={x}
              castShadow
              position={[x, 0.135 - Math.abs(x) * 0.25, 0.145]}
              rotation={[0.35, 0, -0.4]}
              scale={[1, 1.4, 0.65]}
            >
              <sphereGeometry args={[0.065, 8, 6]} />
              <meshStandardMaterial color={appearance.hairColor} roughness={0.95} />
            </mesh>
          ))}
          <mesh position={[0, -0.055, 0.215]} scale={[1, 0.45, 0.35]}>
            <sphereGeometry args={[0.035, 8, 6]} />
            <meshStandardMaterial color="#9f4f54" roughness={0.65} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
