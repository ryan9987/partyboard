import { getGameLesson, type TutorialKind, type TutorialMode } from "./gameLessons"

function Person({ x, y = 135, color = "#cd715d" }: { x: number; y?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-8-17-10 0m18-17L10 0" stroke="#40584a" strokeWidth="9" />
      <path d="M-17 1h10m10 0h10" stroke="#766349" strokeWidth="6" />
      <path d="m-10-37-13 10m33-10 13 10" stroke="#ca946d" strokeWidth="7" />
      <path d="M-10-43h20l3 26h-26Z" fill={color} />
      <circle cy="-55" r="10" fill="#d8ac83" />
      <path d="M-10-57c0-16 22-15 21 0l-8-5Z" fill="#604a36" />
      <circle cx="4" cy="-54" r="1" fill="#355445" />
    </g>
  )
}

function Acorn({ x = 0, y = 0 }: { x?: number; y?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-8-2Q-9 11 0 14 9 11 8-2" fill="#bd8249" />
      <path d="M-10-2Q-10-11 0-10 10-11 10-2Z" fill="#6b583c" />
      <path d="m0-10 2-5" stroke="#6b583c" strokeWidth="3" />
    </g>
  )
}

/** Lightweight, code-native demonstration. No live game inputs, downloads or extra WebGL canvas. */
export function GameTutorial({
  kind,
  mode = "motion",
}: {
  kind: TutorialKind
  mode?: TutorialMode
}) {
  const lesson = getGameLesson(kind, mode)
  const touch = mode === "touch"
  const flick = ["fishing", "rhythm", "potato"].includes(kind)
  return (
    <section
      className={`game-tutorial game-tutorial--${kind}`}
      data-control-mode={mode}
      aria-label="How to play"
    >
      <h2>How to play</h2>
      <svg
        viewBox="0 0 480 180"
        role="img"
        aria-label={`${lesson.steps.join(". ")}. ${lesson.goal}`}
      >
        <g
          className={`tutorial-phone ${touch ? "tutorial-phone--touch" : flick ? "tutorial-phone--flick" : "tutorial-phone--tilt"}`}
        >
          <rect
            x="48"
            y="36"
            width="55"
            height="90"
            rx="9"
            fill="#faf6e9"
            stroke="#355445"
            strokeWidth="2.5"
          />
          <rect x="54" y="49" width="43" height="59" rx="3" fill="#dce7d5" />
          <path d="M67 42h17m-13 76h9" stroke="#355445" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M48 87c-12-5-15 5-11 14l10 28c3 8 13 12 24 12h12c12 0 17-9 17-20v-12c0-8-10-8-10 0v12"
            fill="#faf6e9"
            stroke="#355445"
            strokeWidth="2"
          />
          {touch && <circle className="tutorial-tap" cx="75" cy="87" r="9" fill="#a36a30" />}
        </g>
        <path d="M126 75q16-20 33 0m-6-8 6 8-9 1" fill="none" stroke="#a36a30" strokeWidth="2.5" />
        <path d="M192 28v115" stroke="#d5ccb7" />
        <g strokeLinecap="round" strokeLinejoin="round">
          {kind === "balance" && (
            <>
              <path
                d="M225 154q14-7 28 0t28 0t28 0t28 0t28 0t28 0"
                fill="none"
                stroke="#8fbab0"
                strokeWidth="2"
              />
              <g className="tutorial-log">
                <rect x="267" y="133" width="122" height="20" rx="10" fill="#9b744b" />
                <path d="M281 139h36m15 7h39m-82 1h19m30-8h34" stroke="#745736" strokeWidth="2" />
                <circle cx="383" cy="143" r="8" fill="#d8ba87" stroke="#8f6e48" />
              </g>
              <g className="tutorial-balancer">
                <Person x={326} y={132} />
              </g>
            </>
          )}
          {kind === "fishing" && (
            <>
              <path
                d="M293 149q15-6 30 0t30 0t30 0t30 0"
                fill="none"
                stroke="#8fbab0"
                strokeWidth="3"
              />
              <path d="M231 140h58m-50 0v15m42-15v15" stroke="#9b744b" strokeWidth="7" />
              <Person x={256} />
              <path d="m279 108 30-49" stroke="#745736" strokeWidth="4" />
              <path d="M309 59Q375 46 406 142" fill="none" stroke="#a8b7a6" strokeDasharray="3 5" />
              <g className="tutorial-bobber">
                <circle cx="406" cy="144" r="5" fill="#cd715d" />
                <path d="M406 134v5" stroke="#355445" strokeWidth="2" />
              </g>
              <text
                className="tutorial-reel"
                x="351"
                y="89"
                fill="#355445"
                fontSize="14"
                fontWeight="700"
              >
                REEL NOW
              </text>
            </>
          )}
          {kind === "archery" && (
            <>
              <Person x={254} />
              <path d="M278 86q18 23 0 47l1-47" fill="none" stroke="#8f6e48" strokeWidth="3" />
              {[28, 21, 14, 7].map((r, i) => (
                <circle
                  key={r}
                  cx="389"
                  cy="107"
                  r={r}
                  fill={["#e5dcc5", "#506e6a", "#cd715d", "#d8b25e"][i]}
                />
              ))}
              <g className="tutorial-aim" fill="none" stroke="#355445" strokeWidth="2">
                <circle cx="389" cy="107" r="7" />
                <path d="M378 107h22m-11-11v22" />
              </g>
              <g className="tutorial-arrow" stroke="#745736" strokeWidth="2">
                <path d="M279 107h23m-5-4 5 4-5 4" />
              </g>
            </>
          )}
          {kind === "rhythm" && (
            <>
              <Person x={329} y={120} />
              <path d="M307 128h44l-4 25h-36Z" fill="#9b744b" stroke="#745736" strokeWidth="2" />
              <ellipse
                className="tutorial-drum"
                cx="329"
                cy="128"
                rx="22"
                ry="6"
                fill="#d8ba87"
                stroke="#745736"
                strokeWidth="2"
              />
              <path className="tutorial-stick" d="m352 93-17 29" stroke="#745736" strokeWidth="4" />
              <path d="M254 43h150m-75-9v18" stroke="#a8b7a6" strokeWidth="2" />
              <circle className="tutorial-beat" cx="254" cy="43" r="5" fill="#a36a30" />
            </>
          )}
          {kind === "potato" && (
            <>
              <Person x={254} />
              <Person x={404} color="#4d9996" />
              <path d="M278 86q51-46 102 0" fill="none" stroke="#a8b7a6" strokeDasharray="3 5" />
              <g className="tutorial-pass">
                <Acorn x={278} y={107} />
              </g>
            </>
          )}
        </g>
      </svg>
      <div className="tutorial-control-labels">
        <span>
          {touch ? "Tap buttons or move the slider" : "Phone upright · screen toward you"}
        </span>
        <span>Watch the shared screen</span>
      </div>
      <ol>
        {lesson.steps.map((step, i) => (
          <li key={step}>
            <span>{i + 1}</span>
            {step}
          </li>
        ))}
      </ol>
      <p>
        <strong>Goal</strong> {lesson.goal}
      </p>
      <small>
        {touch ? "Touch controls" : "Or use touch"}: {lesson.touchControls} · keep a secure grip
      </small>
    </section>
  )
}
