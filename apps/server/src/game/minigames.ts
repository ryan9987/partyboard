import { randomUUID } from "node:crypto"
import {
  archeryDrift,
  balanceLean,
  hazardLane,
  RHYTHM_BEAT_MS,
  FISHING_RULES,
  type MinigameKind,
  type MinigameState,
  type MinigameInputRequest,
} from "@party-board/protocol"

type Runtime = {
  sequence: number
  inputAt: number
  actionAt: number
  castAt: number | null
  beat: number
  wave: number
  strain: number
}
export class MinigameRound {
  readonly state: MinigameState
  private readonly runtime = new Map<string, Runtime>()
  private lastTick: number
  private readonly forfeited = new Set<string>()
  constructor(kind: MinigameKind, ids: string[], now: number, introMs: number, durationMs: number) {
    this.lastTick = now + introMs
    this.state = {
      id: randomUUID(),
      kind,
      stage: "intro",
      startsAt: now + introMs,
      endsAt: now + introMs,
      durationMs,
      winnerIds: [],
      revision: 0,
      players: ids.map((playerId) => ({
        playerId,
        score: 0,
        alive: true,
        axis: 0,
        position: 0,
        actionAt: 0,
        attempts: 0,
        status: "ready",
      })),
    }
    ids.forEach((id) =>
      this.runtime.set(id, {
        sequence: -1,
        inputAt: 0,
        actionAt: 0,
        castAt: null,
        beat: -1,
        wave: -1,
        strain: 0,
      }),
    )
  }
  input(id: string, input: MinigameInputRequest, now: number): boolean {
    const game = this.state
    const player = game.players.find((entry) => entry.playerId === id)
    const runtime = this.runtime.get(id)
    if (
      !player?.alive ||
      !runtime ||
      game.stage !== "active" ||
      input.gameId !== game.id ||
      now >= game.endsAt ||
      input.sequence <= runtime.sequence ||
      (!input.action && now - runtime.inputAt < 45)
    )
      return false
    runtime.sequence = input.sequence
    runtime.inputAt = now
    player.axis = input.axis
    if (!input.action || now - runtime.actionAt < 350) return true
    const elapsed = now - game.startsAt
    if (game.kind === "fishing") {
      if (["ready", "caught", "miss"].includes(player.status)) {
        if (player.status !== "ready" && now - player.actionAt < FISHING_RULES.resultHoldMs)
          return true
        runtime.castAt = now
        runtime.strain = 0
        player.status = "casting"
        player.attempts++
      } else {
        const age = now - runtime.castAt!
        // A backswing/early tap must not destroy a cast. Let players steady and retry a bite.
        if (age < FISHING_RULES.biteAtMs) return true
        if (age > FISHING_RULES.reelUntilMs || runtime.strain >= FISHING_RULES.breakAfterSeconds)
          player.status = "miss"
        else if (Math.abs(player.axis) <= FISHING_RULES.maxCatchTilt) {
          player.score += Math.round(40 + 60 * (1 - Math.abs(player.axis)))
          player.status = "caught"
        } else return true
      }
    } else if (game.kind === "archery") {
      if (player.attempts >= 3 || now - runtime.actionAt < 900) return true
      player.attempts++
      const miss = Math.abs(player.axis + archeryDrift(elapsed))
      player.score += Math.max(0, Math.round(100 * (1 - miss / 0.6)))
      player.position = Math.max(-1, Math.min(1, player.axis + archeryDrift(elapsed)))
      player.shots = [
        ...(player.shots ?? []),
        { offset: player.axis + archeryDrift(elapsed), at: now },
      ]
      player.status = miss < 0.6 ? "hit" : "miss"
    } else if (game.kind === "rhythm") {
      const beat = Math.round(elapsed / RHYTHM_BEAT_MS)
      if (beat < 1 || runtime.beat === beat) return true
      runtime.beat = beat
      const error = Math.abs(elapsed - beat * RHYTHM_BEAT_MS)
      const points = error <= 180 ? Math.round(100 * (1 - error / 230)) : 0
      player.score += points
      player.status = points ? "hit" : "miss"
      player.attempts++
    } else return true
    runtime.actionAt = now
    player.actionAt = now
    game.revision++
    return true
  }
  /** Rebase the entire round after an untimed rules screen, never consume playing time. */
  start(now: number): void {
    if (this.state.stage !== "intro") return
    this.state.startsAt = now
    this.state.endsAt = now + this.state.durationMs
    this.state.stage = "active"
    this.lastTick = now
  }
  tick(now: number): boolean {
    const game = this.state
    if (game.stage === "result") return true
    if (game.stage === "intro") {
      if (now < game.startsAt) return false
      game.stage = "active"
      game.endsAt = game.startsAt + game.durationMs
    }
    const dt = Math.min(0.15, Math.max(0, (now - this.lastTick) / 1000))
    const elapsed = Math.min(now - game.startsAt, game.durationMs)
    this.lastTick = now
    game.players.forEach((player, index) => {
      if (!player.alive) return
      const runtime = this.runtime.get(player.playerId)!
      if (now - runtime.inputAt > 700) player.axis = 0
      if (game.kind === "balance") {
        const lean = balanceLean(elapsed, index) + player.axis + player.position * 0.8
        player.position = Math.max(-1.3, Math.min(1.3, player.position + lean * dt * 0.62))
        player.score = Math.round(elapsed / 10) / 100
        if (Math.abs(player.position) >= 1.15) {
          player.alive = false
          player.status = "out"
        }
      } else if (game.kind === "dodge") {
        player.position = player.axis < -0.33 ? -1 : player.axis > 0.33 ? 1 : 0
        const wave = Math.floor(elapsed / 1800)
        if (elapsed % 1800 >= 1450 && runtime.wave !== wave) {
          runtime.wave = wave
          if (player.position === hazardLane(wave, index)) {
            player.alive = false
            player.status = "out"
          }
        }
        player.score = Math.round(elapsed / 10) / 100
      } else if (
        game.kind === "fishing" &&
        runtime.castAt !== null &&
        player.status !== "caught" &&
        player.status !== "miss"
      ) {
        const age = now - runtime.castAt
        runtime.strain =
          Math.abs(player.axis) > FISHING_RULES.strainTilt
            ? runtime.strain + dt
            : Math.max(0, runtime.strain - dt)
        if (age > FISHING_RULES.reelUntilMs || runtime.strain >= FISHING_RULES.breakAfterSeconds) {
          player.status = "miss"
          player.actionAt = now
        } else
          player.status =
            age < FISHING_RULES.castFlightMs
              ? "casting"
              : age < FISHING_RULES.biteAtMs
                ? "waiting"
                : "bite"
      }
    })
    game.revision++
    const survival = game.kind === "balance" || game.kind === "dodge"
    // Let the final arrow land, then announce the winner instead of waiting out an idle clock.
    const arrowsFinished =
      game.kind === "archery" &&
      game.players.every(
        (player) => !player.alive || (player.attempts >= 3 && now - player.actionAt >= 650),
      )
    return (
      now >= game.endsAt ||
      (survival && game.players.every((player) => !player.alive)) ||
      arrowsFinished
    )
  }
  disconnect(id: string): void {
    this.forfeited.add(id)
    const player = this.state.players.find((entry) => entry.playerId === id)
    if (player) {
      player.alive = false
      player.status = "out"
    }
  }
  /** A refreshed controller restarts its input sequence, not its score, arrows or eligibility. */
  reconnect(id: string): void {
    const runtime = this.runtime.get(id)
    if (runtime) runtime.sequence = -1
    const player = this.state.players.find((entry) => entry.playerId === id)
    if (player) player.axis = 0
  }
  finish(now: number, resultMs: number): void {
    const game = this.state
    if (game.stage === "result") return
    game.stage = "result"
    game.endsAt = now + resultMs
    const eligible = game.players.filter((player) => !this.forfeited.has(player.playerId))
    const highest = Math.max(...eligible.map((player) => player.score))
    game.winnerIds = eligible
      .filter((player) => player.score === highest)
      .map((player) => player.playerId)
    game.revision++
  }
}
