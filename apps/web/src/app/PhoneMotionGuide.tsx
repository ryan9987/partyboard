import type { MinigameKind } from "@party-board/protocol"

export type PhoneGuideKind = MinigameKind | "board"
const STEPS: Record<PhoneGuideKind, readonly string[]> = {
  board: [
    "Hold in portrait, screen facing you.",
    "Enable motion above before you start.",
    "Use small wrist movements. Touch controls also work.",
  ],
  fishing: [
    "Hold upright in portrait, screen facing you. Keep it centered.",
    "Give one small forward wrist flick to cast, then hold still.",
    "Wait for REEL NOW. Lift your wrist once, or tap Reel now.",
  ],
  balance: [
    "Hold upright in portrait, screen facing you.",
    "Tilt left or right gently to counter the rolling log.",
    "Return to center. Use the slider if you prefer touch.",
  ],
  archery: [
    "Hold upright in portrait, screen facing you.",
    "Tilt gently left or right to aim at your named target.",
    "Flick once to release. You have three arrows.",
  ],
  rhythm: [
    "Hold upright in portrait, screen facing you.",
    "Make one small wrist flick on each beat.",
    "Follow the host's timing cue, or tap Strike.",
  ],
}

/** Code-native diagrams, shared by host instructions, phone setup and in-game help. */
export function PhoneMotionGuide({ kind = "board" }: { kind?: PhoneGuideKind }) {
  const flick = kind === "fishing" || kind === "rhythm"
  return (
    <section className="phone-motion-guide" aria-label="How to hold your phone">
      <svg
        viewBox="0 0 240 150"
        role="img"
        aria-label={
          flick
            ? "Portrait phone with its screen facing you; side view shows a small wrist lift, not a shake."
            : "Portrait phone with its screen facing you; arrows show gentle left and right tilt."
        }
      >
        <g
          fill="none"
          stroke="#355445"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="39" y="8" width="58" height="98" rx="10" fill="#faf6e9" />
          <rect x="45" y="19" width="46" height="73" rx="3" fill="#dce7d5" strokeWidth="1" />
          <path d="M60 14h16M63 99h10" />
          <path d="M39 71c-12-5-15 5-11 13l10 28c3 8 11 13 22 13h15c12 0 17-9 17-20V88c0-7-10-7-10 0v15" />
          <path d="M35 125v10M78 125v10" />
          {flick ? (
            <>
              <path d="m161 104-12-75c-1-6 1-10 5-11s8 2 9 8l13 77Z" fill="#faf6e9" />
              <path d="m163 103-3-17c-2-9-13-7-11 1l2 14-15-7c-6-3-11 4-6 8l16 17c5 5 13 7 21 4l13-6c5-2 5-8 1-11l-10-10" />
              <path
                d="M186 69c19-19 14-40-4-49m-3 0 0 11m0-11 11 0"
                stroke="#a36a30"
                strokeWidth="3"
              />
            </>
          ) : (
            <>
              <rect
                x="157"
                y="22"
                width="47"
                height="80"
                rx="8"
                transform="rotate(15 180 100)"
                fill="#dce7d5"
              />
              <path
                d="M132 44c6-18 27-29 45-29m-44 29-2-11m2 11 11-3M209 43c7 13 8 24 2 39m0 0-4-10m4 10 10-5"
                stroke="#a36a30"
              />
            </>
          )}
        </g>
        <g
          fill="#355445"
          fontFamily="Calibri, Segoe UI, sans-serif"
          fontSize="12"
          textAnchor="middle"
        >
          <text x="68" y="146">
            Screen toward you
          </text>
          <text x="174" y="146">
            {flick ? "Small wrist lift" : "Gentle sideways tilt"}
          </text>
        </g>
      </svg>
      <div>
        <h3>Phone position</h3>
        <ol>
          {STEPS[kind].map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <small>
          {kind === "fishing"
            ? "No shaking or repeated whipping. Center the meter before reeling."
            : "Keep hold of your phone. Touch controls stay available."}
        </small>
      </div>
    </section>
  )
}
