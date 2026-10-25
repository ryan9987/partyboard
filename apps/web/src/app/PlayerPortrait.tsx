import type { PlayerColor } from "@party-board/protocol"

// Lightweight, locally drawn counterparts to CharacterModel's eight woodland outfits.
// No WebGL context or image download is needed in a HUD (or on a phone).
const LOOKS = {
  cyan: { skin: "#9d6546", hair: "#201712", shirt: "#28c8d0", scarf: "#ffdf70" },
  coral: { skin: "#efb48e", hair: "#5b2f1d", shirt: "#ff6678", scarf: "#5de2e7" },
  gold: { skin: "#74462f", hair: "#171311", shirt: "#f3bf3f", scarf: "#ff6d7c" },
  violet: { skin: "#d58c67", hair: "#37224f", shirt: "#8c67ef", scarf: "#79e4ee" },
  fern: { skin: "#a47150", hair: "#30231a", shirt: "#658b56", scarf: "#e6c46c" },
  peach: { skin: "#f1c2a2", hair: "#9b5c34", shirt: "#d58d55", scarf: "#7caca2" },
  blue: { skin: "#694530", hair: "#211916", shirt: "#5886c4", scarf: "#ecd492" },
  rose: { skin: "#cf9470", hair: "#38262c", shirt: "#bc689a", scarf: "#91c1a3" },
} as const

export function PlayerPortrait({ color }: { color: PlayerColor }) {
  const look = LOOKS[color]
  return (
    <svg
      className={`player-portrait player-portrait--${color}`}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="30" fill="#e8e6d3" />
      {["coral", "fern"].includes(color) && <circle cx="43" cy="14" r="9" fill={look.hair} />}
      <path d="M8 61v-9c0-12 10-17 24-17s24 5 24 17v9" fill={look.shirt} />
      <path d="M18 41v20m28-20v20" stroke="#fff9e9" strokeOpacity=".5" strokeWidth="3" />
      <rect x="27" y="32" width="10" height="11" rx="4" fill={look.skin} />
      <path d="M22 39q10 9 20 0l-3 9-14-1Z" fill={look.scarf} />
      <path d="m35 44 7 2-3 12-7-3Z" fill={look.scarf} />
      <ellipse cx="18" cy="26" rx="4" ry="5" fill={look.skin} />
      <ellipse cx="46" cy="26" rx="4" ry="5" fill={look.skin} />
      <rect x="18" y="11" width="28" height="29" rx="13" fill={look.skin} />
      <path d="M17 25V19C17 2 48 2 47 20v6l-5-9-7 2-8-4-6 11Z" fill={look.hair} />
      {["gold", "rose"].includes(color) && (
        <path d="m18 16-1-9 8 3 4-8 5 7 9-4 2 12Z" fill={look.hair} />
      )}
      {["violet", "blue"].includes(color) && (
        <>
          <path d="M17 20C16 1 47 1 48 20Z" fill={look.shirt} />
          <path d="M14 20h37" stroke={look.scarf} strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      <path d="m24 24 4-1m8 0 4 1" stroke={look.hair} strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="26" cy="28" rx="2.3" ry="2.8" fill="#fffdf5" />
      <ellipse cx="38" cy="28" rx="2.3" ry="2.8" fill="#fffdf5" />
      <circle cx="26.5" cy="28.4" r="1.3" fill="#243329" />
      <circle cx="38.5" cy="28.4" r="1.3" fill="#243329" />
      <path
        d="M29 34q3 3 6-1"
        fill="none"
        stroke="#593e30"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
