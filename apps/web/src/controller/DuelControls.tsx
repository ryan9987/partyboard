import type { DuelState, GameState } from "@party-board/protocol"
import { useEffect, useState } from "react"
import type { ControllerClient } from "./controller-client"
import { getDuelGesture } from "./duel-motion"
import { useGameClock, useGameNow } from "../networking/gameClock"
import { GameTutorial } from "../host/GameTutorial"

export function DuelControls({
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
  const duel = state.duel!
  const fighter = duel.fighters.find((entry) => entry.playerId === playerId)
  const [readyAt, setReadyAt] = useState(0)
  const now = useGameNow(state.serverTime)
  const clock = useGameClock(state.serverTime)
  useEffect(() => {
    if (!motionEnabled || !client.canDuel()) return
    let lastMotion = 0
    const send = (action: "swing" | "guard") => {
      if (Date.now() - lastMotion < 950) return
      if (client.requestDuelAction(action)) {
        lastMotion = Date.now()
        setReadyAt(clock() + 900)
      }
    }
    const swing = (event: DeviceMotionEvent) => {
      const gesture = getDuelGesture(event)
      if (gesture) send(gesture)
    }
    const guard = (event: DeviceOrientationEvent) => {
      if (Math.abs(event.gamma ?? 0) > 40) send("guard")
    }
    window.addEventListener("devicemotion", swing)
    window.addEventListener("deviceorientation", guard)
    return () => {
      window.removeEventListener("devicemotion", swing)
      window.removeEventListener("deviceorientation", guard)
    }
  }, [client, clock, motionEnabled, duel.stage, duel.id, fighter?.playerId])
  const names = duel.fighters.map(
    (entry) => state.players.find((player) => player.id === entry.playerId)?.name ?? "Player",
  )
  const disabled = !client.canDuel() || now < readyAt
  const action = (kind: "swing" | "guard") => {
    if (client.requestDuelAction(kind)) setReadyAt(clock() + 900)
  }
  return (
    <section className="duel-controller" aria-label="Sword duel controller">
      <p className="duel-kicker">Woodland duel · first to two hits</p>
      <h2>
        {duel.stage === "intro"
          ? "Draw your sword"
          : duel.stage === "result"
            ? resultLabel(duel, playerId)
            : fighter
              ? "Swing. Parry. Win."
              : "Watch the duel"}
      </h2>
      <p>
        {names[0]}{" "}
        <strong>
          {duel.fighters[0].score} : {duel.fighters[1].score}
        </strong>{" "}
        {names[1]}
      </p>
      {fighter ? (
        <>
          {duel.stage === "intro" ? (
            <GameTutorial kind="duel" mode={motionEnabled ? "motion" : "touch"} />
          ) : duel.stage === "result" ? (
            <p role="status">
              {state.waitingForHost ? "Waiting for the host." : "Returning to the trail…"}
            </p>
          ) : (
            <>
              <p>
                {motionEnabled
                  ? "Swing gently to attack. Tilt sideways to guard. Wait for Ready between actions."
                  : "Tap Swing sword to attack, or Guard to block. Wait for Ready between actions."}
              </p>
              <div className="duel-controller__buttons">
                <button type="button" disabled={disabled} onClick={() => action("swing")}>
                  Swing sword
                </button>
                <button type="button" disabled={disabled} onClick={() => action("guard")}>
                  Guard
                </button>
              </div>
              <p role="status">{now < readyAt ? "Recovering…" : "Ready"}</p>
              <small>
                {motionEnabled
                  ? "Keep a firm grip and use small motions. Touch controls always work."
                  : "Watch the shared screen. Your buttons control the duel."}
              </small>
            </>
          )}
        </>
      ) : (
        <p>The rest of the trail is watching. Your board turn will resume after the duel.</p>
      )}
    </section>
  )
}

function resultLabel(duel: DuelState, playerId: string | null) {
  return !duel.winnerId
    ? "A draw!"
    : duel.winnerId === playerId
      ? "You win the space!"
      : duel.loserId === playerId
        ? `Back ${duel.penaltySpaces} spaces`
        : "Duel complete"
}
