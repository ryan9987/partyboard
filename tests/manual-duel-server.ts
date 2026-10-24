import { createGameApp } from "../apps/server/src/server"

// Isolated browser rehearsal: two rolls of three guarantee an occupied-space duel.
// Production game durations and random dice are unaffected.
const app = createGameApp({
  allowedOrigins: ["http://localhost:5174"],
  gameOptions: {
    dice: () => 3,
    rollTimeoutMs: 300_000,
    duelIntroMs: 5000,
    duelDurationMs: 120_000,
    duelResultMs: 10_000,
  },
})
app.httpServer.listen(3002, "127.0.0.1", () =>
  console.log("Duel rehearsal server: http://localhost:3002"),
)
process.on("SIGINT", () => {
  void app.close()
})
