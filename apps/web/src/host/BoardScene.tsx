import { defaultBoard } from "@party-board/board"
import type { GameState } from "@party-board/protocol"
import { Canvas, useThree } from "@react-three/fiber"
import { useEffect } from "react"
import * as THREE from "three"

import { BoardTile } from "./BoardTile"
import { DiceView } from "./DiceView"
import { PlayerPiece } from "./PlayerPiece"

type BoardSceneProps = {
  state: GameState
  movingPlayerId: string | null
}

function CameraRig() {
  const { camera } = useThree()

  useEffect(() => {
    camera.lookAt(new THREE.Vector3(0, 0, 0))
  }, [camera])

  return null
}

function Scene({ state, movingPlayerId }: BoardSceneProps) {
  const tileMap = new Map(defaultBoard.tiles.map((tile) => [tile.id, tile]))
  const activePlayer = state.players.find((player) => player.id === state.currentPlayerId)

  return (
    <>
      <CameraRig />
      <fog attach="fog" args={["#070b17", 16, 30]} />
      <ambientLight intensity={1.2} />
      <directionalLight
        castShadow
        color="#dce9ff"
        intensity={3.2}
        position={[4, 12, 8]}
        shadow-mapSize-height={2048}
        shadow-mapSize-width={2048}
      />
      <pointLight color="#785cff" intensity={20} position={[-7, 3, -3]} distance={14} />
      <pointLight color="#31dce2" intensity={18} position={[7, 3, 3]} distance={14} />

      <mesh receiveShadow position={[0, -0.47, 0]}>
        <cylinderGeometry args={[5.3, 5.8, 0.42, 48]} />
        <meshStandardMaterial color="#101831" metalness={0.42} roughness={0.58} />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
        <circleGeometry args={[26, 64]} />
        <meshStandardMaterial color="#050814" roughness={0.95} />
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
          <PlayerPiece
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
      camera={{ position: [0, 11.5, 14.5], fov: 38, near: 0.1, far: 60 }}
      dpr={[1, 1.75]}
      shadows="basic"
    >
      <color attach="background" args={["#070b17"]} />
      <Scene {...props} />
    </Canvas>
  )
}
