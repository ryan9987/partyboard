import { lazy, Suspense } from "react"

const HostPage = lazy(() => import("../host/HostPage"))

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

function ControllerPlaceholder() {
  return (
    <main className="route-message">
      <div className="route-message__card">
        <p className="eyebrow">Controller route reserved</p>
        <h1>Jack's controller client connects here.</h1>
        <p>
          The host and board can be previewed now at <a href="/host">/host</a>.
        </p>
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

  if (path === "/" || path === "/host") {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <HostPage />
      </Suspense>
    )
  }

  if (path === "/controller" || path.startsWith("/controller/")) {
    return <ControllerPlaceholder />
  }

  return <NotFound />
}
