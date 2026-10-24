import type {
  DiceRolledEvent,
  DuelActionRequest,
  ShopChoiceRequest,
  ItemUseRequest,
  PotatoPassRequest,
  MinigameInputRequest,
  GameErrorEvent,
  HostCommand,
  JoinRoomRequest,
  PlayerMovingEvent,
  PlayerReadyRequest,
  RollRequest,
  RoomCreateRequest,
  RoomCreatedEvent,
  RoomJoinedEvent,
  TurnEndedEvent,
  TurnStartedEvent,
} from "./schemas"
import type { GameState, PublicPlayer } from "./state"

export const CLIENT_EVENTS = {
  ROOM_CREATE: "room.create",
  HOST_RESUME: "room.host.resume",
  ROOM_JOIN: "room.join",
  PLAYER_READY: "player.ready",
  GAME_START: "game.start",
  GAME_RESTART: "game.restart",
  DICE_ROLL_REQUEST: "dice.roll.request",
  DUEL_ACTION: "duel.action",
  SHOP_CHOICE: "shop.choice",
  ITEM_USE: "item.use",
  POTATO_PASS: "potato.pass",
  MINIGAME_INPUT: "minigame.input",
} as const

export const SERVER_EVENTS = {
  ROOM_CREATED: "room.created",
  ROOM_JOINED: "room.joined",
  ROOM_SNAPSHOT: "room.snapshot",
  PLAYER_JOINED: "player.joined",
  PLAYER_UPDATED: "player.updated",
  GAME_STARTED: "game.started",
  TURN_STARTED: "turn.started",
  DICE_ROLLED: "dice.rolled",
  PLAYER_MOVING: "player.moving",
  TURN_ENDED: "turn.ended",
  GAME_ERROR: "game.error",
} as const

export interface ClientToServerEvents {
  "room.create": (payload: RoomCreateRequest) => void
  "room.host.resume": (payload: HostCommand) => void
  "room.join": (payload: JoinRoomRequest) => void
  "player.ready": (payload: PlayerReadyRequest) => void
  "game.start": (payload: HostCommand) => void
  "game.restart": (payload: HostCommand) => void
  "dice.roll.request": (payload: RollRequest) => void
  "duel.action": (payload: DuelActionRequest) => void
  "shop.choice": (payload: ShopChoiceRequest) => void
  "item.use": (payload: ItemUseRequest) => void
  "potato.pass": (payload: PotatoPassRequest) => void
  "minigame.input": (payload: MinigameInputRequest) => void
}

export interface ServerToClientEvents {
  "room.created": (payload: RoomCreatedEvent) => void
  "room.joined": (payload: RoomJoinedEvent) => void
  "room.snapshot": (payload: GameState) => void
  "player.joined": (payload: PublicPlayer) => void
  "player.updated": (payload: PublicPlayer) => void
  "game.started": (payload: GameState) => void
  "turn.started": (payload: TurnStartedEvent) => void
  "dice.rolled": (payload: DiceRolledEvent) => void
  "player.moving": (payload: PlayerMovingEvent) => void
  "turn.ended": (payload: TurnEndedEvent) => void
  "game.error": (payload: GameErrorEvent) => void
}
