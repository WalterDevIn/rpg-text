# Architecture

## 1. Purpose

This document defines the target architecture for `rpg-text` and the migration path from the current isolated combat core to a complete client/server application.

The project is developed from playable features outward. Architecture exists to protect the simulation, support rapid frontend delivery, and allow persistence and multiplayer to be added without moving authoritative rules into transport or presentation code.

## 2. Top-level structure

The target repository structure is:

```text
rpg-text/
├── client/
│   ├── src/
│   │   ├── app/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   ├── state/
│   │   ├── styles/
│   │   └── assets/
│   ├── public/
│   └── tests/
├── server/
│   ├── src/
│   │   ├── api/
│   │   ├── application/
│   │   ├── game/
│   │   │   ├── ecs/
│   │   │   ├── components/
│   │   │   ├── entities/
│   │   │   ├── intents/
│   │   │   ├── rules/
│   │   │   ├── random/
│   │   │   ├── events/
│   │   │   ├── systems/
│   │   │   └── simulation/
│   │   ├── content/
│   │   ├── persistence/
│   │   └── sessions/
│   └── tests/
├── shared/
│   └── contracts/
├── docs/
├── scripts/
├── tests/
├── AGENTS.md
└── package.json
```

The exact internal folders may evolve when a demonstrated feature requires it. The ownership boundaries in this document are authoritative; the directory sketch is a target, not permission to create empty scaffolding.

## 3. Current-state migration

The current repository already contains a functional combat core under:

```text
src/game
src/content
src/cli
tests
```

That implementation must be preserved. The structural migration is:

```text
src/game     -> server/src/game
src/content  -> server/src/content
src/cli      -> temporary developer adapter or server-side CLI
```

The move must not be performed as a blind file relocation. It should happen inside a feature that keeps the simulator executable and the tests passing.

The current combat model is valuable application code, not disposable prototype code. Existing capabilities include ECS storage, configurable participants and factions, controller assignment, initiative, turn order, rounds, structured actions, validation failures, equipment-derived attacks, inventory, combat conditions, deterministic random generation, snapshots, intent history, events, defeat handling, and victory resolution.

## 4. Dependency direction

Dependencies point toward authoritative game rules.

```text
client
  |
  v
shared contracts
  ^
  |
server application / API
  |
  v
server game core
```

More explicitly:

```text
client -> transport client -> shared contracts
server API -> application services -> game core
server persistence -> application services
server sessions -> application services
content -> game factories and rules
```

Forbidden dependency directions:

```text
game core -> HTTP
 game core -> browser DOM
 game core -> database driver
 game core -> client state
 game core -> visual animation
 shared contracts -> game implementation
 client -> game internals
```

## 5. Game core ownership

`server/src/game` is the authoritative rules engine.

It owns:

- ECS world state;
- entities and components;
- simulation state;
- legal intent validation;
- initiative and turn progression;
- attacks, damage, conditions, defeat, and victory;
- deterministic random decisions;
- rule-derived values;
- authoritative events;
- snapshots intended for application-layer consumption.

It does not own:

- HTTP routes;
- authentication;
- database schemas;
- network sessions;
- HTML or CSS;
- animations and sounds;
- user-facing prose formatting;
- browser storage;
- generative AI calls.

The game core must remain executable in isolation through tests and a developer adapter.

## 6. Server ownership

The server hosts the game and coordinates application use cases.

It owns:

- API transport;
- request validation at the transport boundary;
- application services;
- combat session lifecycle;
- campaign and creature persistence;
- concurrency and multiplayer coordination;
- authorization;
- mapping between game snapshots/events and shared response contracts;
- loading content used to create game entities;
- operational logging.

The server must not duplicate combat rules. An API handler may reject malformed input, but whether an actor can attack a target is decided by the game core.

Recommended server flow:

```text
HTTP request
  -> route/controller
  -> application command
  -> session lookup
  -> game intent
  -> game resolution
  -> persisted state/events
  -> response DTO
```

## 7. Client ownership

The client is a first-class part of every playable milestone.

It owns:

- application shell and navigation;
- encounter setup UI;
- narrative combat chat;
- participant and context panels;
- action entry and controls;
- rendering snapshots and events;
- optimistic or pending presentation state when appropriate;
- animations, transitions, dice presentation, and sound;
- accessibility and responsive layout;
- local UI preferences.

It does not own:

- authoritative HP changes;
- hit or damage calculations;
- legal target decisions;
- initiative ordering;
- victory rules;
- creature AI decisions that affect authoritative simulation;
- persistent campaign truth.

The client submits intent and renders results.

## 8. Client service boundary

The frontend must access application behavior through a small service interface rather than importing game internals.

