import type { ReactNode } from "react"

/** Lightweight controller cue; no WebGL or downloaded illustration on phones. */
export function MotionPrompt({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="motion-prompt" role="status">
      <svg viewBox="0 0 96 80" aria-hidden="true">
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <g className="motion-prompt__phone">
            <rect x="32" y="12" width="32" height="55" rx="6" fill="#fff9e9" />
            <path d="M43 18h10M45 60h6" />
          </g>
          <path d="M23 26c-7 8-7 19 0 27m-1-1-7-1m7 1 1-7M73 53c7-8 7-19 0-27m1 1 7 1m-7-1-1 7" />
        </g>
      </svg>
      <strong>{title}</strong>
      <span>{children}</span>
    </div>
  )
}
