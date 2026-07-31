# Codebase Guide

This guide describes the implemented server, not future architecture. The server uses Node.js ECMAScript modules and the built-in `node:http` transport; no web framework is required.

## Server Map

```text
server/src/
  http/
    app.js                         HTTP composition and dispatch
    server.js                      process startup only
    routes/                        transport-specific route handlers
    middleware/                    CORS, JSON bodies, error responses
    presenters/                    public HTTP error shapes
  application/
    createApplication.js           composition of application dependencies
    encounters/                    catalog listing and encounter validation
    combatSessions/                session lifecycle use cases
    ai/                            bounded automatic-turn orchestration
    presenters/                    game/content to public DTO mapping
    ports/                         repository contract documentation
    interpretation/                preview and authoritative command execution
    presentation/                  semantic event segments and references
  language/spanish/                deterministic Spanish parser
  game/                            authoritative, transport-free simulation
  content/
    characters/, creatures/        canonical participant definitions
    items/                          canonical equipment definitions
    scenarios/                     canonical scenario definitions
    catalog/                       category-specific lookup and listing
  infrastructure/persistence/      in-memory session adapter
  cli/                              developer-only direct game adapter
```

The existing game subfolders remain intentionally descriptive: `simulation`, `systems`, `intents`, `ecs`, `components`, `entities`, `rules`, `events`, and `random`.

## Layer Responsibilities

`http` receives requests, parses JSON and URL parameters, calls application functions, and chooses HTTP status codes. A route never imports ECS components or mutates a session.

`application` coordinates use cases. It resolves definitions through catalogs, constructs sessions through `CombatBuilder`, builds public action context, invokes the deterministic Spanish parser, submits structured intents to `CombatSession`, stores sessions through the repository, and returns public results. It does not know request or response objects.

`game` owns the rules and mutable simulation. `server/src/game/simulation/combatSession.js` validates turns and targets, resolves actions, advances initiative, updates victory, and emits structured events. It imports no outer server layer.

`content` contains reusable immutable definitions and Spanish aliases. Catalogs reference those modules; they do not duplicate them. Content is not mutable session state.

`infrastructure` contains technical adapters. `inMemoryCombatSessionRepository.js` owns the `Map`, ID allocation, lookup, and removal. Sessions disappear on process restart. A future database adapter belongs beside it and would be passed through the same application composition boundary.

## Creating A Combat

1. The client sends `POST /api/combat-sessions` with character IDs, creature IDs, assignments, scenario ID, and optional seed.
2. `http/routes/combatSessionRoutes.js` parses the body and checks its transport shape.
3. `application/combatSessions/createCombatSession.js` calls encounter validation and resolves IDs through the three catalogs.
4. `CombatBuilder` adds each canonical definition to a new `CombatSession`; `CombatSession.start()` rolls initiative and emits initial events.
5. `advanceAutomaticTurns.js` resolves leading AI turns using structured `ATTACK` or `PASS` intents.
6. The repository stores the mutable session, and the use case returns a snapshot, events, cursor, status, and session ID.
7. The route serializes that result as the existing `201` JSON response.

## Submitting ATTACK

1. The client sends `POST /api/combat-sessions/:sessionId/intents` with `{ type: "ATTACK", actorId, targetId }`.
2. The route parses the body and calls `submitCombatIntent`.
3. The application looks up the session and passes the intent unchanged to `CombatSession.submitIntent`.
4. The game validates actor, turn, target, faction, and combat state, then `systems/attackSystem.js` performs authoritative random resolution and event emission.
5. The application advances subsequent AI turns, then returns events since the prior cursor and the new snapshot.
6. The client converts structured events into narrative chat messages; prose is not authoritative.

## Spanish Commands

`POST /api/combat-sessions/:sessionId/interpret` accepts `{ text }` and returns the original text, exclusive character-offset annotations, reference details, status, intent candidate, missing fields, ambiguities, and warnings. It is preview-only. `POST /api/combat-sessions/:sessionId/commands` accepts the same body, interprets it again on the server, refuses anything except `RESOLVED`, then delegates to `submitCombatIntent`.

The parser supports ATTACK phrases such as `Ataco al goblin`, `Golpeo a la rata`, and `Quiero atacar al goblin con mi espada`; DODGE phrases such as `Esquivo` and `Me defiendo`; and PASS phrases such as `Paso`, `No hago nada`, and `Termino mi turno`. It is intentionally not general Spanish. The statuses are `RESOLVED`, `INCOMPLETE`, `AMBIGUOUS`, `UNSUPPORTED`, and `INVALID_CONTEXT`. Missing targets receive text suggestions; multiple target matches receive options; unsupported spell references are highlighted as SPELL without execution.

`game/combat/getActionContext.js` exposes only public, command-relevant facts: active actor, living participants, valid hostile target IDs, available actions, equipped/inventory items, and future spell slots. The parser never reads ECS state directly and the game remains the final legality authority.

## Semantic Text

`application/presentation/presentCombatEvent.js` constructs semantic segments directly from structured events. `client/src/components/semanticText.js` renders both event segments and player annotations with keyboard focus, hover, click-to-pin, and Escape-to-close tooltips. Semantic kinds are CHARACTER, CREATURE, ITEM, SPELL, ACTION, DAMAGE, and DICE_ROLL. Damage has priority over dice: a damage roll is represented only as DAMAGE. Add a new kind in the shared contract, server presentation/reference mapping, and client semantic styles/rendering.

