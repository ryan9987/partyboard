import { defaultBoard } from "@party-board/board"
import type { GameState } from "@party-board/protocol"
import { Canvas, useThree } from "@react-three/fiber"
import { useEffect, useMemo } from "react"
import * as THREE from "three"

import { BoardTile } from "./BoardTile"
import { CharacterModel } from "./CharacterModel"
import { DiceView } from "./DiceView"
import { WorldEnvironment } from "./WorldEnvironment"

type BoardSceneProps = {
  state: GameState
  movingPlayerId: string | null
}

function CameraRig() {
  const { camera } = useThree()

  useEffect(() => {
    camera.lookAt(new THREE.Vector3(-1.6, 0.35, 0))
  }, [camera])

  return null
}

function Scene({ state, movingPlayerId }: BoardSceneProps) {
  const tileMap = new Map(defaultBoard.tiles.map((tile) => [tile.id, tile]))
  const activePlayer = state.players.find((player) => player.id === state.currentPlayerId)
  const pathCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        defaultBoard.tiles.map(
          (tile) => new THREE.Vector3(tile.position[0], -0.16, tile.position[2]),
        ),
        true,
        "centripetal",
      ),
    [],
  )

  return (
    <>
      <CameraRig />
      <fog attach="fog" args={["#94d9f0", 19, 36]} />
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

      <mesh receiveShadow position={[0, -0.08, 0]}>
        <cylinderGeometry args={[3.15, 3.45, 0.34, 48]} />
        <meshStandardMaterial color="#77bf67" roughness={0.92} />
      </mesh>
      <mesh receiveShadow position={[0, 0.12, 0]}>
        <cylinderGeometry args={[1.45, 1.65, 0.32, 32]} />
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

      <DiceView value={state.lastRoll} rolling={state.phase === "ROLLING"} />
    </>
  )
}

export function BoardScene(props: BoardSceneProps) {
  return (
    <Canvas
      className="board-canvas"
      camera={{ position: [0, 9.6, 17], fov: 39, near: 0.1, far: 70 }}
      dpr={[1, 1.75]}
      shadows="basic"
    >
      <color attach="background" args={["#83d2ed"]} />
      <Scene {...props} />
    </Canvas>
  )
}
