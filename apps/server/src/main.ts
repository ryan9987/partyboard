import { createGameApp } from "./server"
import { createStaticWebHandler } from "./static-web"

const port = Number(process.env.PORT ?? 3001)
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("PORT must be between 1 and 65535")
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
const webHandler = process.env.WEB_DIST_DIR
  ? await createStaticWebHandler(process.env.WEB_DIST_DIR)
  : undefined
const app = createGameApp({ allowedOrigins, ...(webHandler ? { webHandler } : {}) })
app.httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Party Board server listening on port ${port}`)
})
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void app.close()
  })
}
