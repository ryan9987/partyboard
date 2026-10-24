import type { GameState } from "@party-board/protocol"

import type { RuntimeConfig } from "../app/runtimeConfig"
import type { HostConnectionState } from "./useLiveHostGame"

type CheckStatus = "pass" | "warning" | "error"

type CheckRowProps = {
  detail: string
  label: string
  status: CheckStatus
}

function CheckRow({ detail, label, status }: CheckRowProps) {
  return (
    <div className="preflight-row">
      <span className={`preflight-status preflight-status--${status}`} aria-hidden="true" />
      <span>
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
    </div>
  )
}

type DemoPreflightProps = {
  config: RuntimeConfig
  connectionState: HostConnectionState
  liveMode: boolean
  open: boolean
  onToggle: () => void
  state: GameState
}

export function DemoPreflight({
  config,
  connectionState,
  liveMode,
  open,
  onToggle,
  state,
}: DemoPreflightProps) {
  const readyPlayers = state.players.filter((player) => player.ready && player.connected).length
  const controllerIssue = config.issues.find((issue) =>
    ["INVALID_CONTROLLER_URL", "INSECURE_CONTROLLER"].includes(issue.code),
  )
  const socketIssue = config.issues.find((issue) =>
    ["INVALID_SOCKET_URL", "INSECURE_SOCKET"].includes(issue.code),
  )
  const serverStatus: CheckStatus = socketIssue
    ? socketIssue.severity === "error"
      ? "error"
      : "warning"
    : !liveMode
      ? "warning"
      : connectionState === "connected"
        ? "pass"
        : connectionState === "disconnected"
          ? "error"
          : "warning"

  return (
    <div className="preflight-control">
      <button aria-expanded={open} className="preflight-button" onClick={onToggle} type="button">
        Preflight
      </button>

      {open && (
        <section className="preflight-panel" aria-label="Demo preflight checks">
          <div className="preflight-heading">
            <div>
              <p className="eyebrow">Demo readiness</p>
              <h2>Preflight checks</h2>
            </div>
            <button aria-label="Close preflight" className="preflight-close" onClick={onToggle}>
              ×
            </button>
          </div>

          <CheckRow
            detail={
              config.secureContext
                ? "Secure context available"
                : "HTTPS required before device testing"
            }
            label="Secure host"
            status={config.secureContext ? "pass" : "warning"}
          />
          <CheckRow
            detail={controllerIssue?.message ?? config.controllerBaseUrl}
            label="Controller URL"
            status={
              controllerIssue?.severity === "error" ? "error" : controllerIssue ? "warning" : "pass"
            }
          />
          <CheckRow
            detail={
              socketIssue?.message ??
              (liveMode ? `Server is ${connectionState}` : "Fixture preview — no server URL")
            }
            label="Game server"
            status={serverStatus}
          />
          <CheckRow
            detail={`${state.players.length}/4 joined · ${readyPlayers} ready`}
            label="Controllers"
            status={readyPlayers >= 4 ? "pass" : "warning"}
          />

          <p className="preflight-footnote">
            Run this check again from the presentation laptop on the actual demo network.
          </p>
        </section>
      )}
    </div>
  )
}
