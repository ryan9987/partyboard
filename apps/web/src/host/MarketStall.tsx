import { defaultBoard, SHOP_TILE_IDS } from "@party-board/board"
import { useEffect, useMemo } from "react"
import * as THREE from "three"
import { RoundedBox } from "@react-three/drei"
import { CharacterModel } from "./CharacterModel"
import { createSurfaceTexture } from "./sceneryMaterials"

function marketSign() {
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 160
  const context = canvas.getContext("2d")!
  context.fillStyle = "#eee2c1"
  context.fillRect(0, 0, 512, 160)
  context.strokeStyle = "#8e7549"
  context.lineWidth = 4
  context.strokeRect(12, 12, 488, 136)
  context.textAlign = "center"
  context.fillStyle = "#344f3b"
  context.font = "42px Georgia"
  context.fillText("WILDWOOD", 256, 77)
  context.font = "18px sans-serif"
  context.fillText("TRAIL GOODS · EST. TODAY", 256, 117)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function MarketProduct({ index }: { index: number }) {
  if (index === 1)
    return (
      <group scale={0.8}>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.08, -0.04, 0]}>
            <RoundedBox castShadow args={[0.12, 0.16, 0.13]} radius={0.025} smoothness={3}>
              <meshStandardMaterial color="#89613e" roughness={0.95} />
            </RoundedBox>
            <RoundedBox
              castShadow
              position={[0, -0.08, 0.055]}
              args={[0.13, 0.08, 0.23]}
              radius={0.025}
              smoothness={3}
            >
              <meshStandardMaterial color="#9e7346" roughness={0.9} />
            </RoundedBox>
            <mesh position={[0, -0.12, 0.055]}>
              <boxGeometry args={[0.14, 0.02, 0.24]} />
              <meshStandardMaterial color="#443c30" />
            </mesh>
            {[0.01, 0.045].map((y) => (
              <mesh key={y} position={[0, y, 0.069]}>
                <boxGeometry args={[0.08, 0.008, 0.012]} />
                <meshStandardMaterial color="#dfca8e" />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    )
  if (index === 2)
    return (
      <group position={[0, 0.02, 0]} rotation={[-0.25, 0, 0.12]}>
        <mesh castShadow scale={[0.85, 1.25, 0.22]}>
          <sphereGeometry args={[0.16, 24, 16]} />
          <meshStandardMaterial color="#608150" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.039]}>
          <boxGeometry args={[0.014, 0.3, 0.008]} />
          <meshStandardMaterial color="#d6bf77" metalness={0.4} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.055, 0.03, 0.035]} rotation={[0, 0, side * 0.8]}>
            <boxGeometry args={[0.008, 0.12, 0.008]} />
            <meshStandardMaterial color="#b6c388" />
          </mesh>
        ))}
      </group>
    )
  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[0.095, 0.12, 0.19, 20]} />
        <meshPhysicalMaterial
          color="#a8dce0"
          transparent
          opacity={0.85}
          roughness={0.2}
          metalness={0.15}
        />
      </mesh>
      <mesh castShadow position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.04, 0.055, 0.08, 16]} />
        <meshStandardMaterial color="#abd4d2" />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.043, 0.043, 0.04, 12]} />
        <meshStandardMaterial color="#997745" />
      </mesh>
      <mesh position={[0, 0, 0.115]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.07, 0.07, 0.012]} />
        <meshStandardMaterial color="#f6f1ce" />
      </mesh>
    </group>
  )
}

