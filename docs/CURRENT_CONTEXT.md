# Current Context

Last updated: 2026-07-31

## Repository

- Repository: `WalterDevIn/rpg-text`
- Working branch: `master`
- Runtime: Node.js 20+
- Module system: ECMAScript modules
- Current package version: `0.2.0`

## Product direction

`rpg-text` is becoming a client/server narrative RPG application.

Target top-level ownership:

```text
client/
  graphical narrative interface

server/
  API, sessions, persistence, content, and authoritative game core

shared/
  public contracts shared by client and server
```

The game core belongs inside `server/` because the server will host the authoritative simulation.

Development is feature-driven. The frontend is included from the first meaningful milestones rather than postponed until the server and simulation are complete.

## Current implementation

The repository now contains the preserved combat simulator under server ownership, category-specific content catalogs, explicit application use cases, deterministic Spanish command interpretation, semantic event presentation, a repository-backed REST API, shared public contracts, and a browser client connected through HTTP.

Documented current paths:

```text
server/src/game/ecs
server/src/game/components
server/src/game/entities
server/src/game/intents
server/src/game/rules
server/src/game/random
server/src/game/events
server/src/game/systems
server/src/game/simulation
server/src/content
server/src/cli
server/src/application
server/src/http
server/src/content/catalog
server/src/infrastructure/persistence
server/src/language/spanish
server/src/game/combat/getActionContext.js
server/src/application/interpretation
server/src/application/presentation
client/src/audio
client/src/features/combatChat
server/tests
client/src/app
client/src/screens
client/src/components
client/src/services
client/src/services/eventPresenter.js
client/public
shared/src/contracts
tests/integration
mobile/src
mobile/tests
```

Current commands:

```bash
npm run game
npm test
npm run client
npm run server:cli
npm run server
npm run dev
npm run mobile
npm run test:mobile
```

`npm run server` serves REST at `http://localhost:3000`. `npm run client` serves the browser application at `http://localhost:4173`. `npm run dev` starts both.

Additional focused commands are `npm run test:server`, `npm run test:client`, and `npm run test:integration`.

The CLI currently accepts:

```text
status
inspect <entityId>
attack <entityId>
dodge
pass
events
quit
```

## Current combat capabilities

The existing implementation already supports:

- ECS entities and independent components;
- configurable combat construction;
- multiple participants;
- factions;
- controller assignment by combatant;
- individual initiative;
- turn order and rounds;
- structured `ATTACK`, `DODGE`, and `PASS` actions;
- structured rejection of invalid actors, turns, and targets;
- equipped-weapon and unarmed attacks;
- inventory;
- weapons, armor, and shields;
- combat conditions;
- dodge disadvantage until the next turn;
- damage and defeat;
- skipping defeated participants;
- faction victory;
- seeded deterministic random generation;
- snapshots;
- intent history;
- structured events;
- reusable warrior, mage, goblin, cave-rat, and slime content;
- reusable weapon and armor content;
- automated tests for core behavior.

## Important decision

Do not restart the game core from zero.

The existing simulation is the foundation to migrate and expose through the product. Structural work must preserve behavior, commands where still useful, and tests.

## Frontend reference preserved in this repository

The original visual reference exists in another repository, but all accepted decisions are now documented in `docs/FRONTEND_DESIGN.md`.

Primary identity:

- deep black background;
- subtle centered radial gradient;
- monospaced typography;
- thin light borders;
- minimal red/blue chromatic fringe;
- cyan context/selection accent;
- green friendly accent;
- orange action accent;
- red hostile accent;
- violet dice accent;
- encounter setup cards;
- narrative chat as the dominant surface;
- player messages on the right;
- DM, dice, and creature messages on the left;
- discreet context information.

The frontend should not adopt a generic blue-gray dashboard style.

## Mobile client

The Expo SDK 54 mobile client is implemented under `mobile/`. It persists a user-configured server URL, checks the REST health endpoint, loads server-owned encounter catalogs, validates and creates real combat sessions, renders authoritative events, interprets Spanish commands, submits resolved commands, and reloads snapshots/events after background recovery. It uses the same public REST boundary as the browser client and does not import server game code.

The application flow now has an explicit connection screen, Home screen, recoverable Continue Combat entry, four-step New Combat flow (participants, scenario, rules, and review), catalog-backed Add Participant, Creation Hub, and Settings routes. The setup draft preserves source IDs, encounter instance keys, side assignments, controller values, scenario, supported rules, and current step through versioned local storage. The structured server contract validates and applies each participant's side and controller, supports duplicate source templates through instance keys, and preserves the legacy array contract for existing consumers. Creation Hub entries are visibly disabled and have no side effects.

Mobile commands are `npm run mobile`, `npm run mobile:start`, and `npm run test:mobile`. The mobile package also provides `npm --prefix mobile run android`, `npm --prefix mobile run ios`, and `npm --prefix mobile run doctor`.

Mobile combat uses a compact safe-area-aware top bar with the scenario name and a floating combat overview for participants, scenario details, round, and active actor. The permanent participant cards and round/status header were removed from the normal chat layout. Consecutive visible messages group by stable sender identity and only the first message shows the sender label. Commands submitted by a manual actor are right-aligned under that actor's authoritative name; server-controlled creature messages remain left-aligned. The command composer is a single-line input with keyboard-only Send behavior and no visible send control.

Mobile semantic presentation is implemented. Structured server segments retain their kinds and reference IDs during progressive rendering. Completed references open a local inspector for public character, creature, item, spell, action, damage, and dice details. Interpretation previews render authoritative annotations, action/actor/target details, status feedback, and ambiguity or incomplete-command suggestions. `DAMAGE` remains distinct from and takes precedence over `DICE_ROLL` visually.

