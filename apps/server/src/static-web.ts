import { createReadStream } from "node:fs"
import { realpath, stat } from "node:fs/promises"
import type { RequestListener } from "node:http"
import { extname, resolve, sep } from "node:path"
import { pipeline } from "node:stream/promises"

const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
}

/** Serve only compiled assets and known SPA routes, never workspace or environment files. */
export async function createStaticWebHandler(directory: string): Promise<RequestListener> {
  const root = await realpath(directory)
  if (!(await stat(root)).isDirectory()) throw new Error("WEB_DIST_DIR must be a directory")
  return (request, response) => {
    void (async () => {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405, { Allow: "GET, HEAD" }).end()
        return
      }
      let pathname: string
      try {
        pathname = decodeURIComponent(new URL(request.url ?? "/", "http://local").pathname)
      } catch {
        response.writeHead(400).end()
        return
      }
      if (pathname.includes("\0") || pathname.split("/").some((part) => part.startsWith("."))) {
        response.writeHead(404).end()
        return
      }
      const spaRoute = /^\/(?:host\/?|controller(?:\/[a-zA-Z0-9]{4})?\/?)?$/.test(pathname)
      const candidate = resolve(root, spaRoute ? "index.html" : `.${pathname}`)
      if (!candidate.startsWith(root + sep)) {
        response.writeHead(404).end()
        return
      }
      try {
        const file = await realpath(candidate)
        if (!file.startsWith(root + sep)) {
          response.writeHead(404).end()
          return
        }
        const details = await stat(file)
        if (!details.isFile()) {
          response.writeHead(404).end()
          return
        }
        response.writeHead(200, {
          "Content-Type": contentTypes[extname(file)] ?? "application/octet-stream",
          "Content-Length": details.size,
          "Cache-Control": pathname.startsWith("/assets/")
            ? "public, max-age=31536000, immutable"
            : "no-cache",
          "X-Content-Type-Options": "nosniff",
        })
        if (request.method === "HEAD") {
          response.end()
          return
        }
        await pipeline(createReadStream(file), response)
      } catch (error) {
        if (response.headersSent) {
          response.destroy()
          return
        }
        const code = (error as NodeJS.ErrnoException).code
        response.writeHead(code === "ENOENT" || code === "ENOTDIR" ? 404 : 500).end()
      }
    })().catch(() => {
      if (!response.headersSent) response.writeHead(500)
      response.end()
    })
  }
}
