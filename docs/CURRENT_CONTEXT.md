# Current Context

Last updated: 2026-07-30

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

The repository currently contains an isolated combat simulator under `src/`.

Documented current paths:

```text
src/game/ecs
src/game/components
src/game/entities
src/game/intents
src/game/rules
src/game/random
src/game/events
src/game/systems
src/game/simulation
src/content
src/cli
tests
```

Current commands:

```bash
npm run game
npm test
```

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

## Current milestone

Milestone 0: documentation and target structure.

The repository now documents:

- vision;
- product decisions;
- architecture;
- frontend design;
- development strategy;
- roadmap;
- current context;
- implementation-agent instructions.

## Next implementation milestone

Milestone 1: introduce the target application structure while preserving the existing combat core.

Expected result:

```text
client/
server/src/game/
server/src/content/
shared/
```

The migration must keep these demonstrations working:

```bash
npm test
npm run game
```

The client workspace should become runnable, but Milestone 1 should not spend substantial effort on the final visual interface. The next milestone delivers encounter setup and the accepted visual foundation.

## Immediate implementation constraints

1. Work on `master`.
2. Read `AGENTS.md` first.
3. Preserve existing combat behavior.
4. Do not duplicate rules in the client.
5. Do not implement world exploration, persistence, HTTP, authentication, or multiplayer during the structural milestone.
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
