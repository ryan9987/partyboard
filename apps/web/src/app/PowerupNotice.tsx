import { SHOP_ITEMS, type GameState, type Item } from "@party-board/protocol"

export function ItemGlyph({ item }: { item: Item }) {
  return (
    <svg
      className={`powerup-symbol powerup-symbol--${item}`}
      viewBox="0 0 32 32"
      width="30"
      height="30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {item === "freeze" ? (
        <path d="M16 3v26M5 9l22 14M5 23 27 9M12 5l4 4 4-4M12 27l4-4 4 4M5 14l5-2-1-5M23 25l-1-5 5-2M5 18l5 2-1 5M23 7l-1 5 5 2" />
      ) : item === "shield" ? (
        <>
          <path d="M16 3 27 8v9c0 6-8 11-11 13C13 28 5 23 5 17V8Z" />
          <path d="M11 21c-3-7 1-11 11-12 0 10-3 14-9 12M11 23l8-11M15 18l-1-4M16 17l4 1" />
        </>
      ) : item === "clover" ? (
        <>
          <path d="M16 16C1 15 6 2 13 7l3 5 3-5c7-5 12 8-3 9Zm0 0c15 1 10 14 3 9l-3-5-3 5C6 30 1 17 16 16Z" />
          <path d="M16 19c0 5-2 8-5 10" />
        </>
      ) : item === "compass" ? (
        <>
          <circle cx="16" cy="17" r="11" />
          <path d="M13 4h6M16 6V3m0 5v2m9 7h-2m-7 7v2M7 17h2m11-6-2 8-6 4 2-8Z" />
        </>
      ) : (
        <>
          <path d="M7 4h10v13l9 4v7H5v-9l2-3Z" />
          <path d="M6 24h20M11 9h5M11 13h5" />
        </>
      )}
    </svg>
  )
}

export function PowerupNotice({ state, host = false }: { state: GameState; host?: boolean }) {
  const effect = state.itemEffect
  if (!effect) return null
  return (
    <section
      key={effect.id}
      className={`powerup-notice${host ? " powerup-notice--host" : ""}`}
      role="status"
      aria-label="Power-up used"
    >
      <span className={`item-glyph item-glyph--${effect.item}`}>
        <ItemGlyph item={effect.item} />
      </span>
      <div>
        <small>
          {SHOP_ITEMS[effect.item].name} · {effect.blocked ? "blocked" : "activated"}
        </small>
        <p>{effect.message}</p>
      </div>
    </section>
  )
}
