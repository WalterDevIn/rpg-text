# rpg-text

A narrative RPG application developed through demonstrable vertical features.

The current repository contains a deterministic, configurable combat core and CLI. The target product adds a graphical narrative client, a server boundary, persistence, and later world exploration without moving authoritative rules out of the game simulation.

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

## Run the current simulator

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

## Target application structure

```text
client/
  graphical narrative interface

server/
  API, sessions, persistence, content, and authoritative game core

shared/
  public contracts shared by client and server
```

The current `src/game`, `src/content`, and `src/cli` structure will be migrated without discarding the existing combat behavior.

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

The frontend is part of the early product. It is not postponed until every server or simulation subsystem is complete.

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

The server coordinates transport, sessions, and persistence. The client collects intent and presents snapshots and events. Neither layer duplicates combat rules.
