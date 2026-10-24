import { createGameApp } from "../apps/server/src/server"

// Isolated rehearsal: pass the first shop, then complete a two-player round.
const rolls = [6, 1, 3, 2]
let rollIndex = 0
const app = createGameApp({
  allowedOrigins: ["http://localhost:5174"],
  gameOptions: {
    dice: () => rolls[rollIndex++ % rolls.length]!,
    rollTimeoutMs: 300_000,
    shopDurationMs: 30_000,
    potatoIntroMs: 6000,
    potatoFuseMs: 15_000,
    potatoResultMs: 12_000,
  },
})
app.httpServer.listen(3002, "127.0.0.1", () =>
  console.log("Party rehearsal: http://localhost:3002"),
)
process.on("SIGINT", () => {
  void app.close()
})
