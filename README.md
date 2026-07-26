# Bingo

Multiplayer bingo. React frontend and a single Node server that serves both the REST
endpoints and the game WebSocket on one port, with Redis as the source of truth.

## Running with Docker

```bash
cp .env.example .env
docker compose up --build
```

| Service | URL | Notes |
| --- | --- | --- |
| web | http://localhost:5180 | nginx serving the built frontend |
| server | http://localhost:8080 | REST + WebSocket on the same port |
| redis | internal only | live game state |
| mongo | internal only | users and game history |

Ports are overridable in `.env` (`WEB_PORT`, `SERVER_PORT`). The frontend reads its API
and socket URLs at build time, so change those vars *before* `docker compose build`.
Keep the server on 8080 unless you also update the Google redirect URI.

## Layout

```
backend          the only backend service — REST, WebSocket, game logic
frontend         React client
```

## Running locally

```bash
cd backend        && npm install && npm run dev   # port 8080, needs REDIS_URL
cd frontend       && npm install && npm start     # port 5173
```

The server needs Redis: `docker run -p 6379:6379 redis:7-alpine`.

## HTTP endpoints

Served by the same process and port as the WebSocket, since the `WebSocketServer` is
attached to the Node `http` server rather than owning the port itself.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | none | liveness, used by the compose health check |
| GET | `/api/login/guest?userName=` | none | issues a guest JWT; name is optional |
| GET | `/api/auth/google` | none | redirects to Google consent |
| GET | `/api/auth/google/callback` | none | Google redirects here, then back to the app with a token |
| GET | `/api/auth/me` | Bearer | current token's identity |
| GET | `/api/game/id` | Bearer | suggests an unused game code |
| GET | `/api/game/history` | Bearer | games this user has played |
| GET | `/api/game/:gameId` | Bearer | one game, if the user played in it |

## Google login

Register the redirect URI in the Google console exactly as
`http://localhost:8080/api/auth/google/callback`, then set `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URL` in `.env`. Because that URI is
registered against port 8080, the server must be reachable on 8080 for login to work.

The flow is server-side: `/api/auth/google` mints a CSRF `state` into Redis and
redirects to Google; the callback verifies and consumes that state, exchanges the code
for a token, upserts the user in Mongo keyed on `(provider, providerId)`, then redirects
to `FRONTEND_URL/?token=<jwt>`. The client stores the token and strips it from the URL.

## Persistence

Redis stays the source of truth for live games. Mongo is the durable record:

- a background worker (`SYNC_INTERVAL_MS`, default 10s) scans live games in Redis and
  upserts them as `status: "active"`. Only one instance runs a given tick, guarded by a
  Redis lock.
- when a game ends, its final snapshot is written as `status: "completed"` before the
  Redis keys are dropped.

## Matchmaking

`FIND_MATCH` puts a player in a Redis queue bucketed by `(totalMatchesCount,
totalPlayersCount)`. When the bucket has enough players they are popped under a lock, a
game is created, and every matched player gets `MATCH_FOUND` with the game id. The first
player in the match is the admin. `CANCEL_FIND_MATCH` leaves the queue, and disconnecting
does so automatically. Players matched on different server instances are joined to the
room over a Redis pub/sub channel, so this works with more than one server.

## Playing a bot

`PLAY_BOT { totalMatchesCount, botCount }` creates a solo game against one or more
bots. The room is opened immediately (there is no lobby to wait in) and the bots'
boards are pre-filled, so you go straight to filling your own.

Bots are ordinary players in the engine — entries in the player list with
`isBot: true`. They appear in the player list and leaderboard, their boards are
included in the end-of-match reveal, and the game is persisted to history exactly
like a human game. Nothing in the game rules is special-cased for them.

**The bot cannot see your board.** All of its logic lives in `services/bot`, which
imports only pure board helpers — it has no reference to `Game` and no access to the
`boards` map. `Game` exposes a single accessor:

```ts
getBotView(userId) -> { board, movesPlayed }
```

which throws unless the id belongs to a bot, and returns a *copy* of that bot's own
board plus the publicly called numbers. Adding a cheating bot would require changing
that signature rather than quietly reading another board.

