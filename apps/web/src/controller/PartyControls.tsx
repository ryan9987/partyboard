import { SHOP_ITEMS, type GameState, type Item } from "@party-board/protocol"
import { useEffect, useState } from "react"
import type { ControllerClient } from "./controller-client"
import { getDuelGesture } from "./duel-motion"
import { useGameNow } from "../networking/gameClock"
import { CoinCount } from "../app/CoinCount"
import { ItemGlyph } from "../app/PowerupNotice"

export function PartyControls({
  client,
  state,
  playerId,
  motionEnabled,
}: {
  client: ControllerClient
  state: GameState
  playerId: string | null
  motionEnabled: boolean
}) {
  const me = state.players.find((player) => player.id === playerId)
  const [targetId, setTargetId] = useState("")
  const now = useGameNow(state.serverTime)
  const canPass = client.canPass()
  const { choosingItem, pendingItem } = client.getSnapshot()
  const myTurn = state.phase === "AWAITING_ROLL" && state.currentPlayerId === me?.id
  useEffect(() => {
    if (!motionEnabled || !canPass) return
    const motion = (event: DeviceMotionEvent) => {
      if (getDuelGesture(event) === "swing") client.passPotato()
    }
    window.addEventListener("devicemotion", motion)
    return () => window.removeEventListener("devicemotion", motion)
  }, [client, motionEnabled, canPass])
  if (!me) return null
  const game = state.potato
  if (state.phase === "POTATO" && game) {
    const holder = state.players.find((player) => player.id === game.holderId)
    const winner = state.players.find((player) => player.id === game.winnerId)
    const alive = game.aliveIds.includes(me.id)
    return (
      <section className="party-controller" aria-label="Hot Potato controller">
        <p className="duel-kicker">Round {state.roundNumber ?? 1} · Hot Potato</p>
        <h2>
          {game.stage === "intro"
            ? "Don't hold the hot acorn!"
            : game.stage === "result"
              ? winner?.id === me.id
                ? "You win · +8 coins!"
                : "Well played · +2 coins"
              : !alive
                ? "You're out. Cheer them on!"
                : canPass
                  ? "Pass it!"
                  : `${holder?.name ?? "Someone"} has it`}
        </h2>
        <p>Flick your wrist or tap to pass clockwise. Last player standing wins 8 coins.</p>
        {game.stage !== "result" && (
          <button
            className="controller-roll"
            type="button"
            disabled={!canPass}
            onClick={() => client.passPotato()}
          >
            Pass acorn
          </button>
        )}
        <p role="status">
          {game.stage === "active"
            ? `${Math.max(0, Math.ceil((game.fuseAt - now) / 1000))} seconds until it pops`
            : game.stage === "intro"
              ? "Get ready…"
              : "Continue on the host when everyone is ready."}
        </p>
        <p>Your purse: {me.coins ?? 0} coins</p>
      </section>
    )
  }
  if (state.phase === "SHOP" && state.shop) {
    const shopper = state.players.find((player) => player.id === state.shop!.playerId)
    return (
      <section className="party-controller" aria-label="Trail shop">
        <p className="duel-kicker">Wildwood Market</p>
        <h2>
          {shopper?.id === me.id
            ? "Something for the trail?"
            : `${shopper?.name ?? "A player"} is shopping`}
        </h2>
        <p>
          <CoinCount coins={me.coins ?? 0} /> · {(me.inventory ?? []).length}/3 pack slots
        </p>
        <p className="shop-no-rush">No time limit. Read the items, then buy one or keep walking.</p>
        {shopper?.id === me.id ? (
          <>
            <div className="shop-choices">
              {Object.entries(SHOP_ITEMS).map(([id, item]) => (
                <button
                  key={id}
                  type="button"
                  disabled={(me.coins ?? 0) < item.price || (me.inventory?.length ?? 0) >= 3}
                  onClick={() => client.chooseShop(id as Item)}
                >
                  <ItemGlyph item={id as Item} />
                  <strong>
                    {item.name} · {item.price} coins
                  </strong>
                  <small>{item.description}</small>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => client.chooseShop("skip")}>
              Keep walking
            </button>
          </>
        ) : (
          <p>The trail waits while they choose. No time limit.</p>
        )}
      </section>
    )
  }
  return (
    <section className="inventory-controller" aria-label="Your items">
      <div className="inventory-heading">
        <strong>Your pack</strong>
        <span>{(me.inventory ?? []).length}/3 items</span>
      </div>
      {state.notice && !state.itemEffect && (
        <p className="party-notice" role="status">
          {state.notice}
        </p>
      )}
      {(me.inventory ?? []).length > 0 && (
        <>
          <p className="inventory-help">
            {myTurn
              ? "Use a power-up before your roll. No rush."
              : "Your power-ups are ready for your next turn."}
          </p>
          <div className="inventory-summary">
            {(me.inventory ?? []).map((item, index) => (
              <span key={`${item}-${index}`}>
                <ItemGlyph item={item} />
                {SHOP_ITEMS[item].name}
              </span>
            ))}
          </div>
          {myTurn && (
            <button
              type="button"
              disabled={!!pendingItem}
              onClick={() => client.setChoosingItem(!choosingItem)}
            >
              {choosingItem ? "Back to roll" : "Use a power-up"}
            </button>
          )}
          {choosingItem && (me.inventory ?? []).includes("freeze") && (
            <label>
              Freeze target
              <select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
                <option value="">Choose an opponent</option>
                {state.players
                  .filter((player) => player.id !== me.id && player.connected && !player.frozen)
                  .map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                      {player.shield ? " · shielded" : ""}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {choosingItem && (
            <div className="shop-choices">
              {(me.inventory ?? []).map((item, index) => (
                <button
                  key={`${item}-${index}`}
                  disabled={
                    !client.canUseItem() ||
                    (item === "freeze" && !targetId) ||
                    (item === "boots" && me.boosted) ||
                    (item === "shield" && me.shield)
                  }
                  onClick={() => client.useItem(item, item === "freeze" ? targetId : undefined)}
                >
                  <ItemGlyph item={item} />
                  <strong>
                    {pendingItem?.item === item ? "Activating…" : `Use ${SHOP_ITEMS[item].name}`}
                  </strong>
                  <small>{SHOP_ITEMS[item].description}</small>
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {!(me.inventory ?? []).length && (
        <p className="inventory-help">Your pack is empty. Pick up a power-up at a market.</p>
      )}
      <p>
        {[
          me.frozen ? "Frozen next turn" : "",
          me.shield ? "Shield active" : "",
          me.boosted ? "Next roll +2" : "",
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </section>
  )
}