Mobile live presentation uses an ordered queue with immediate historical restoration, immediate local player commands, Unicode-safe non-dice typewriting, dice completion, initiative batching, ordinary dice spacing, skip, sound preferences, reduced-motion behavior, and one accessibility announcement per completed output message. The visible send button was removed; resolved commands submit only through the keyboard Send action. Expo `expo-audio` plays locally bundled copies of the existing key-press and dice assets. Platform-neutral timing, dice, typewriter, and semantic-prefix helpers are shared from `shared/src/clientPresentation.js`; native audio, storage, UI, and navigation remain mobile-specific.

## Current milestone

Milestone 5: complete playable combat through the browser and mobile clients.

The repository now documents:

- vision;
- product decisions;
- architecture;
- frontend design;
- development strategy;
- roadmap;
- current context;
- implementation-agent instructions.

## Completed migration

The core and content were physically moved under `server/src`, existing game tests were moved under `server/tests`, and cross-boundary application coverage was added under `tests/integration`. `server/src/application/createApplication.js` composes catalogs, application use cases, and the temporary in-memory repository. `server/src/http/app.js` exposes those use cases through focused REST routes, middleware, and presenters.

Expected result:

```text
client/
server/src/game/
server/src/content/
server/src/application/
shared/
```

The migration keeps these demonstrations working:

```bash
npm test
npm run game
```

The client workspace is browser-runnable. Encounter setup and the narrative combat screen are implemented through REST.

## Completed encounter setup

The client now loads server-owned human fighter, human wizard, goblin, cave rat, slime, and Open Field summaries through the service boundary. Characters, creatures, and scenario are separate accessible tabs. Client state retains selections and side assignments while tabs change. Server validation requires opposing sides, known participants, and a known scenario before creating a real combat session.

Scenario data is currently metadata-only: Open Field exposes a 30-foot starting distance with no cover or difficult terrain, but the existing simulation does not yet consume those values.

## REST connection

The browser loads characters, creatures, and scenarios from the REST API, validates setup through `POST /api/encounter/validate`, and creates sessions through `POST /api/combat-sessions`. It previews Spanish commands through `/interpret`, executes resolved text through `/commands`, renders original player text with authoritative annotations, and renders event semantic segments with tooltip references. The server automatically resolves AI-controlled turns with a bounded deterministic target-selection policy. Combat sessions are held in memory and disappear when the server restarts.

The supported parser scope is deterministic Spanish ATTACK, DODGE, and PASS phrasing. It returns `RESOLVED`, `INCOMPLETE`, `AMBIGUOUS`, `UNSUPPORTED`, or `INVALID_CONTEXT`; it never silently selects an ambiguous target. Recognized unsupported spell phrases such as `Lanzo bola de fuego` receive SPELL semantics but are not executed. Semantic presentation supports CHARACTER, CREATURE, ITEM, SPELL, ACTION, DAMAGE, and DICE_ROLL, with DAMAGE taking priority over DICE_ROLL.

Combat message presentation is client-owned. `key-press.mp3`, `dice.mp3`, and `dices.mp3` are loaded through bounded audio pools. New non-dice messages enter through an ordered queue, typewrite at 24 ms per character and 65 ms for listed punctuation, and play the typewriter cue per revealed character. Dice entries are complete, use their dedicated cue, and ordinary rolls are separated by 1000 ms; initiative rolls are batched. Sound, master volume, text animation, reduced motion, skip, and historical reconnection behavior are implemented in the client.

The client uses relative `/api` through the development proxy first, then the current Codespaces development fallback, with a user-configurable backend URL persisted locally. The example forwarded backend is `https://shiny-winner-g4qwrwp65g593vg7w-3000.app.github.dev`; it is development-only.

The mobile connection screen also exposes `Codespaces Development` as a predefined origin, while retaining custom server entry. Origin-only addresses are normalized centrally and health checks request `/api/health` with a 10-second timeout, structured diagnostics, retry/change actions, and Codespaces public-port guidance. The current mobile version is `0.1.0` from Expo metadata and is shown on Connection and Settings; it matches `mobile/app.json` and `mobile/package.json`.

The mobile visual system uses Expo-loaded Space Mono for technical/display text and the platform sans-serif fallback for readable body/chat text. Centralized tokens live in `mobile/src/theme/colors.js`, `typography.js`, `metrics.js`, and `styles.js`; existing screen behavior, chat alignment/grouping, semantic interactions, audio, and reduced-motion behavior are unchanged.

## Next implementation milestone

Milestone 6: persistent survivors and experience. The next slice should preserve finished combat consequences beyond an in-memory server restart.

## Immediate implementation constraints

1. Work on `master`.
2. Read `AGENTS.md` first.
3. Preserve existing combat behavior.
4. Do not duplicate rules in the client.
5. Do not implement world exploration, persistence, authentication, or multiplayer during the current transport milestone.
6. Do not create empty architecture for distant features.
7. Keep root commands coherent and documented.
8. Update this file after each meaningful feature.

## Authoritative documentation order

When documents appear to conflict, use this order:

1. Active implementation contract supplied by the user.
2. `docs/CURRENT_CONTEXT.md` for implemented state.
3. `docs/ARCHITECTURE.md` for ownership and dependency boundaries.
4. `docs/PRODUCT_DECISIONS.md` for accepted product behavior.
5. `docs/FRONTEND_DESIGN.md` for visual and interaction direction.
6. `docs/ROADMAP.md` for sequence.
7. `docs/VISION.md` for long-term intent.
