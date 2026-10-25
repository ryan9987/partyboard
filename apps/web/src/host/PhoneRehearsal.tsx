import { useState } from "react"

/** A real iframe viewport exercises mobile media queries without browser emulation. */
export default function PhoneRehearsal() {
  const [width, setWidth] = useState(390)
  const overlays = new URLSearchParams(window.location.search).get("view") === "overlays"
  const lessons = new URLSearchParams(window.location.search).get("view") === "lessons"
  const code = (new URLSearchParams(window.location.search).get("room") ?? "")
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 4)
  const slot = new URLSearchParams(window.location.search).get("slot") ?? ""
  return (
    <main className="phone-rehearsal">
      <div>
        <h1>
          {lessons
            ? "Phone instruction check"
            : overlays
              ? "Overlay layout check"
              : "Phone layout check"}
        </h1>
        <p>
          {lessons || overlays ? "Art fixtures" : "Live controller"} · {width}px wide
        </p>
        <label>
          Screen width
          <select
            aria-label="Phone width"
            value={width}
            onChange={(event) => setWidth(Number(event.target.value))}
          >
            <option value={320}>320px · compact</option>
            <option value={390}>390px · standard</option>
            <option value={430}>430px · large</option>
          </select>
        </label>
      </div>
      <iframe
        title={lessons ? "Phone instructions" : overlays ? "Game overlays" : "Phone controller"}
        src={
          lessons
            ? "/lesson-preview"
            : overlays
              ? "/rehearsal"
              : `/controller/${code}${/^[1-4]$/.test(slot) ? `?slot=${slot}` : ""}`
        }
        style={{
          width,
          height: 844,
          border: "1px solid #bfc4ac",
          borderRadius: 20,
          background: "#e5e9db",
        }}
      />
    </main>
  )
}
