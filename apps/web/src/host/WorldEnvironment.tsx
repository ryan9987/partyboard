import { defaultBoard } from "@party-board/board"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"

import {
  MeadowGround,
  MeadowPlanting,
  TrailLandmarks,
  WoodlandTree,
  WoodlandUnderstory,
} from "./WoodlandDetails"

const CLOUD_PUFFS = [
  [-0.75, 0, 0, 0.58],
  [0, 0.18, 0, 0.82],
  [0.78, 0, 0, 0.62],
  [0.1, -0.12, 0.2, 0.72],
] as const

const ROUTE_CENTER_Z =
  ((defaultBoard.tiles[0]?.position[2] ?? 0) + (defaultBoard.tiles.at(-1)?.position[2] ?? 0)) / 2

const START_LETTERS = [
  ["111", "100", "111", "001", "111"],
  ["111", "010", "010", "010", "010"],
  ["010", "101", "111", "101", "101"],
  ["110", "101", "110", "101", "101"],
  ["111", "010", "010", "010", "010"],
] as const

function Tree({ position, scale }: { position: readonly [number, number]; scale: number }) {
  return <WoodlandTree position={position} scale={scale} />
}

function Shrub({ position, tint }: { position: readonly [number, number]; tint: string }) {
  return (
    <group position={[position[0], 0.08, position[1]]}>
      {(
        [
          [-0.22, 0.16, 0, 0.34],
          [0.2, 0.17, 0.04, 0.3],
          [0, 0.34, -0.05, 0.38],
        ] as const
      ).map(([x, y, z, scale], index) => (
        <mesh castShadow key={index} position={[x, y, z]} scale={scale}>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={index === 2 ? tint : "#348b4f"} roughness={0.94} />
        </mesh>
      ))}
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

function StartLabel() {
  return (
    <group position={[0, 2.05, 0.13]}>
      {START_LETTERS.flatMap((rows, letterIndex) =>
        rows.flatMap((row, rowIndex) =>
          [...row].map((cell, columnIndex) =>
            cell === "1" ? (
              <mesh
                key={`${letterIndex}-${rowIndex}-${columnIndex}`}
                position={[
                  (letterIndex - 2) * 0.34 + (columnIndex - 1) * 0.072,
                  (2 - rowIndex) * 0.072,
                  0,
                ]}
              >
                <boxGeometry args={[0.058, 0.058, 0.03]} />
                <meshStandardMaterial color="#713f26" roughness={0.62} />
              </mesh>
            ) : null,
          ),
        ),
      )}
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
      <StartLabel />
      {[-0.72, 0.72].map((x, index) => (
        <group key={x} position={[x, 2.48, 0]}>
          <mesh castShadow position={[0, 0.26, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.55, 6]} />
            <meshStandardMaterial color="#5a3724" roughness={0.9} />
          </mesh>
          <mesh castShadow position={[index === 0 ? 0.13 : -0.13, 0.42, 0]}>
            <boxGeometry args={[0.28, 0.2, 0.035]} />
            <meshStandardMaterial color={index === 0 ? "#6ce3ea" : "#ff6f7d"} roughness={0.7} />
          </mesh>
        </group>
      ))}
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
      <MeadowGround />
      <MeadowPlanting />
      <TrailLandmarks />
      <WoodlandUnderstory />
      {[-1, 1].flatMap((side) =>
        [0, 1, 2].map((index) => (
          <Tree
            key={`horizon-${side}-${index}`}
            position={[side * (4.5 + (index % 2) * 2.5), -53 - index * 7]}
            scale={1.05 + index * 0.08}
          />
        )),
      )}

      {decorations.map(({ flowerColor, side, tile }, index) => (
        <group key={tile.id}>
          {index % 2 === 0 && (
            <Tree
              position={[tile.position[0] + side * (4.25 + (index % 3) * 0.45), tile.position[2]]}
              scale={0.78 + (index % 5) * 0.07}
            />
          )}
          {index % 3 === 0 && (
            <Tree
              position={[tile.position[0] - side * 5.4, tile.position[2] - 1.2]}
              scale={0.85 + (index % 4) * 0.12}
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
          {index % 4 === 1 && (
            <Shrub
              position={[tile.position[0] - side * 3.9, tile.position[2] - 0.5]}
              tint={index % 3 === 0 ? "#4cb86c" : "#2fa461"}
            />
          )}
          <group position={[tile.position[0] + side * 2.35, -0.08, tile.position[2] + 0.42]}>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.018, 0.025, 0.26, 6]} />
              <meshStandardMaterial color="#3c8d48" roughness={0.9} />
            </mesh>
            {index % 5 === 0 && (
              <>
                <mesh castShadow position={[0.22, 0.12, 0.08]}>
                  <cylinderGeometry args={[0.035, 0.045, 0.22, 7]} />
                  <meshStandardMaterial color="#f4eee2" roughness={0.9} />
                </mesh>
                <mesh castShadow position={[0.22, 0.24, 0.08]} scale={[1, 0.55, 1]}>
                  <sphereGeometry args={[0.12, 10, 8]} />
                  <meshStandardMaterial color="#ef685f" roughness={0.76} />
                </mesh>
              </>
            )}
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