Expected capabilities include:

```text
listCreatures()
createCreature(input)
createEncounter(input)
startCombat(encounterId)
getCombatState(combatId)
submitCombatAction(combatId, action)
finishCombat(combatId)
```

During the fastest initial frontend slice, this interface may use an in-process or local adapter. The UI-facing contract must remain compatible with replacement by an HTTP adapter.

Acceptable transition:

```text
client -> local application adapter -> game
```

Target transition:

```text
client -> HTTP adapter -> server -> game
```

The temporary adapter is an acceleration mechanism, not a second rules engine.

## 9. Shared contracts

`shared/contracts` contains stable data contracts that both client and server may consume.

Suitable contents:

- request and response DTO shapes;
- public action identifiers;
- event type identifiers;
- snapshot schemas;
- validation error codes;
- protocol version information.

Unsuitable contents:

- ECS component implementations;
- combat system logic;
- database models;
- DOM helpers;
- server-only configuration.

Shared contracts should be introduced only when both sides use them. Do not create speculative abstractions.

## 10. Content architecture

Game content is data that configures rules-owned factories.

Examples:

- character templates;
- monster definitions;
- weapons;
- armor and shields;
- spells;
- conditions;
- scenarios.

Content may provide numbers, tags, references, and configuration. It must not bypass game systems or mutate ECS state directly.

The first version may keep content as source-controlled modules or JSON. Database-backed content management is deferred until a demonstrated product need requires it.

## 11. Persistence model

Persistence is external to the simulation.

The application must eventually preserve:

- creatures and their stable identity;
- current and maximum HP;
- inventory and equipment;
- prepared resources and remaining uses;
- persistent conditions;
- experience;
- encounter history;
- campaign membership;
- world state when exploration begins.

Combat sessions may use an in-memory representation during early milestones. Persistence must be introduced before claiming that post-combat progression survives application restarts.

Game snapshots are not automatically database records. The persistence layer maps authoritative state to storage models.

## 12. Events and narrative representation

The game produces structured events. Presentation converts those events into readable narrative.

Example:

```text
Game event:
ATTACK_RESOLVED {
  actorId,
  targetId,
  attackId,
  roll,
  total,
  defense,
  hit
}

Client representation:
"Edran attacks the cave rat with a longsword. 17 against AC 12: hit."
```

Rules must not depend on final prose. The client may group, animate, delay, or style events without changing their meaning.

The Dungeon Master is a presentation role, not an ECS entity. Dice events are represented separately. Creatures communicate only when an actual creature message or intention exists.

## 13. Determinism and traceability

The simulation should remain deterministic when supplied with the same initial state, intents, and random seed.

The system should preserve or make inspectable:

- original player input;
- normalized command or selected action;
- interpreted intent;
- validation result;
- random rolls;
- authoritative events;
- resulting snapshot;
- displayed narrative.

This trace is required for debugging, tests, replay, and eventual multiplayer synchronization.

## 14. Testing strategy

Tests are organized by boundary.

Game-core tests cover:

- ECS storage;
- entity creation;
- deterministic resolution;
- intent validation;
- turn progression;
- combat completion;
- rule interactions.

Server tests cover:

- application use cases;
- session lifecycle;
- persistence mapping;
- API contracts;
- authorization and malformed requests.

Client tests cover:

- rendering from state;
- interaction behavior;
- screen transitions;
- message ordering and grouping;
- accessibility-critical behavior.

Vertical-slice tests cover:

- the complete demonstrated flow across the layers included in that milestone.

A feature is not complete because isolated classes exist. Its primary user flow must be executable and verified.

## 15. Delivery architecture

Development proceeds through vertical slices, not layer-completion phases.

Preferred slice:

```text
encounter setup UI
  -> application request
  -> combat session creation
  -> game resolution
  -> event response
  -> narrative rendering
```

Avoid this sequence:

```text
finish all ECS
  -> finish all server
  -> finish all persistence
  -> eventually build frontend
```

Technical foundations are implemented only as required by the next demonstrated feature.

## 16. Architectural constraints

1. The game core remains authoritative and environment-independent.
2. The frontend is developed from the first playable milestones.
3. Every feature has an observable demonstration.
4. Existing combat functionality must not be discarded during restructuring.
5. No business rule is duplicated between client and server.
6. No speculative subsystem is built without an accepted feature requiring it.
7. Temporary adapters must have explicit replacement boundaries.
8. Structured events and snapshots cross boundaries; mutable ECS internals do not.
9. Refactors must preserve executable behavior and tests.
10. Documentation must describe the implemented or explicitly targeted system, not pretend future capabilities already exist.