Strategy is a greedy one-ply lookahead: for each uncalled number it simulates the
call and counts how many of its own lines would complete, taking the best and
breaking ties at random. Note this only rewards lines that complete *immediately* —
it has no notion of a line sitting at 4/5 — so for most of a match every candidate
ties at zero and the choice is effectively random. Its real edge is that it never
misses a completing call and never forgets to claim.

A bot claims bingo as soon as it holds five lines, on anyone's turn, not just its
own. Because a claim credits every player holding a bingo at that instant, a bot
claiming first never costs you a win you had earned.

## Environment

| Variable | Default |
| --- | --- |
| `JWT_SECRET` | `dummy_secret` |
| `PORT` | 8080 |
| `REDIS_URL` | `redis://localhost:6379` |
| `MONGO_URL` | `mongodb://localhost:27017` |
| `MONGO_DB` | `bingo` |
| `SYNC_INTERVAL_MS` | 10000 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | empty (login disabled) |
| `GOOGLE_REDIRECT_URL` | `http://localhost:8080/api/auth/google/callback` |
| `FRONTEND_URL` | `http://localhost:5180` |
| `TOKEN_EXPIRY` | `1d` |
| `TURN_TIMEOUT_MS` | 30000 |
| `BOT_MOVE_DELAY_MS` | 1200 |
| `BOT_CLAIM_DELAY_MS` | 900 |
| `HEARTBEAT_INTERVAL_MS` | 30000 |
| `GAME_TTL_SECONDS` | 21600 |

## Socket protocol

Connect with `ws://host/?token=<jwt>`. Every message is JSON with a `type` and a
`gameId`.

Encoding lives in `src/protocol/codec.ts` — `encode` and `decode` are the only two
places the wire format is decided, so swapping JSON for MessagePack or anything else
is a change to that one file. Note the Redis storage format and the internal pub/sub
envelopes are deliberately separate from this, and stay JSON so they remain readable
with `redis-cli`.

Incoming messages are validated against zod schemas in `src/protocol/messages.ts`
before any handler sees them, so handlers receive fully typed, range-checked data.
Numeric fields are coerced, so `"5"` and `5` are both accepted. Rejections come back
as `ERROR` naming the offending field, e.g. `position: Too small: expected number to
be >=1`.

Client to server: `CREATE_GAME`, `JOIN_GAME`, `LEAVE_GAME`, `FIND_MATCH`,
`CANCEL_FIND_MATCH`, `PLAY_BOT`, `OPEN_GAME`,
`FILL_NUMBERS`, `RANDOM_FILL`, `NUMBER_FILLED`, `START_GAME`, `MOVE`, `BINGO`,
`RESTART_MATCH`.

Server to client: `GAME_CREATED`, `GAME_JOINED`, `SEEKING`, `MATCH_FOUND`,
`SEEK_CANCELLED`, `USER_JOINED`, `USER_LEFT`,
`GAME_OPENED`, `NUMBER_FILLED`, `BOARD_FILLED`, `WAITING_FOR_OTHER_PLAYERS`,
`ALL_PLAYERS_FILLED_MOVE`, `GAME_STARTED`, `MOVE`, `MATCH_END`, `MATCH_START`,
`GAME_OVER`, `GAME_ENDED`, `RECONNECTED`, `GAME_STATE`, `GAME_NOT_FOUND`, `ERROR`.

`GAME_STATE` is a full snapshot — board, moves played, whose turn it is, turn
deadline, player list, and leaderboard. It is sent after every state change and on
reconnect, so a client can render purely from it.

## Game flow

`WAITING_TO_START` → `FILLING_NUMBERS` → `FILLED_NUMBERS` → `GAME_IN_PROGRESS` →
`MATCH_OVER` (or `GAME_OVER` after the last match). The first player to join is the
admin and is the only one who can open, start, or restart.

Five completed lines wins. A player claims their own bingo with `BINGO`; everyone
holding a completed board at that moment is credited. If a turn expires the server
plays a random uncalled number for that player, and if all 25 numbers are exhausted
the match ends on its own.
