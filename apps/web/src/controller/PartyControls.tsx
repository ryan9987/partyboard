import { SHOP_ITEMS, GAME_REWARDS, type GameState, type Item } from "@party-board/protocol"
import { useEffect, useState } from "react"
import type { ControllerClient } from "./controller-client"
import { getDuelGesture } from "./duel-motion"
import { useGameNow } from "../networking/gameClock"
import { CoinCount } from "../app/CoinCount"
import { ItemGlyph } from "../app/PowerupNotice"
import { defaultBoard, getMovementPath } from "@party-board/board"
import { GameTutorial } from "../host/GameTutorial"

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
  const [dieValue, setDieValue] = useState(3)
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
  const itemUsed = me.itemUsedTurn === state.turnNumber
  const target = state.players.find((player) => player.id === targetId)
  const canTarget =
    !!target && target.connected && target.id !== me.id && !target.frozen && !target.frostWard
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
                ? `You win · +${GAME_REWARDS.minigameWinner} coins!`
                : `Well played · +${GAME_REWARDS.minigameParticipation} coin`
              : !alive
                ? "You're out. Cheer them on!"
                : canPass
                  ? "Pass it!"
                  : `${holder?.name ?? "Someone"} has it`}
        </h2>
        {game.stage === "intro" ? (
          <GameTutorial kind="potato" mode={motionEnabled ? "motion" : "touch"} />
        ) : game.stage === "active" ? (
          <p>{motionEnabled ? "Flick or tap to pass." : "Tap to pass. Watch the host screen."}</p>
        ) : null}
        {game.stage === "active" && (
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
              : "Returning to the trail…"}
        </p>
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
        <p className="shop-no-rush">
          One purchase per stop · one power-up per turn. No time limit.
        </p>
        {shopper?.id === me.id ? (
          <>
            <div className="shop-choices">
              {Object.entries(SHOP_ITEMS).map(([id, item]) => (
                <button
                  key={id}
                  type="button"
                  disabled={
                    (me.coins ?? 0) < item.price ||
                    (me.inventory?.length ?? 0) >= 3 ||
                    (id === "freeze" && state.players.length < 2)
                  }
                  onClick={() => client.chooseShop(id as Item)}
                >
                  <ItemGlyph item={id as Item} />
                  <strong>
                    {item.name} · {item.price} coins
                  </strong>
                  <small>{item.description}</small>
                  {(me.inventory?.length ?? 0) >= 3 ? (
                    <small>Pack full · use an item next turn</small>
                  ) : (
                    (me.coins ?? 0) < item.price && (
                      <small>
                        Need {item.price - (me.coins ?? 0)} more{" "}
                        {item.price - (me.coins ?? 0) === 1 ? "coin" : "coins"}
                      </small>
                    )
                  )}
                  {id === "freeze" && state.players.length < 2 && <small>Needs an opponent</small>}
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
  if (!myTurn || !(me.inventory ?? []).length) return null
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
            {itemUsed
              ? "Power-up used this turn. Roll when ready."
              : "Choose one power-up before your roll. No rush."}
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
              disabled={!!pendingItem || itemUsed}
              onClick={() => client.setChoosingItem(!choosingItem)}
            >
              {choosingItem ? "Back to roll" : "Use a power-up"}
            </button>
          )}
          {choosingItem && (me.inventory ?? []).includes("freeze") && (
            <label>
              Frost target
              <select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
                <option value="">Choose an opponent</option>
                {state.players
                  .filter((player) => player.id !== me.id && player.connected)
                  .map((player) => (
                    <option
                      key={player.id}
                      value={player.id}
                      disabled={player.frozen || player.frostWard}
                    >
                      {player.name}
                      {player.frozen || player.frostWard
                        ? " · thaw protected"
                        : player.shield
                          ? " · shielded"
                          : ""}
                    </option>
                  ))}
              </select>
              <small>
                Frost never skips turns. Thaw protection guarantees a normal roll before another
                Frost.
              </small>
              {!state.players.some(
                (player) =>
                  player.id !== me.id && player.connected && !player.frozen && !player.frostWard,
              ) && <small>No eligible opponents right now. Keep the charm for a later turn.</small>}
            </label>
          )}
          {choosingItem && (me.inventory ?? []).includes("compass") && (
            <label>
              Compass die
              <select
                value={dieValue}
                onChange={(event) => setDieValue(Number(event.target.value))}
              >
                {[1, 2, 3, 4, 5, 6].map((value) => {
                  const spaces = Math.max(1, value - (me.frozen ? 2 : 0))
                  const path = getMovementPath(defaultBoard, me.tileId, spaces)
                  const end = path.at(-1) ?? me.tileId
                  return (
                    <option key={value} value={value}>
                      {value} · move {path.length} →{" "}
                      {end === defaultBoard.finishTileId
                        ? "Finish!"
                        : end.replace("tile-", "Space ")}
                    </option>
                  )
                })}
              </select>
              <small>
                The die shows your choice. Frost, if active, still reduces your movement.
              </small>
            </label>
          )}
          {choosingItem && (
            <div className="shop-choices">
              {(me.inventory ?? []).map((item, index) => (
                <button
                  key={`${item}-${index}`}
                  disabled={
                    !client.canUseItem() ||
                    (item === "freeze" && !canTarget) ||
                    (item === "boots" && me.boosted) ||
                    (item === "clover" && me.lucky) ||
                    (item === "compass" && !!me.plannedRoll) ||
                    (item === "shield" && me.shield)
                  }
                  onClick={() =>
                    client.useItem(
                      item,
                      item === "freeze" ? targetId : undefined,
                      item === "compass" ? dieValue : undefined,
                    )
                  }
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
    </section>
  )
}
