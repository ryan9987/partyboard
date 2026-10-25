import {
  MINIGAMES,
  RHYTHM_BEAT_MS,
  archeryDrift,
  FISHING_RULES,
  GAME_REWARDS,
  type GameState,
} from "@party-board/protocol"
import { useEffect, useRef, useState } from "react"
import type { ControllerClient } from "./controller-client"
import { getMinigameMotionReading } from "./duel-motion"
import { useGameClock, useGameNow } from "../networking/gameClock"
import { canFishingAct, createFishingFlickDetector } from "./fishing-motion"
import { GameTutorial } from "../host/GameTutorial"

export function MinigameControls({
  client,
  state,
  playerId,
  motionEnabled,
}: {
  client: ControllerClient
  state: GameState
  playerId: string | null
  motionEnabled: boolean
}) {
  const game = state.minigame!
  const index = game.players.findIndex((entry) => entry.playerId === playerId)
  const me = game.players[index]
  const axis = useRef(0)
  const neutral = useRef<number | null>(null)
  const lastFlick = useRef(0)
  const fishingFlick = useRef(createFishingFlickDetector())
  const tiltHoldUntil = useRef(0)
  const now = useGameNow(state.serverTime)
  const clock = useGameClock(state.serverTime)
  const [displayAxis, setDisplayAxis] = useState(0)
  const [usingTouch, setUsingTouch] = useState(!motionEnabled)
  const connection = client.getSnapshot()
  const active =
    game.stage === "active" &&
    !!me?.alive &&
    connection.connection === "connected" &&
    !connection.joining
  const info = MINIGAMES[game.kind]
  const touchControls = !motionEnabled || usingTouch
  useEffect(() => {
    const timer = window.setInterval(() => {
      setDisplayAxis(axis.current)
      if (active) client.minigameInput(axis.current)
    }, 100)
    return () => window.clearInterval(timer)
  }, [active, client, game.id])
  useEffect(() => {
    if ((!active && game.stage !== "intro") || !motionEnabled || usingTouch) return
    const motion = (event: DeviceMotionEvent) => {
      const fishing = game.kind === "fishing"
      const time = performance.now()
      const reading = getMinigameMotionReading(event, axis.current, neutral.current, fishing)
      if (fishing && reading.flick) tiltHoldUntil.current = time + 250
      if (!fishing || time >= tiltHoldUntil.current) axis.current = reading.axis
      neutral.current = reading.neutral
      if (fishing) {
        const edge = fishingFlick.current(event, time)
        const current = client
          .getSnapshot()
          .state?.minigame?.players.find((entry) => entry.playerId === playerId)
        if (active && edge && current && canFishingAct(current.status, current.actionAt, clock()))
          client.minigameInput(axis.current, true)
        return
      }
      if (
        active &&
        game.kind === "rhythm" &&
        reading.flick &&
        Date.now() - lastFlick.current > 400
      ) {
        lastFlick.current = Date.now()
        client.minigameInput(axis.current, true)
      }
    }
    window.addEventListener("devicemotion", motion)
    return () => window.removeEventListener("devicemotion", motion)
  }, [active, client, clock, motionEnabled, usingTouch, game.kind, game.stage, playerId])
  const elapsed = game.stage === "intro" ? 0 : Math.max(0, now - game.startsAt)
  const beat = (elapsed % RHYTHM_BEAT_MS) / RHYTHM_BEAT_MS
  const meter =
    game.kind === "balance"
      ? (me?.position ?? 0) / 1.3
      : game.kind === "archery"
        ? displayAxis + archeryDrift(elapsed)
        : displayAxis
  return (
    <section className="minigame-controller" aria-label={`${info.name} controller`}>
      <h2>{info.name}</h2>
      {game.stage === "active" && (
        <p>
          {game.kind === "fishing" && touchControls
            ? "Tap Cast line. Wait for REEL NOW, then tap again."
            : game.kind === "archery"
              ? "Aim at your target on the host. Tap to release."
              : info.instruction}
        </p>
      )}
      {game.stage === "result" ? (
        <h3>
          {game.winnerIds.includes(playerId ?? "")
            ? `You win · +${GAME_REWARDS.minigameWinner} coins`
            : `+${GAME_REWARDS.minigameParticipation} participation coin`}
        </h3>
      ) : game.stage === "intro" ? (
        <GameTutorial kind={game.kind} mode={touchControls ? "touch" : "motion"} />
      ) : !me ? (
        <p>You're spectating this round.</p>
      ) : !me.alive ? (
        <h3>You're out. Cheer them on!</h3>
      ) : (
        <>
          <div
            className={`control-meter${game.kind === "fishing" ? " control-meter--fishing" : ""}`}
            aria-label={game.kind === "rhythm" ? "Beat timing" : "Control position"}
          >
            <span
              className="control-meter-target"
              style={
                game.kind === "fishing"
                  ? {
                      left: `${50 - FISHING_RULES.maxCatchTilt * 45}%`,
                      width: `${FISHING_RULES.maxCatchTilt * 90}%`,
                    }
                  : undefined
              }
            />
            <span
              className="control-meter-marker"
              style={{
                left: `${50 + (game.kind === "rhythm" ? (beat < 0.5 ? beat * 2 : (beat - 1) * 2) : Math.max(-1, Math.min(1, meter))) * 45}%`,
              }}
            />
          </div>
          <p className="control-feedback" role="status">
            {game.kind === "fishing"
              ? {
                  ready: "Ready to cast",
                  casting: "Casting…",
                  waiting: "Watch the float…",
                  bite:
                    Math.abs(displayAxis) > FISHING_RULES.maxCatchTilt
                      ? touchControls
                        ? "Slide the meter into the green, then reel"
                        : "Center your phone, then reel"
                      : touchControls
                        ? "REEL NOW · tap Reel now!"
                        : "REEL NOW · lift once or tap",
                  caught: "Landed! Nice catch",
                  miss: touchControls
                    ? "It got away · center the slider and try again"
                    : "It got away · steady your phone and try again",
                  hit: "",
                  out: "",
                }[me.status]
              : game.kind === "balance"
                ? Math.abs(me.position) < 0.08
                  ? "Keep the marker centered"
                  : `${touchControls ? "Slide" : "Tilt"} ${me.position > 0 ? "left" : "right"} to stay on the log`
                : game.kind === "archery"
                  ? `${3 - me.attempts} ${me.attempts === 2 ? "arrow" : "arrows"} remaining`
                  : game.kind === "rhythm"
                    ? me.status === "hit"
                      ? "On the beat"
                      : me.status === "miss"
                        ? "Find the rhythm"
                        : "Follow the beat"
                    : "Ready"}
          </p>
          {motionEnabled && (
            <button
              className="control-mode"
              type="button"
              onClick={() => {
                if (usingTouch) {
                  neutral.current = null
                  axis.current = 0
                  setDisplayAxis(0)
                }
                setUsingTouch(!usingTouch)
              }}
            >
              {usingTouch ? "Using touch · switch to motion" : "Using motion · switch to touch"}
            </button>
          )}
          {game.kind !== "rhythm" && (
            <label className="tilt-control">
              {game.kind === "archery" ? "Aim" : game.kind === "fishing" ? "Line tension" : "Tilt"}
              <input
                aria-label="Tilt control"
                type="range"
                min="-1"
                max="1"
                step="0.02"
                value={displayAxis}
                disabled={!active}
                onChange={(event) => {
                  axis.current = Number(event.target.value)
                  setUsingTouch(true)
                  setDisplayAxis(axis.current)
                  client.minigameInput(axis.current)
                }}
              />
            </label>
          )}
          {["archery", "fishing", "rhythm"].includes(game.kind) && (
            <button
              className={`controller-roll${game.kind === "fishing" && me.status === "bite" ? " controller-roll--bite" : ""}`}
              disabled={
                !active ||
                (game.kind === "archery" && me.attempts >= 3) ||
                (game.kind === "fishing" &&
                  (!canFishingAct(me.status, me.actionAt, now) ||
                    (me.status === "bite" &&
                      Math.abs(displayAxis) > FISHING_RULES.maxCatchTilt))) ||
                now - me.actionAt < (game.kind === "archery" ? 900 : 350)
              }
              onClick={() => client.minigameInput(axis.current, true)}
            >
              {game.kind === "fishing"
                ? me.status === "bite"
                  ? "Reel now!"
                  : me.status === "casting" || me.status === "waiting"
                    ? "Wait for a bite…"
                    : me.status === "caught" && now - me.actionAt < FISHING_RULES.resultHoldMs
                      ? "Fish caught!"
                      : me.status === "miss" && now - me.actionAt < FISHING_RULES.resultHoldMs
                        ? "Try again shortly"
                        : "Cast line"
                : info.action}
            </button>
          )}
          {motionEnabled && !usingTouch && (
            <button
              className="recenter-button"
              onClick={() => {
                neutral.current = null
                axis.current = 0
                setDisplayAxis(0)
              }}
            >
              Recenter phone
            </button>
          )}
        </>
      )}
      {game.stage === "active" && (
        <details className="motion-guide-help">
          <summary>How to play · {touchControls ? "touch" : "motion"}</summary>
          <GameTutorial kind={game.kind} mode={touchControls ? "touch" : "motion"} />
        </details>
      )}
    </section>
  )
}