function Stall({ position }: { position: readonly [number, number, number] }) {
  const sign = useMemo(() => marketSign(), [])
  const wood = useMemo(() => createSurfaceTexture("bark"), [])
  useEffect(
    () => () => {
      sign.dispose()
      wood.dispose()
    },
    [sign, wood],
  )
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
          <mesh castShadow position={[0, 0.05, 0.71]}>
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
          <meshStandardMaterial color="#c8ac7a" map={wood} roughness={0.95} />
        </mesh>
      ))}
      <CharacterModel
        centered
        active={false}
        color="gold"
        moving={false}
        playerIndex={0}
        position={[0, -0.26, 0.1]}
        appearance={{
          skinTone: "#a47152",
          hairColor: "#c6c4ad",
          hairStyle: "short",
          shirtColor: "#e5d6b0",
          pantsColor: "#4d6044",
          shoeColor: "#5b4633",
          accessoryColor: "#6d8554",
        }}
      />
      <RoundedBox
        castShadow
        position={[0, 0.37, 0.58]}
        args={[0.7, 0.32, 0.04]}
        radius={0.03}
        smoothness={3}
      >
        <meshStandardMaterial map={sign} roughness={0.9} />
      </RoundedBox>
      {[-0.85, 0.85].map((x) => (
        <mesh key={`rail-${x}`} castShadow position={[x, 0.34, 0.58]}>
          <boxGeometry args={[0.025, 0.58, 0.025]} />
          <meshStandardMaterial color="#dac99c" roughness={0.95} />
        </mesh>
      ))}
      {[-0.4, 0.4].map((y) => (
        <mesh key={`trim-${y}`} position={[0, 0.35 + y * 0.65, 0.59]}>
          <boxGeometry args={[2.07, 0.035, 0.03]} />
          <meshStandardMaterial color="#d2b47e" />
        </mesh>
      ))}
      {[-0.65, 0, 0.65].map((x, index) => (
        <group key={x} position={[x, 0.85, 0.25]}>
          <MarketProduct index={index} />
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
      {[-0.2, 0.2].map((z) => (
        <mesh key={z} position={[-1.25, 0.25, z - 0.1]} rotation={[0, 0, z > 0 ? 0.6 : -0.6]}>
          <boxGeometry args={[0.05, 0.52, 0.025]} />
          <meshStandardMaterial color="#c29e65" />
        </mesh>
      ))}
      <group position={[1.28, 0.25, -0.22]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.24, 0.22, 0.55, 18]} />
          <meshStandardMaterial map={wood} color="#cbb282" roughness={0.95} />
        </mesh>
        {[-0.17, 0.17].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.235, 0.025, 8, 20]} />
            <meshStandardMaterial color="#616c5d" metalness={0.6} roughness={0.6} />
          </mesh>
        ))}
        <mesh position={[0, 0.29, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.22, 18]} />
          <meshStandardMaterial color="#b4935c" />
        </mesh>
      </group>
      <group position={[-0.95, 1.52, 0.47]}>
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.24, 0.16]} />
          <meshPhysicalMaterial
            color="#d6bd79"
            emissive="#e4bb65"
            emissiveIntensity={0.3}
            transparent
            opacity={0.8}
            roughness={0.5}
          />
        </mesh>
        {[-0.1, 0.1].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <boxGeometry args={[0.2, 0.035, 0.2]} />
            <meshStandardMaterial color="#545e4b" metalness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 0.18, 0]}>
          <torusGeometry args={[0.045, 0.009, 8, 16]} />
          <meshStandardMaterial color="#545e4b" />
        </mesh>
      </group>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh
          key={i}
          castShadow
          position={[0.4 + i * 0.055, 0.78 + (i % 2) * 0.018, 0.45]}
          rotation={[0, 0, i * 0.2]}
        >
          <cylinderGeometry args={[0.045, 0.045, 0.015, 16]} />
          <meshStandardMaterial color="#cead55" metalness={0.65} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 1.62, -0.43]}>
        <boxGeometry args={[1.25, 0.4, 0.04]} />
        <meshStandardMaterial map={sign} roughness={0.9} />
      </mesh>
      <mesh position={[0.86, 1.62, -0.39]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.14, 0.14, 0.03]} />
        <meshStandardMaterial color="#b18c43" metalness={0.4} />
      </mesh>
    </group>
  )
}

export function TrailMarkets({ focusZ }: { focusZ: number }) {
  return (
    <>
      {defaultBoard.tiles
        .filter(
          (tile) => SHOP_TILE_IDS.includes(tile.id) && Math.abs(tile.position[2] - focusZ) < 22,
        )
        .map((tile) => (
          <Stall key={tile.id} position={tile.position} />
        ))}
    </>
  )
}