## Audiovisual Presentation

`client/src/audio/soundCatalog.js` maps `TYPEWRITER_KEY` to `/sounds/key-press.mp3`, `SINGLE_DIE` to `/sounds/dice.mp3`, and `MULTIPLE_DICE` to `/sounds/dices.mp3`. `audioPool.js` owns reusable voices: eight output typewriter voices and five input voices use base volume `.18`; dice voices use `.72`. Output playback ranges from `.86` to `1.14`, input from `.9` to `1.1`, and all values are multiplied by the persisted master volume.

`features/combatChat/messagePresentationQueue.js` owns received, pending, active, and complete messages. It deduplicates stable IDs, preserves authoritative order, stages source delays, keeps ordinary dice at least 1000 ms apart, batches initiative, and does not replay completed/history effects on rerender or reconnection. `typewriter.js` reveals Unicode-safe structured segments at 24 ms, or 65 ms for `. , ; : ! ?`, while preserving semantic references. `CombatChat` exposes an explicit Skip control that completes the active message without skipping game events.

Presentation preferences are stored by `audio/soundPreferences.js`: sound enabled, master volume, and text animation enabled. Browser autoplay failures are ignored. `prefers-reduced-motion` removes movement/blur, uses effectively immediate output, and suppresses output typewriter sound while leaving input sound independently controlled.

## Mobile Presentation

`mobile/src/screens/CombatScreen.js` composes the mobile chat, keyboard-only command input, interpretation preview, semantic inspector, overview modal, and presentation controls. `mobile/src/components/SemanticText.js` renders structured semantic fragments without HTML; `SemanticInspector.js` displays only public fields in the server reference dictionary. `mobile/src/audio/messagePresentationQueue.js` stages live messages while initial and recovered history is completed immediately. `mobile/src/audio/audioManager.js` uses Expo `expo-audio` pools for the bundled `mobile/assets/sounds` copies, and `audioPreferences.js` persists sound, volume, animation, and reduced-motion values with AsyncStorage.

The browser and mobile clients share only platform-neutral logic in `shared/src/clientPresentation.js`: timing constants, source delays, punctuation timing, dice/damage classification, dice count detection, Unicode-safe typewriter behavior, and visible semantic-prefix calculation. React Native components, Expo audio players, AsyncStorage, browser DOM, browser Audio, and navigation are intentionally not shared.

## Session Lifecycle

`createCombatSession` allocates an ID, starts a real game session, and saves it. `getCombatSession` returns a snapshot. `getCombatEvents` returns events after the requested cursor. `submitCombatIntent` mutates the authoritative session and saves implicitly because the repository holds the object reference. Unknown IDs return `SESSION_NOT_FOUND`, mapped to HTTP 404. Restarting the process removes every session.

## Definitions To ECS Entities

Catalog definitions are passed to `CombatBuilder`. The builder passes each definition to `CombatSession.addParticipant`, which calls `entities/createCombatant.js`. That factory creates an ECS entity and installs identity, health, combat, relationship, controller, equipment, and condition components. The definition remains content; the components are the mutable combat instance.

## Events And Client Chat

`EventLog` assigns sequence numbers to structured game events. Application results expose those events and `nextEventCursor`; `/events?since=N` supports incremental retrieval. The client service and event presenter under `client/src/services` map event types such as `DICE_ROLLED`, `ATTACK_RESOLVED`, and `TURN_STARTED` to narrative and dice messages.

## AI Turns

`application/ai/advanceAutomaticTurns.js` owns when automatic turns advance. It identifies the active AI-controlled participant, selects the first living hostile target, submits `ATTACK`, and uses `PASS` when no target exists. The game still validates and executes the intent. A safety limit prevents an infinite loop.

## Extending The Server

- Add a REST route in `server/src/http/routes/`, then register it in `server/src/http/app.js`.
- Add a use case under `server/src/application/encounters/` or `combatSessions/`, and expose it from `createApplication.js`.
- Add a game action in the authoritative game simulation and cover its validation and resolution in `server/tests`.
- Add a creature definition under `server/src/content/creatures/` and reference it from `creatureCatalog.js`.
- Add a scenario under `server/src/content/scenarios/` and reference it from `scenarioCatalog.js`.
- Add a Spanish action verb in `server/src/language/spanish/actionLexicon.js` and recognition logic in `recognizeAction.js`.
- Add a content alias on the canonical definition, not in a UI component.
- Add a semantic kind to `shared/src/contracts/combat.js`, then update server references and `client/src/styles/app.css`.
- Add a sound asset mapping in `client/src/audio/soundCatalog.js` only for an existing file under `client/public/sounds/`.
- Add a message timing/category rule in `client/src/features/combatChat/messagePresentationPolicy.js`, not in `CombatScreen`.

PostgreSQL would be a new infrastructure persistence adapter implementing the documented repository shape, assembled in `createApplication.js`; it is not implemented. Socket.IO would be a separate HTTP/transport adapter beside the current routes. JWT authentication would be HTTP middleware and application authorization context, also deferred.

## Current Limitations

Sessions are process-local and are lost on restart. The parser is limited to Spanish ATTACK, DODGE, PASS, explicit references, and recognized-but-unsupported spell phrases. There is no authentication, authorization, multiplayer, Socket.IO, PostgreSQL, speech recognition, general natural-language understanding, spellcasting, or persistent survivor progression. Scenario metadata is listed and returned but does not yet affect combat rules.
