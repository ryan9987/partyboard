import { expect, it } from "vitest"
import { readGameClock } from "../apps/web/src/networking/clockMath"

it("advances from the server time without using the device wall clock", () => {
  const anchor = { server: 1000000, local: 800 }
  expect(readGameClock(anchor, 850)).toBe(1000050)
  expect(readGameClock(anchor, 1800)).toBe(1001000)
  expect(readGameClock(anchor, 700)).toBe(1000000)
})
