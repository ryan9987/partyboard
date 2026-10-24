export function CoinCount({ coins }: { coins: number }) {
  return (
    <span className="coin-count" aria-label={`${coins} coins`}>
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="#e7c26b" stroke="#957232" strokeWidth="1.2" />
        <circle cx="10" cy="10" r="5.5" fill="none" stroke="#b38b40" strokeWidth="0.8" />
        <path
          d="M10 6.5v7M8 7h3M8 13h3"
          fill="none"
          stroke="#89672c"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      <strong aria-hidden="true">{coins}</strong>
    </span>
  )
}
