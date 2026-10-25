import { randomUUID } from "node:crypto"
import { expect, it } from "vitest"
import { MinigameRound } from "../../apps/server/src/game/minigames"
import {
  archeryDrift,
  balanceLean,
  hazardLane,
  minigameInputRequestSchema,
  type MinigameKind,
} from "../../packages/protocol/src"

const start = 10000
function round(kind: MinigameKind) {
  const game = new MinigameRound(kind, ["a", "b", "c", "d"], start, 100, 20000)
  game.tick(start + 100)
  return game
}
function input(
  game: MinigameRound,
  player: string,
  elapsed: number,
  axis = 0,
  action = true,
  sequence = elapsed,
) {
  return game.input(
    player,
    {
      roomCode: "TEST",
      playerSessionId: "a".repeat(16),
      requestId: randomUUID(),
      gameId: game.state.id,
      sequence,
      axis,
      action,
    },
    start + 100 + elapsed,
  )
}

it("rejects malformed axes and client-supplied scores/timestamps", () => {
  const base = {
    roomCode: "TEST",
    playerSessionId: "x".repeat(16),
    requestId: randomUUID(),
    gameId: randomUUID(),
    sequence: 1,
    axis: 0,
    action: true,
  }
  expect(minigameInputRequestSchema.safeParse({ ...base, axis: NaN }).success).toBe(false)
  expect(minigameInputRequestSchema.safeParse({ ...base, axis: 1.1 }).success).toBe(false)
  expect(minigameInputRequestSchema.safeParse({ ...base, score: 1000 }).success).toBe(false)
  expect(minigameInputRequestSchema.safeParse({ ...base, time: 1 }).success).toBe(false)
})

it("judges three archery arrows, enforces cooldown and rejects duplicate/stale inputs", () => {
  const game = round("archery")
  for (const time of [1000, 2000, 3000]) input(game, "a", time, -archeryDrift(time))
  expect(game.state.players[0]).toMatchObject({ score: 300, attempts: 3, status: "hit" })
  expect(game.state.players[0]!.shots).toHaveLength(3)
  expect(game.state.players[0]!.shots!.every((shot) => shot.offset === 0)).toBe(true)
  input(game, "a", 4000, 0)
  input(game, "a", 2000, 0)
  expect(game.state.players[0]!.attempts).toBe(3)
  input(game, "b", 1000, 1)
  input(game, "b", 1100, 0)
  expect(game.state.players[1]).toMatchObject({ score: 0, attempts: 1 })
  expect(input(game, "intruder", 2000)).toBe(false)
  game.finish(start + 20100, 1000)
  expect(game.state.winnerIds).toEqual(["a"])
  expect(input(game, "a", 5000)).toBe(false)
})

it("finishes Archery once everyone's arrows land, without an unnecessary idle wait", () => {
  const game = round("archery")
  for (const time of [1000, 2000, 3000])
    for (const id of ["a", "b", "c", "d"]) input(game, id, time)
  expect(game.tick(start + 100 + 3649)).toBe(false)
  expect(game.tick(start + 100 + 3650)).toBe(true)
})

it("requires a cast, waits for a bite, lands a fish once and animates a new cast separately", () => {
  const game = round("fishing")
  input(game, "a", 1000)
  game.tick(start + 2100)
  expect(game.state.players[0]!.status).toBe("waiting")
  game.tick(start + 3000)
  expect(game.state.players[0]!.status).toBe("bite")
  input(game, "a", 3000)
  expect(game.state.players[0]).toMatchObject({ score: 100, status: "caught" })
  input(game, "a", 3100)
  expect(game.state.players[0]!.score).toBe(100)
  input(game, "a", 4300)
  expect(game.state.players[0]).toMatchObject({ score: 100, status: "casting", attempts: 2 })
})

it("ignores an early reel/backswing and still allows a later bite to be caught", () => {
  const game = round("fishing")
  input(game, "a", 1000)
  input(game, "a", 2000)
  game.tick(start + 100 + 2900)
  expect(game.state.players[0]!.status).toBe("bite")
  input(game, "a", 3100)
  expect(game.state.players[0]).toMatchObject({ status: "caught", attempts: 1, score: 100 })
})

