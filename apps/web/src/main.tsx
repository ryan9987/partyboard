import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { AppRouter } from "./app/AppRouter"
import "./app/styles.css"

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Missing #root element")
}

createRoot(rootElement).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
