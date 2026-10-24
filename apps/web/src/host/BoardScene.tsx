import { defaultBoard } from "@party-board/board"
import type { GameState } from "@party-board/protocol"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"

import { BoardTile } from "./BoardTile"
import { CharacterModel } from "./CharacterModel"
import { DiceView } from "./DiceView"
import { WorldEnvironment } from "./WorldEnvironment"

type BoardSceneProps = {
  state: GameState
  movingPlayerId: string | null
}

function CameraRig({ focus }: { focus: readonly [number, number, number] }) {
  const { camera } = useThree()
  const lookTarget = useRef(new THREE.Vector3(focus[0] - 1.7, 0.45, focus[2] - 2.2))

  useFrame((_, delta) => {
    const smoothing = 1 - Math.exp(-delta * 3.2)
    const desiredPosition = new THREE.Vector3(focus[0] + 3.7, 8.8, focus[2] + 12.8)
    const desiredLook = new THREE.Vector3(focus[0] - 1.7, 0.45, focus[2] - 2.2)
    camera.position.lerp(desiredPosition, smoothing)
    lookTarget.current.lerp(desiredLook, smoothing)
    camera.lookAt(lookTarget.current)
  })

  return null
}

function Scene({ state, movingPlayerId }: BoardSceneProps) {
  const tileMap = new Map(defaultBoard.tiles.map((tile) => [tile.id, tile]))
  const activePlayer = state.players.find((player) => player.id === state.currentPlayerId)
  const focusTile =
    tileMap.get(activePlayer?.tileId ?? defaultBoard.startingTileId) ?? defaultBoard.tiles[0]!
  const dicePosition = [focusTile.position[0] + 2.35, 1.38, focusTile.position[2] - 0.2] as const
  const pathCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        defaultBoard.tiles.map(
          (tile) => new THREE.Vector3(tile.position[0], -0.16, tile.position[2]),
        ),
        false,
        "centripetal",
      ),
    [],
  )

  return (
    <>
      <CameraRig focus={focusTile.position} />
      <fog attach="fog" args={["#94d9f0", 13, 29]} />
      <hemisphereLight color="#dff6ff" groundColor="#4d7d42" intensity={2.2} />
      <ambientLight intensity={0.7} />
      <directionalLight
        castShadow
        color="#fff4d1"
        intensity={3.8}
        position={[-7, 14, 9]}
        shadow-mapSize-height={2048}
        shadow-mapSize-width={2048}
      />
      <WorldEnvironment />

      <mesh receiveShadow scale={[1, 0.16, 1]}>
        <tubeGeometry args={[pathCurve, 160, 0.62, 10, true]} />
        <meshStandardMaterial color="#cbbd9f" roughness={0.88} />
      </mesh>

      <mesh receiveShadow position={[dicePosition[0], 0.08, dicePosition[2]]}>
        <cylinderGeometry args={[1.45, 1.65, 0.3, 32]} />
        <meshStandardMaterial color="#e1d2b5" roughness={0.8} />
      </mesh>

      {defaultBoard.tiles.map((tile) => (
        <BoardTile
          key={tile.id}
          tile={tile}
          active={tile.id === activePlayer?.tileId}
          start={tile.id === defaultBoard.startingTileId}
        />
      ))}

      {state.players.map((player, index) => {
        const tile = tileMap.get(player.tileId) ?? tileMap.get(defaultBoard.startingTileId)
        if (!tile) return null

        return (
          <CharacterModel
            key={player.id}
            active={player.id === state.currentPlayerId}
            color={player.color}
            moving={player.id === movingPlayerId}
            playerIndex={index}
            position={tile.position}
          />
        )
      })}

      <DiceView
        position={dicePosition}
        value={state.lastRoll}
        rolling={state.phase === "ROLLING"}
      />
    </>
  )
}

export function BoardScene(props: BoardSceneProps) {
  return (
    <Canvas
      className="board-canvas"
      camera={{ position: [3.7, 8.8, 20.8], fov: 42, near: 0.1, far: 72 }}
      dpr={[1, 1.75]}
      shadows="basic"
    >
      <color attach="background" args={["#83d2ed"]} />
      <Scene {...props} />
    </Canvas>
  )
}
