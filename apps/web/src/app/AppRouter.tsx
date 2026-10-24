import { lazy, Suspense } from "react"

const HostPage = lazy(() => import("../host/HostPage"))
const ControllerPage = lazy(() => import("../controller/ControllerPage"))
const MinigameRehearsal = lazy(() => import("../host/MinigameRehearsal"))
const PhoneRehearsal = lazy(() => import("../host/PhoneRehearsal"))

function LoadingScreen() {
  return (
    <main className="route-message">
      <div className="route-message__card">
        <p className="eyebrow">Party Board</p>
        <h1>Loading the table…</h1>
      </div>
    </main>
  )
}

function NotFound() {
  return (
    <main className="route-message">
      <div className="route-message__card">
        <p className="eyebrow">404</p>
        <h1>That route is not on the board.</h1>
        <a className="button button--primary" href="/host">
          Open host
        </a>
      </div>
    </main>
  )
}

export function AppRouter() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/"
  if (import.meta.env.DEV && path === "/phone-preview")
    return (
      <Suspense fallback={<LoadingScreen />}>
        <PhoneRehearsal />
      </Suspense>
    )
  if (import.meta.env.DEV && path === "/rehearsal")
    return (
      <Suspense fallback={<LoadingScreen />}>
        <MinigameRehearsal />
      </Suspense>
    )

  if (path === "/" || path === "/host") {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <HostPage />
      </Suspense>
    )
  }

  if (path === "/controller" || path.startsWith("/controller/")) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <ControllerPage />
      </Suspense>
    )
  }

  return <NotFound />
}
