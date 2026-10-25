import { PLAYER_COLORS, MINIGAMES } from "@party-board/protocol"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"

import {
  createShakeDetector,
  requestMotionPermission,
  type MotionPermissionStatus,
} from "@party-board/motion"
import { createGameSocket } from "../networking/socket"
import { ControllerClient } from "./controller-client"
import { DuelControls } from "./DuelControls"
import { PartyControls } from "./PartyControls"
import { MinigameControls } from "./MinigameControls"
import { PowerupNotice } from "../app/PowerupNotice"
import { CoinCount } from "../app/CoinCount"
import { PhoneMotionGuide } from "../app/PhoneMotionGuide"
import { playerEffectLabels } from "../app/playerEffects"
import { PlayerPortrait } from "../app/PlayerPortrait"
import "./controller.css"

function initialRoom(): string {
  const suffix = window.location.pathname.split("/")[2]
  return (suffix || new URLSearchParams(window.location.search).get("room") || "").toUpperCase()
}

export default function ControllerPage() {
  // A missing server URL should yield a readable screen, including the Roll fallback.
  const [client] = useState(() => {
    try {
      const slot = new URLSearchParams(window.location.search).get("slot")
      const prefix = import.meta.env.DEV && slot && /^[1-4]$/.test(slot) ? `rehearsal:${slot}:` : ""
      const storage = {
        getItem: (key: string) => window.localStorage.getItem(prefix + key),
        setItem: (key: string, value: string) => window.localStorage.setItem(prefix + key, value),
      }
      return new ControllerClient(createGameSocket(), storage, initialRoom())
    } catch {
      return null
    }
  })
  if (!client)
    return (
      <main className="controller-page">
        <h1>Party Board</h1>
        <p role="alert">
          The game connection is not configured. Ask the host to check the server address.
        </p>
        <button type="button" disabled>
          Roll
        </button>
      </main>
    )
  return <ConnectedController client={client} />
}

