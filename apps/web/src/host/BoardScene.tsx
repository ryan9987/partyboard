import { defaultBoard } from "@party-board/board"
import type { GameState } from "@party-board/protocol"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import { BoardTile } from "./BoardTile"
import { getCharacterOffset } from "./characterLayout"
import { CharacterModel } from "./CharacterModel"
import { DiceView } from "./DiceView"
import { DuelArena } from "./DuelArena"
import { createSurfaceTexture } from "./sceneryMaterials"
import { WorldEnvironment } from "./WorldEnvironment"
import { TrailMarkets } from "./MarketStall"
import { PotatoArena } from "./PotatoArena"

type BoardSceneProps = {
  state: GameState
  movingPlayerId: string | null
}

function CameraRig({ focus }: { focus: readonly [number, number, number] }) {
  const { camera } = useThree()
  const lookTarget = useRef(new THREE.Vector3(focus[0] - 1.15, 1.05, focus[2] - 0.8))

  useFrame((_, delta) => {
    const smoothing = 1 - Math.exp(-delta * 4)
    const desiredPosition = new THREE.Vector3(focus[0] + 2.75, 6.1, focus[2] + 8.9)
    const desiredLook = new THREE.Vector3(focus[0] - 1.15, 1.05, focus[2] - 0.8)
    camera.position.lerp(desiredPosition, smoothing)
    lookTarget.current.lerp(desiredLook, smoothing)
    camera.lookAt(lookTarget.current)
  })

  return null
}

function TrailSunlight({ focus }: { focus: readonly [number, number, number] }) {
  const rigRef = useRef<THREE.Group>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  useFrame((_, delta) => {
    const rig = rigRef.current
    if (!rig) return
    const smoothing = 1 - Math.exp(-delta * 4)
    rig.position.x = THREE.MathUtils.lerp(rig.position.x, focus[0], smoothing)
    rig.position.z = THREE.MathUtils.lerp(rig.position.z, focus[2], smoothing)
  })
  return (
    <group ref={rigRef} position={[focus[0], 0, focus[2]]}>
      <primitive object={target} />
      <directionalLight
        castShadow
        target={target}
        color="#fff4d1"
        intensity={2.6}
        position={[-7, 14, 9]}
        shadow-mapSize-height={2048}
        shadow-mapSize-width={2048}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-far={55}
        shadow-bias={-0.0004}
        shadow-normalBias={0.035}
      />
    </group>
  )
}

function Scene({ state, movingPlayerId }: BoardSceneProps) {
  const stoneTexture = useMemo(() => createSurfaceTexture("stone"), [])
  useEffect(() => () => stoneTexture.dispose(), [stoneTexture])
  const pathTexture = useMemo(() => {
    const texture = stoneTexture.clone()
    texture.repeat.set(80, 1)
    return texture
  }, [stoneTexture])
  useEffect(() => () => pathTexture.dispose(), [pathTexture])
  const tileMap = new Map(defaultBoard.tiles.map((tile) => [tile.id, tile]))
  const activePlayer = state.players.find((player) => player.id === state.currentPlayerId)
  const activePlayerIndex = state.players.findIndex((player) => player.id === state.currentPlayerId)
  const focusTile =
    tileMap.get(activePlayer?.tileId ?? defaultBoard.startingTileId) ?? defaultBoard.tiles[0]!
  const characterOffset = getCharacterOffset(activePlayerIndex)
  const activeCharacterPosition = [
    focusTile.position[0] + characterOffset[0],
    focusTile.position[1],
    focusTile.position[2] + characterOffset[2],
  ] as const
  const dicePosition = [
    activeCharacterPosition[0],
    activeCharacterPosition[1] + 3.05,
    activeCharacterPosition[2],
  ] as const
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
      <fog attach="fog" args={["#aed7e4", 17, 37]} />
      <hemisphereLight color="#e7f4ff" groundColor="#57643b" intensity={1.35} />
      <ambientLight intensity={0.25} />
      <TrailSunlight focus={focusTile.position} />
      <WorldEnvironment />
      <TrailMarkets />

      <mesh receiveShadow scale={[1, 0.16, 1]}>
        <tubeGeometry args={[pathCurve, 160, 0.62, 10, false]} />
        <meshStandardMaterial map={pathTexture} roughness={0.95} />
      </mesh>

      {defaultBoard.tiles.map((tile) => (
        <BoardTile
          key={tile.id}
          tile={tile}
          active={tile.id === activePlayer?.tileId}
          start={tile.id === defaultBoard.startingTileId}
          texture={stoneTexture}
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
      shadows={{ type: THREE.PCFShadowMap }}
    >
      <color attach="background" args={["#aed7e4"]} />
      {props.state.phase === "POTATO" &&
      props.state.potato &&
      props.state.potato.stage !== "intro" ? (
        <PotatoArena state={props.state} />
      ) : props.state.phase === "DUEL" && props.state.duel && props.state.duel.stage !== "intro" ? (
        <DuelArena state={props.state} />
      ) : (
        <Scene {...props} />
      )}
    </Canvas>
  )
}
