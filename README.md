# rpg-text

A narrative RPG application developed through demonstrable vertical features.

The repository contains a deterministic, configurable combat core exposed through a server-owned application boundary and a browser client connected by REST. Combat is played through deterministic Spanish natural-language commands and semantic narrative text. Persistence and world exploration remain future work.

## Current state

The implemented foundation supports:

- ECS entities and components;
- configurable multi-participant combat;
- factions and controller assignment;
- initiative, turns, and rounds;
- structured `ATTACK`, `DODGE`, and `PASS` actions;
- structured validation failures;
- equipment-derived and unarmed attacks;
- inventory, weapons, armor, shields, and combat conditions;
- deterministic seeded random generation;
- snapshots, intent history, and structured events;
- defeat handling and faction victory;
- reusable sample characters, monsters, and equipment;
- automated tests.

## Run the simulator

```bash
npm run game
```

Available CLI commands:

```text
status
inspect <entityId>
attack <entityId>
dodge
pass
events
quit
```

## Run tests

```bash
npm test
```

Package-specific commands are `npm run test:server`, `npm run test:client`, and `npm run test:integration`. `npm run server` starts the REST API at `http://localhost:3000`; `npm run client` starts the browser host at `http://localhost:4173`; `npm run dev` starts both.

## Demonstrate encounter setup

1. Run `npm run dev`.
2. Open `http://localhost:4173` in a browser.
3. Select a character, then select one or more creatures.
4. Assign each selected participant to Party or Hostiles.
5. Select Open Field on the Scenario tab.
6. Review the summary and press Start combat.
7. Type `Ataco al goblin`, `Esquivo`, or `Paso` and submit when the command is resolved.
8. Continue through server-controlled creature turns until the final result appears.

The browser loads all content through REST and sends the setup to `POST /api/combat-sessions`. The combat screen previews Spanish commands through `/interpret` and executes them through `/commands`; the server converts them to existing ATTACK, DODGE, and PASS intents. Chat renders authoritative semantic segments with tooltips. Open Field currently supplies setup metadata only; distance, cover, and terrain do not alter combat rules yet. Restarting the server removes sessions.

Combat presentation uses the existing `client/public/sounds/key-press.mp3`, `dice.mp3`, and `dices.mp3` assets. New narrative messages are queued in authoritative order and typewrite progressively; dice messages appear complete with dedicated cues. Sound, master volume, text animation, reduced-motion behavior, skip, and persisted presentation preferences are available in the combat screen.

## Codespaces connection

The browser first uses relative `/api` requests through the client development proxy. If that path is unavailable, it tries the current development Codespaces fallback, and the Server connection panel accepts a backend base URL without `/api/health`. Values can be tested, saved in local storage, reset to automatic mode, and retried. The current forwarded development example is `https://shiny-winner-g4qwrwp65g593vg7w-3000.app.github.dev`; it is not a production endpoint.

## REST endpoints

- `GET /api/health`
- `GET /api/encounter/characters`
- `GET /api/encounter/creatures`
- `GET /api/encounter/scenarios`
- `POST /api/encounter/validate`
- `POST /api/combat-sessions`
- `GET /api/combat-sessions/:sessionId`
- `GET /api/combat-sessions/:sessionId/events`
- `POST /api/combat-sessions/:sessionId/intents`
- `POST /api/combat-sessions/:sessionId/interpret`
- `POST /api/combat-sessions/:sessionId/commands`

## Application structure

```text
client/
  public/            browser entry document
  src/app/           application shell, state, and static dev host
  src/screens/       encounter setup and combat screens
  src/components/    setup, semantic chat, command composer, participants, and connection controls
  src/services/      centralized HTTP service
  src/styles/        client foundation styles
  tests/              HTTP service and state tests

server/
  src/http/          composed REST transport, routes, middleware, presenters
  src/application/  encounter/session use cases and AI orchestration
  src/game/          authoritative combat simulation
  src/content/      canonical definitions and catalogs
  src/infrastructure/ temporary in-memory session adapter
  src/cli/           developer adapter
  tests/             game, boundary, application, and HTTP tests

shared/
  public contracts shared by client and server

tests/integration/
  cross-boundary tests
```

The former `src/game`, `src/content`, and `src/cli` paths have been physically moved under `server/src`. There is no duplicate legacy core.

## Development approach

The project is built through playable vertical slices.

Early progression:

```text
preserve and restructure the current combat core
  -> build encounter setup frontend
  -> render real combat state and events
  -> submit a real player action
  -> complete combat through the UI
  -> persist survivors and experience
```

The frontend is part of the early product. It is not postponed until every server or simulation subsystem is complete. Encounter setup and complete browser combat are connected to REST; Spanish command interpretation and semantic event presentation are implemented, while persistence remains the next product slice.

## Documentation

Read in this order:

1. [`docs/CURRENT_CONTEXT.md`](docs/CURRENT_CONTEXT.md) — current implemented state and immediate next milestone.
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — ownership, dependency direction, and target structure.
3. [`docs/PRODUCT_DECISIONS.md`](docs/PRODUCT_DECISIONS.md) — accepted product behavior and scope.
4. [`docs/FRONTEND_DESIGN.md`](docs/FRONTEND_DESIGN.md) — visual and interaction direction preserved from the earlier prototypes.
5. [`docs/DEVELOPMENT_STRATEGY.md`](docs/DEVELOPMENT_STRATEGY.md) — feature-driven AI implementation workflow.
6. [`docs/ROADMAP.md`](docs/ROADMAP.md) — demonstrable milestone sequence.
7. [`docs/VISION.md`](docs/VISION.md) — long-term product direction.
8. [`AGENTS.md`](AGENTS.md) — mandatory repository instructions for implementation agents.

## Architectural rule

The game core is authoritative.

The server application owns session use cases, server-side AI turns, and delegates all outcomes to `server/src/game`. `server/src/application/createApplication.js` is the composition root for catalogs, use cases, and the temporary in-memory repository. The client uses a centralized HTTP service and does not import server modules, ECS, systems, rules, component stores, or mutable simulation objects. Persistence, authentication, and multiplayer are not implemented.