it("allows a full reaction window and moderate tilt, with one catch per cast", () => {
  const game = round("fishing")
  input(game, "a", 1000)
  game.tick(start + 100 + 4800)
  expect(game.state.players[0]!.status).toBe("bite")
  input(game, "a", 4900, 0.65)
  const score = game.state.players[0]!.score
  expect(score).toBeGreaterThan(0)
  expect(game.state.players[0]!.status).toBe("caught")
  input(game, "a", 5300)
  expect(game.state.players[0]).toMatchObject({ score, attempts: 1, status: "caught" })
})

it("misses an expired bite and breaks a line only after sustained extreme tilt", () => {
  const game = round("fishing")
  input(game, "a", 1000)
  game.tick(start + 100 + 5300)
  expect(game.state.players[0]!.status).toBe("miss")
  const strained = round("fishing")
  input(strained, "b", 1000)
  for (let t = 1100; t <= 2400; t += 100) {
    input(strained, "b", t, 1, false)
    strained.tick(start + 100 + t)
  }
  expect(strained.state.players[1]).toMatchObject({ status: "miss", score: 0 })
})

it("lets players steady a tilted phone and retry within the same bite", () => {
  const game = round("fishing")
  input(game, "a", 1000)
  game.tick(start + 100 + 2900)
  input(game, "a", 3000, 0.9)
  expect(game.state.players[0]).toMatchObject({ status: "bite", score: 0, attempts: 1 })
  input(game, "a", 3400, 0.2)
  expect(game.state.players[0]).toMatchObject({ status: "caught", score: 88, attempts: 1 })
})

it("lets four players catch independently after early motions, late reactions and moderate tilt", () => {
  const game = round("fishing")
  for (const id of ["a", "b", "c", "d"]) input(game, id, 1000)
  for (const id of ["a", "b", "c", "d"]) input(game, id, 2100)
  game.tick(start + 100 + 4800)
  for (const id of ["a", "b", "c", "d"]) input(game, id, 4900, 0.65)
  expect(
    game.state.players.every(
      (player) => player.status === "caught" && player.score === 61 && player.attempts === 1,
    ),
  ).toBe(true)
})

it("scores rhythm against server beats and permits only one attempt per beat", () => {
  const game = round("rhythm")
  input(game, "a", 750)
  input(game, "a", 850)
  input(game, "a", 1500)
  input(game, "b", 1100)
  expect(game.state.players[0]).toMatchObject({ score: 200, attempts: 2 })
  expect(game.state.players[1]!.score).toBe(0)
})

it("allows counter-tilting to survive Balance while idle players fall", () => {
  const game = round("balance")
  for (let t = 100; t <= 20000; t += 100) {
    const position = game.state.players[0]!.position
    input(game, "a", t, Math.max(-1, Math.min(1, -balanceLean(t, 0) - position * 0.8)), false)
    game.tick(start + 100 + t)
  }
  expect(game.state.players[0]).toMatchObject({ alive: true, score: 20 })
  expect(game.state.players.slice(1).every((entry) => !entry.alive)).toBe(true)
})

it("warns about deterministic Dodge lanes before impact and preserves survival times", () => {
  const game = round("dodge")
  for (let t = 100; t <= 20000; t += 100) {
    const wave = Math.floor(t / 1800)
    const safe = hazardLane(wave, 0) === 0 ? 1 : 0
    input(game, "a", t, safe, false)
    game.tick(start + 100 + t)
  }
  expect(game.state.players[0]).toMatchObject({ alive: true, score: 20 })
  expect(game.state.players.slice(1).every((entry) => !entry.alive)).toBe(true)
})

it("expires held inputs, excludes disconnect forfeits and allows tied winners", () => {
  const game = round("archery")
  input(game, "a", 1000, -archeryDrift(1000))
  input(game, "b", 1000, -archeryDrift(1000))
  game.disconnect("a")
  expect(input(game, "a", 2000)).toBe(false)
  game.tick(start + 4000)
  expect(game.state.players[1]!.axis).toBe(0)
  game.finish(start + 20100, 1000)
  expect(game.state.winnerIds).toEqual(["b"])
  const tie = round("rhythm")
  tie.finish(start + 20100, 1000)
  expect(tie.state.winnerIds).toHaveLength(4)
})
