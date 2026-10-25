import { randomUUID } from "node:crypto"
import { expect, it } from "vitest"
import { itemUseRequestSchema, SHOP_ITEMS, publicPlayerSchema } from "../packages/protocol/src"
import { playerEffectLabels } from "../apps/web/src/app/playerEffects"

it("validates Compass choices without allowing die overrides on other power-ups", () => {
  const base = {
    roomCode: "TEST",
    playerSessionId: "x".repeat(16),
    requestId: randomUUID(),
    turnNumber: 1,
  }
  expect(Object.keys(SHOP_ITEMS)).toHaveLength(5)
  expect(SHOP_ITEMS.freeze.price).toBeGreaterThan(6 + 3)
  for (const dieValue of [1, 2, 3, 4, 5, 6])
    expect(itemUseRequestSchema.safeParse({ ...base, item: "compass", dieValue }).success).toBe(
      true,
    )
  for (const dieValue of [undefined, 0, 7, NaN, 3.5])
    expect(itemUseRequestSchema.safeParse({ ...base, item: "compass", dieValue }).success).toBe(
      false,
    )
  expect(itemUseRequestSchema.safeParse({ ...base, item: "boots", dieValue: 6 }).success).toBe(
    false,
  )
  expect(itemUseRequestSchema.safeParse({ ...base, item: "clover", coins: 999 }).success).toBe(
    false,
  )
})

it("keeps readable power-up status after the final pack item is consumed", () => {
  const player = publicPlayerSchema.parse({
    id: "a",
    name: "Ryan",
    color: "coral",
    connected: true,
    ready: true,
    tileId: "tile-0",
    inventory: [],
    frostWard: true,
    plannedRoll: 3,
  })
  expect(playerEffectLabels(player)).toEqual(["Thaw protection", "Next die: 3"])
  expect(playerEffectLabels({ ...player, frozen: true })).toContain("Frost: next move −2 (min 1)")
})
