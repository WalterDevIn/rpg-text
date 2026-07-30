# Roadmap

## Roadmap policy

This roadmap is organized by demonstrable product capabilities, not by completed architectural layers.

A milestone is complete only when its demonstration works and its critical tests pass. Internal foundations may be implemented within a milestone, but they are not milestones by themselves.

Status values:

- `CURRENT`: active next product milestone.
- `COMPLETED`: implemented and verified milestone.
- `PLANNED`: accepted direction, not yet active.
- `LATER`: intentionally deferred.
- `EXISTING FOUNDATION`: already present code that supports future slices but is not itself the full product milestone.

## Existing foundation

The repository already provides an isolated Node.js combat core and CLI with:

- ECS world and component storage;
- configurable combat construction;
- multiple participants and factions;
- assignable controllers;
- initiative, turns, and rounds;
- structured `ATTACK`, `DODGE`, and `PASS` actions;
- structured validation rejection;
- attacks derived from equipped weapons or unarmed combat;
- inventory, armor, shield, and combat conditions;
- deterministic seeded random generation;
- snapshots, events, and intent history;
- defeat handling and faction victory;
- reusable sample characters, creatures, and equipment;
- automated tests.

This foundation must be preserved while the product becomes a client/server application.

## Milestone 0 — Documentation and target structure

Status: `COMPLETED`

Goal:

Make the repository self-contained for an implementation agent and define the migration from the current `src` structure to `client`, `server`, and `shared` boundaries.

Demonstration:

- an implementer can read only this repository and explain the product, visual direction, current combat capabilities, architecture, roadmap, and next implementation slice;
- no access to `solo-adventuring-txt` is required.

Completion criteria:

- product vision documented;
- architecture documented;
- frontend reference documented;
- feature-driven workflow documented;
- current context documented;
- agent instructions documented.

## Milestone 1 — Application structure and preserved combat core

Status: `COMPLETED`

Goal:

Introduce the target top-level application structure while preserving the existing game behavior and CLI/test execution.

Demonstration:

```text
npm test
npm run game
```

Both continue to work after the game core and content are placed under the server ownership boundary.

Functional outcomes:

- `client/` exists as a runnable frontend workspace;
- `server/src/game/` owns the migrated combat core;
- `server/src/content/` owns current content;
- a temporary developer CLI remains available;
- root scripts run the relevant workspaces;
- no authoritative behavior changes unintentionally.

Not included:

- final HTTP API;
- persistence;
- complete frontend design;
- new combat rules.

## Milestone 2 — Frontend foundation and encounter setup

Status: `COMPLETED`

Goal:

Deliver the accepted visual identity and allow the player to configure an encounter using real existing creature content.

Demonstration:

1. Launch the client.
2. Open New Combat.
3. Select at least one player-controlled combatant.
4. Select one or more opponents.
5. Assign opposing factions and controllers where applicable.
6. Select a basic scenario.
7. See a valid encounter summary.
8. Start the encounter and receive a validated combat-ready result.

Functional outcomes:

- application shell;
- home/entry screen;
- encounter setup screen;
- real content adapter;
- validation before Start Combat;
- combat-ready result surface;
- accepted dark terminal visual identity;
- responsive baseline.

Scenario metadata is displayed but does not yet affect simulation rules. The narrative combat screen is the next milestone.

## Milestone 3 — Initial combat state and narrative event feed

Status: `COMPLETED`

Goal:

Start a real combat session and render its initial authoritative state and events.

Demonstration:

- starting the configured encounter produces initiative results;
- participants appear with current HP and faction;
- round and active turn are visible;
- initial events appear as DM and dice messages in correct order.

Functional outcomes:

- client-facing combat snapshot contract;
- event-to-message presentation mapping;
- participant panel;
- context bar;
- narrative feed;
- dice message component;
- deterministic demo fixture for verification.

## Milestone 4 — First real player action

Status: `COMPLETED`

Goal:

Allow the active player-controlled creature to submit an authoritative combat action from the frontend.

Demonstration:

1. Start combat.
2. Choose Attack.
3. Select a legal target.
4. Submit the action.
5. See player intention, dice resolution, DM narration, HP update, and next turn.

Functional outcomes:

- action composer;
- target selection;
- pending/disabled state;
 - server application command;
- structured validation feedback;
- event rendering after resolution;
- critical integration tests.

## Milestone 5 — Complete playable combat

Status: `COMPLETED`

Goal:

Play from encounter setup through victory without developer intervention.

Demonstration:

- all controlled actors receive usable turns;
- AI-controlled opponents choose supported actions;
- defeated creatures are skipped;
- rounds continue correctly;
- the encounter ends with a visible result.

Functional outcomes:

- minimal creature control behavior;
- supported actions exposed through UI;
- combat conclusion;
- post-combat result surface;
- replay/new encounter navigation;
- complete vertical integration test at the highest practical layer.

The browser now plays the existing combat simulation through REST until an authoritative finished result. AI-controlled turns are resolved server-side with a bounded target-selection policy. The chat, participant panel, action controls, connection recovery, and final result are implemented.

## Milestone 6 — Persistent survivors and experience

Status: `CURRENT`

Goal:

Preserve combat consequences across application restart.

Demonstration:

1. Finish a combat with a surviving injured creature.
2. Award experience.
3. Close and restart the application.
4. Select the same creature.
5. Observe preserved HP and experience.

Functional outcomes:

- persistent creature identity;
- storage boundary;
- post-combat state commit;
- experience award rule;
- load/save behavior;
- failure-safe persistence tests.

## Milestone 7 — Creature creation from frontend

Status: `PLANNED`

Goal:

Create a minimal persistent combatant in the client and use it immediately in an encounter.

Demonstration:

- create a named creature with supported basic combat choices;
- save it;
- select it in encounter setup;
- complete a combat with it.

Character creation remains intentionally limited to data consumed by implemented combat rules.

## Milestone 8 — Equipment choices

Status: `PLANNED`

Goal:

Expose inventory and equipment behavior through the product.

Demonstration:

- equip a weapon or shield;
- start combat;
- observe the derived attack or defense change;
- preserve resulting inventory state.

## Milestone 9 — Tactical distance and scenario behavior

Status: `PLANNED`

Goal:

Introduce abstract positioning before committing to a full grid.

Demonstration:

- creatures begin at scenario-defined distance;
- moving changes distance;
- melee and ranged actions respect range;
- simple terrain or cover changes legal or resolved actions.

## Milestone 10 — HTTP server boundary

Status: `COMPLETED`

Goal:

Replace the temporary local client adapter with an HTTP implementation without changing client product behavior or duplicating game rules.

Demonstration:

- run client and server separately;
- complete the existing combat flow;
- network responses preserve the same snapshots, events, and errors.

Functional outcomes:

- session API;
- request/response contracts;
- server application services;
- transport validation;
- client HTTP adapter;
- integration and contract tests.

The REST boundary is implemented with the Node.js built-in HTTP server. Sessions remain in memory; persistence, authentication, and multiplayer remain deferred.

## Later stages

Status: `LATER`

- richer character ancestry, background, and class construction;
- spell preparation and spellcasting;
- conditions and recovery between encounters;
- dungeon and structure exploration;
- natural-region and hex travel;
- settlements and social scenes;
- journals, quests, and discoveries;
- connected world persistence;
- multiplayer coordination;
- optional advanced NPC psychology support.

## Roadmap guardrail

Do not begin a later milestone merely because its internal data structure is interesting. Advance when the previous slice is demonstrably usable or when a bounded technical correction is required to complete it.
