import { minigameKindSchema } from "../packages/protocol/src"
import { createGameApp } from "../apps/server/src/server"

// MINIGAME=fishing pnpm --filter @party-board/server exec tsx ../../tests/manual-minigame-server.ts
// Use a separate Vite on 5175 with VITE_SOCKET_URL=http://localhost:3003.
const kind =
  process.env.MINIGAME === "all"
    ? "all"
    : minigameKindSchema.parse(process.env.MINIGAME ?? "fishing")
const rotation = ["potato", "fishing", "archery", "rhythm", "balance", "dodge"] as const
const rolls = [1, 2, 3, 4]
let index = 0
const app = createGameApp({
  allowedOrigins: ["http://localhost:5175"],
  gameOptions: {
    roundGame: kind === "all" ? (round) => rotation[(round - 1) % rotation.length]! : kind,
    dice: () => rolls[index++ % rolls.length]!,
    shopDurationMs: 0,
    duelIntroMs: 3000,
    duelDurationMs: 8000,
    duelResultMs: 1500,
    rollDurationMs: 200,
    millisecondsPerTile: 100,
    turnEndMs: 100,
    rollTimeoutMs: 0,
    minigameIntroMs: 3000,
    minigameDurationMs: kind === "all" ? 20000 : 60000,
    minigameResultMs: 3500,
  },
})
app.httpServer.listen(3003, "127.0.0.1", () =>
  console.log(`Mini-game rehearsal (${kind}): http://localhost:3003`),
)
process.on("SIGINT", () => void app.close())