function ConnectedController({ client }: { client: ControllerClient }) {
  const view = useSyncExternalStore(client.subscribe, client.getSnapshot)
  const [roomCode, setRoomCode] = useState(initialRoom)
  const [name, setName] = useState("")
  const [color, setColor] = useState<(typeof PLAYER_COLORS)[number]>("coral")
  const [permission, setPermission] = useState<MotionPermissionStatus | "off">("off")
  const [requestingPermission, setRequestingPermission] = useState(false)
  const detector = useRef<ReturnType<typeof createShakeDetector> | null>(null)
  const canRoll = client.canRoll()

  useEffect(() => {
    client.start()
    return () => client.stop()
  }, [client])
  useEffect(() => {
    if (permission !== "enabled" || !canRoll) return
    const current = createShakeDetector({
      onShake: () => {
        current.stop()
        client.requestRoll()
      },
    })
    detector.current = current
    current.start()
    return () => {
      current.stop()
      detector.current = null
    }
  }, [client, permission, canRoll, view.state?.turnNumber])

  const me = view.state?.players.find((player) => player.id === view.playerId)
  useEffect(() => {
    if (view.playerId && document.activeElement instanceof HTMLElement)
      document.activeElement.blur()
  }, [view.playerId])
  const active = view.state?.players.find((player) => player.id === view.state?.currentPlayerId)
  const winner = view.state?.players.find((player) => player.id === view.state?.winnerId)
  const finished = view.state?.phase === "FINISHED"
  const setup =
    view.state?.phase === "LOBBY" ||
    view.state?.minigame?.stage === "intro" ||
    view.state?.duel?.stage === "intro" ||
    view.state?.potato?.stage === "intro"
  const enableMotion = async () => {
    if (permission === "enabled") {
      setPermission("off")
      return
    }
    setRequestingPermission(true)
    try {
      setPermission(await requestMotionPermission())
    } finally {
      setRequestingPermission(false)
    }
  }
  const inActivity = ["DUEL", "SHOP", "POTATO", "MINIGAME"].includes(view.state?.phase ?? "")
  let headline = "Join the table"
  if (me) {
    if (view.connection !== "connected") headline = "Reconnecting…"
    else if (finished)
      headline = winner?.id === me.id ? "Trail champion!" : `${winner?.name ?? "The leader"} wins!`
    else if (view.state?.phase === "LOBBY") headline = "You're in!"
    else if (view.state?.phase === "DUEL") headline = "Sword duel"
    else if (view.state?.phase === "SHOP") headline = "Wildwood Market"
    else if (view.state?.phase === "POTATO") headline = "Hot Potato"
    else if (view.state?.minigame) headline = MINIGAMES[view.state.minigame.kind].name
    else if (view.pendingItem) headline = "Using your power-up…"
    else if (view.choosingItem) headline = "Choose a power-up"
    else if (canRoll) headline = "Your turn!"
    else if (view.pending) headline = "Roll submitted"
    else if (active) headline = `${active.name}'s turn`
    else headline = "Waiting for players"
  }

  return (
    <main className={`controller-page${inActivity ? " controller-page--activity" : ""}`}>
      <header>
        <div className="controller-brand">
          <span>
            <img src="/favicon.svg" alt="" width="28" height="28" />
            Partyboard
          </span>
          <small>{view.connection === "connected" ? "Connected" : "Reconnecting"}</small>
        </div>
        {!inActivity && <h1>{headline}</h1>}
      </header>
      {view.error && (
        <p role="alert" className="controller-error">
          {view.error}
        </p>
      )}
      {me && view.connection !== "connected" && !view.error && (
        <p className="controller-error" role="status">
          Reconnecting · keep this screen open.
        </p>
      )}
      {!me ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            client.join({ roomCode, name, color })
          }}
        >
          <label>
            Room code
            <input
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={4}
              required
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            />
          </label>
          <label>
            Your name
            <input
              autoComplete="nickname"
              maxLength={20}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            Color
            <select
              value={color}
              onChange={(event) => setColor(event.target.value as typeof color)}
            >
              {PLAYER_COLORS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={view.joining || view.connection !== "connected"}>
            {view.joining ? "Joining…" : "Join room"}
          </button>
        </form>
      ) : (
        <section aria-label="Your controller">
          <div className="controller-identity">
            <PlayerPortrait color={me.color} />
            <span>
              {me.name} · Room {view.state?.roomCode}
            </span>
            <CoinCount coins={me.coins ?? 0} />
          </div>
          {!inActivity && playerEffectLabels(me).length > 0 && (
            <p className="controller-effects" role="status">
              {playerEffectLabels(me).join(" · ")}
            </p>
          )}
          {view.state?.phase === "LOBBY" ? <p>Waiting for the host to start.</p> : null}
          {canRoll && (
            <p>
              {permission === "enabled"
                ? "Shake your phone or tap Roll."
                : "Tap Roll to move your piece."}
            </p>
          )}
        </section>
      )}
      {me && setup && (
        <section className="controller-inputmode" aria-label="Choose your controls">
          <span>
            {inActivity ? "Controls" : "Play your way"}
            {!inActivity && <small>Both work in every game</small>}
          </span>
          <div>
            <button
              type="button"
              aria-pressed={permission !== "enabled"}
              onClick={() => setPermission("off")}
            >
              Touch
            </button>
            <button
              type="button"
              aria-pressed={permission === "enabled"}
              disabled={requestingPermission}
              onClick={() => {
                if (permission !== "enabled") void enableMotion()
              }}
            >
              {requestingPermission ? "Enabling…" : "Motion"}
            </button>
          </div>
          <small>
            {permission === "enabled"
              ? inActivity
                ? "Motion on · small wrist movements"
                : "Motion on. Keep a firm grip and use small wrist movements."
              : permission === "off"
                ? inActivity
                  ? "Touch on · buttons and sliders"
                  : "Tap buttons or move the sliders. No phone motion required."
                : `Motion ${permission}. Touch controls are ready.`}
          </small>
        </section>
      )}
      {me && finished && (
        <section className="controller-match-result" role="status">
          {winner && <PlayerPortrait color={winner.color} />}
          <h2>{winner?.name} reached the finish</h2>
          <p>Match complete. Watch the shared screen to celebrate.</p>
          <small>The host can choose Play again.</small>
        </section>
      )}
      {me && view.state && (view.state.phase === "SHOP" || view.state.phase === "POTATO") && (
        <PartyControls
          client={client}
          state={view.state}
          playerId={view.playerId}
          motionEnabled={permission === "enabled"}
        />
      )}
      {me && view.state && <PowerupNotice state={view.state} />}
      {me && view.state?.phase === "LOBBY" && <PhoneMotionGuide />}
      {me && view.state?.waitingForHost && (
        <p className="waiting-for-host" role="status">
          No rush · the host will continue when everyone is ready.
        </p>
      )}
      {!me ? null : view.state?.phase === "MINIGAME" && view.state.minigame ? (
        <MinigameControls
          key={`${view.state.minigame.id}:${permission === "enabled"}`}
          client={client}
          state={view.state}
          playerId={view.playerId}
          motionEnabled={permission === "enabled"}
        />
      ) : view.state?.phase === "SHOP" || view.state?.phase === "POTATO" ? null : view.state
          ?.phase === "DUEL" && view.state.duel ? (
        <DuelControls
          client={client}
          state={view.state}
          playerId={view.playerId}
          motionEnabled={permission === "enabled"}
        />
      ) : view.choosingItem || view.pendingItem ? (
        <p className="inventory-help" role="status">
          {view.pendingItem
            ? "Waiting for the game to confirm your power-up…"
            : "Shake-to-roll is paused while you choose."}
        </p>
      ) : canRoll || view.pending ? (
        <button
          className="controller-roll"
          type="button"
          disabled={!canRoll}
          onClick={() => {
            detector.current?.stop()
            client.requestRoll()
          }}
        >
          Roll
        </button>
      ) : null}
      {me && view.state?.phase === "AWAITING_ROLL" && (
        <PartyControls
          client={client}
          state={view.state}
          playerId={view.playerId}
          motionEnabled={permission === "enabled"}
        />
      )}
      <details className="controller-settings">
        <summary>
          {permission === "enabled" ? "Motion on · controller settings" : "Enable motion / help"}
        </summary>
        <section aria-label="Motion control">
          <button type="button" disabled={requestingPermission} onClick={() => void enableMotion()}>
            {permission === "enabled" ? "Use touch only" : "Enable motion"}
          </button>
          <p aria-live="polite">
            {permission === "off"
              ? view.state?.phase === "DUEL"
                ? "Enable motion for swing and tilt, or use the Swing and Guard buttons."
                : "Motion is optional. Every game has touch controls."
              : `Motion ${permission}. Touch controls stay available in every game.`}
          </p>
          <details>
            <summary>iPhone showing an Undo popup?</summary>
            <p>
              Open Settings → Accessibility → Touch and turn off Shake to Undo, then return here to
              shake and roll. This is an iPhone setting; the game cannot turn it off. You can also
              use the Roll button without changing your settings.
            </p>
          </details>
        </section>
      </details>
    </main>
  )
}
