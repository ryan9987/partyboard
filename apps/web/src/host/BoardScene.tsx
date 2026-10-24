import { defaultBoard } from "@party-board/board"
import type { GameState } from "@party-board/protocol"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react"
import * as THREE from "three"

import { BoardTiles } from "./BoardTile"
import { getCharacterOffset } from "./characterLayout"
import { CharacterModel } from "./CharacterModel"
import { DiceView } from "./DiceView"
import { DuelArena } from "./DuelArena"
import { createSurfaceTexture } from "./sceneryMaterials"
import { WorldEnvironment } from "./WorldEnvironment"
import { TrailMarkets } from "./MarketStall"
import { PotatoArena } from "./PotatoArena"
import { MinigameArena } from "./MinigameArena"
import { createMotionSample, sampleTrailMotion, type TrailMotion } from "./trailMotion"

const tileMap = new Map(defaultBoard.tiles.map((tile) => [tile.id, tile]))

type BoardSceneProps = {
  state: GameState
  movingPlayerId: string | null
  motion?: TrailMotion | null
  wrapFade?: RefObject<HTMLDivElement | null>
}

function CameraRig({ focus, market }: { focus: RefObject<THREE.Vector3>; market: boolean }) {
  const { camera } = useThree()
  const lookTarget = useRef(new THREE.Vector3(0, 1.05, 0))
  const scratchRef = useRef({
    position: new THREE.Vector3(),
    look: new THREE.Vector3(),
    previous: new THREE.Vector3(),
    initialized: false,
  })

  useFrame((_, delta) => {
    const scratch = scratchRef.current
    const smoothing = 1 - Math.exp(-delta * 4)
    const point = focus.current
    const desiredPosition = scratch.position.set(
      point.x + (market ? 5.2 : 2.75),
      market ? 4.4 : 6.1,
      point.z + (market ? 7.4 : 8.9),
    )
    const desiredLook = scratch.look.set(point.x + (market ? 1.4 : -1.15), 1.05, point.z - 0.8)
    if (!scratch.initialized || scratch.previous.distanceToSquared(point) > 225) {
      // Logical lap wrap: reframe rather than sweeping the camera through the whole world.
      camera.position.copy(desiredPosition)
      lookTarget.current.copy(desiredLook)
    } else {
      camera.position.lerp(desiredPosition, smoothing)
      lookTarget.current.lerp(desiredLook, smoothing)
    }
    scratch.previous.copy(point)
    scratch.initialized = true
    camera.lookAt(lookTarget.current)
  })

  return null
}

function TrailSunlight({ focus }: { focus: RefObject<THREE.Vector3> }) {
  const rigRef = useRef<THREE.Group>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  useFrame((_, delta) => {
    const rig = rigRef.current
    if (!rig) return
    const smoothing = 1 - Math.exp(-delta * 4)
    if (rig.position.distanceToSquared(focus.current) > 225) rig.position.copy(focus.current)
    rig.position.x = THREE.MathUtils.lerp(rig.position.x, focus.current.x, smoothing)
    rig.position.z = THREE.MathUtils.lerp(rig.position.z, focus.current.z, smoothing)
  })
  return (
    <group ref={rigRef}>
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

function Scene({ state, movingPlayerId, motion, wrapFade }: BoardSceneProps) {
  const pathTexture = useMemo(() => {
    const texture = createSurfaceTexture("stone")
    texture.repeat.set(80, 1)
    return texture
  }, [])
  useEffect(() => () => pathTexture.dispose(), [pathTexture])
  const activePlayer = state.players.find((player) => player.id === state.currentPlayerId)
  const activePlayerIndex = state.players.findIndex((player) => player.id === state.currentPlayerId)
  const focusTile =
    tileMap.get(activePlayer?.tileId ?? defaultBoard.startingTileId) ?? defaultBoard.tiles[0]!
  const focus = useRef(new THREE.Vector3())
  const sampleRef = useRef(createMotionSample())
  useFrame(() => {
    const sample = sampleRef.current
    if (motion) {
      sampleTrailMotion(motion, performance.now(), sample)
      focus.current.set(...sample.position)
    } else focus.current.set(...focusTile.position)
    if (wrapFade?.current) {
      const opacity = motion && sample.warping ? String(1 - sample.opacity) : "0"
      if (wrapFade.current.style.opacity !== opacity)
        wrapFade.current.style.setProperty("opacity", opacity)
    }
  }, -2)
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
      <CameraRig focus={focus} market={state.phase === "SHOP"} />
      <fog attach="fog" args={["#aed7e4", 17, 37]} />
      <hemisphereLight color="#e7f4ff" groundColor="#57643b" intensity={1.35} />
      <ambientLight intensity={0.25} />
      <TrailSunlight focus={focus} />
      <WorldEnvironment />
      <TrailMarkets focusZ={focusTile.position[2]} />

      <mesh receiveShadow scale={[1, 0.16, 1]}>
        <tubeGeometry args={[pathCurve, 160, 0.62, 10, false]} />
        <meshStandardMaterial map={pathTexture} roughness={0.95} />
      </mesh>

      <BoardTiles
        activeTileId={activePlayer?.tileId}
        startTileId={defaultBoard.startingTileId}
        tiles={defaultBoard.tiles}
      />

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
            motion={motion?.playerId === player.id ? motion : null}
          />
        )
      })}

      <DiceView
        position={dicePosition}
        value={state.lastRoll}
        rolling={state.phase === "ROLLING"}
        follow={focus}
        followOffset={[characterOffset[0], 3.05, characterOffset[2]]}
        tracking={!!motion}
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
      <Suspense fallback={null}>
        {props.state.phase === "MINIGAME" && props.state.minigame ? (
          <MinigameArena state={props.state} />
        ) : props.state.phase === "POTATO" && props.state.potato ? (
          <PotatoArena state={props.state} />
        ) : props.state.phase === "DUEL" && props.state.duel ? (
          <DuelArena state={props.state} />
        ) : (
          <Scene {...props} />
        )}
      </Suspense>
    </Canvas>
  )
}
