# Product Decisions

## 1. Product definition

`rpg-text` is a narrative role-playing game application built around authoritative simulation and text-first interaction.

The long-term product adapts concepts from tabletop fantasy role-playing manuals and solo-adventure procedures into a persistent digital game. It is not intended to reproduce books page by page or expose tabletop bookkeeping unchanged. Rules are translated into a coherent interactive system.

The intended long-term loop is:

```text
Create a world
  -> create characters and creatures
  -> add them to the world
  -> explore locations
  -> encounter situations
  -> resolve actions and combat
  -> preserve consequences
  -> continue the campaign
```

World locations will eventually include:

- settlements;
- natural regions;
- structures and dungeons.

## 2. Initial product scope

The first version is limited to combat preparation, combat resolution, and persistent consequences.

The initial product statement is:

> A player can configure creatures and an encounter, play a complete narrative combat through a graphical text interface, and preserve the surviving creatures' resulting state and experience.

World generation, settlement simulation, travel, hex exploration, dungeon exploration, social simulation, and multiplayer are future stages.

## 3. Development principle

Development is organized around demonstrable, playable features.

A milestone must end with something that can be:

- launched;
- used through a real interface;
- observed by a person;
- verified through tests;
- built upon by the next milestone.

Creating folders, interfaces, placeholder types, or isolated infrastructure does not constitute a completed feature.

The project deliberately avoids a long invisible foundation phase.

## 4. Frontend is part of the product from the beginning

The frontend is not postponed until the simulation and server are complete.

Every major combat milestone should expose its behavior through the client as soon as practical. During early development, a temporary local application adapter may connect the client to the game. This is acceptable only when rules remain in the authoritative game core and the adapter can later be replaced by HTTP.

The preferred delivery loop is:

```text
visible client feature
  -> minimum application support
  -> authoritative game behavior
  -> structured result
  -> visible client feedback
```

## 5. Text-first interaction

Text is the primary presentation and interaction medium, not an accessory panel around a conventional tactical game.

The player experience centers on a narrative chat where:

- player intentions appear on the right;
- Dungeon Master narration appears on the left;
- creature intentions or messages are visually distinct;
- dice and mechanical resolution are independently identifiable;
- structured game events become concise readable narration.

Buttons, suggestions, cards, and panels support text interaction. They do not replace it as the central experience.

## 6. Player input

The long-term product accepts natural-language intentions.

Command interpretation should be deterministic, context-aware, inspectable, and testable. Generative AI is not the authoritative command interpreter.

Early combat uses a deterministic, domain-limited Spanish command parser for ATTACK, DODGE, and PASS. Suggestions help complete text but do not replace the language path. This is preferred over prematurely implementing broad natural-language understanding.

The system should preserve:

- original input;
- selected or interpreted intent;
- validation result;
- dice results;
- resulting events;
- presented narration.

## 7. Dungeon Master role

The Dungeon Master is the narrative voice that communicates world and rules outcomes. It is not an ECS creature.

Presentation rules:

- the player communicates intentions;
- creatures communicate their own speech or visible intention when relevant;
- dice are represented independently;
- environmental and mechanical consequences are communicated by the Dungeon Master;
- creatures do not narrate rules resolution.

## 8. Combat preparation

A combat encounter requires enough pre-combat information to resolve the encounter consistently.

The mature preparation model includes:

- participating creatures;
- factions and relationships;
- controller assignment;
- current state;
- inventory and equipped items;
- available attacks;
- prepared spells and remaining resources;
- active conditions;
- scenario;
- initial positioning or distance;
- encounter-specific modifiers.

The first playable slice uses only the subset consumed by its combat rules. It must not implement a complete character sheet before those rules are playable.

## 9. Creature persistence and progression

Creatures are persistent participants, not disposable combat records.

Surviving creatures should eventually retain:

- current HP;
- persistent conditions;
- spent resources;
- inventory changes;
- experience;
- encounter history;
- death or defeat state where applicable.

Experience is awarded after combat resolution according to authoritative rules. Progression is not considered complete until the resulting state survives application restart.

## 10. Character creation strategy

The project does not begin by implementing the complete character creation ruleset.

Character creation grows in service of playable combat features:

```text
minimal combatant
  -> equipment choices
  -> ancestry/background/class choices
  -> abilities and resources
  -> leveling and advancement
```

The smallest useful combatant should exist first. New character data is added when an accepted feature consumes it.

## 11. Scenario strategy

The initial scenario model is abstract.

A scenario may initially define:

- name;
- initial distance;
- available movement space;
- simple terrain tags;
- cover or obstacles only when supported by rules.

The first scenario can be a plain field with no special effects. Grids, tactical maps, terrain simulation, and exploration maps are deferred until positioning features require them.

## 12. Rules authority

The server-hosted game core is authoritative for:

- legal actions;
- turn ownership;
- targets;
- hit and damage resolution;
- conditions;
- resource spending;
- defeat;
- victory;
- experience awards.

The client never decides these outcomes. It requests actions and represents authoritative responses.

## 13. Generative AI policy

Generative AI is a development tool and may later support selected game features, but it is not an authority over simulation.

Generative AI is not responsible for:

- combat rules;
- command legality;
- dice results;
- direct ECS mutation;
- persistence truth;
- victory conditions;
- general mandatory narration.

Possible later uses include:

- complex NPC psychology;
- optional variation in non-authoritative prose;
- development-time content assistance;
- authoring support with validation.

The game must remain functional without a generative AI service.

## 14. Visual direction

The primary visual reference is the `prototype/combat-setup` branch of `solo-adventuring-txt`.

The product retains:

- deep black background;
- subtle radial light centered in the main surface;
- restrained scanline or texture treatment;
- monospaced typography;
- thin light borders;
- very subtle red/blue chromatic fringe;
- compact neon semantic accents;
- terminal-like selection cards;
- chat messages aligned by origin;
- violet dice presentation;
- a discreet information rail or context panel.

The `prototype/player-experience` branch is a secondary reference for screen organization, context information, player-message alignment, and responsive behavior. Its broader blue-gray panel style is not the target identity.

The frontend should evoke a modern narrative terminal rather than a literal old computer terminal or a generic dashboard.

## 15. Initial screens

The first useful client contains:

1. A minimal home or entry screen.
2. Encounter setup.
3. Narrative combat.
4. Post-combat result and persistence feedback.

Creature management is introduced when the user can create a creature that is immediately usable in encounter setup.

## 16. Initial combat user flow

```text
Open application
  -> choose New Combat
  -> select or create combatants
  -> assign opposing factions
  -> choose controller and scenario
  -> start combat
  -> view initiative and current turn
  -> write a Spanish command
  -> view dice and narrative resolution
  -> continue until combat ends
  -> review outcome
  -> preserve survivor state and experience
```

This flow is the central measure of early progress.

## 17. Explicit non-goals for the first version

The first version does not require:

- world creation;
- settlements;
- natural-region exploration;
- structures or dungeon crawling;
- full natural-language understanding;
- every tabletop combat action;
- complete ancestry, background, and class catalogs;
- complete spellcasting;
- a content management database;
- authentication;
- multiplayer;
- procedural narrative generation;
- tactical grid maps.

## 18. Quality decisions

1. Preserve deterministic simulation where possible.
2. Prefer explicit structured events over prose-only outcomes.
3. Prefer vertical slices over horizontal infrastructure phases.
4. Reuse proven prototype design decisions without copying prototype architecture blindly.
5. Do not duplicate rules in the UI.
6. Avoid speculative abstractions.
7. Keep the application demonstrable throughout restructuring.
8. Treat tests as executable product requirements, not optional cleanup.
9. Keep documentation in English for implementation-agent consistency.
10. Record major product and architecture changes before or with implementation.

11. The browser must not maintain a second authoritative command parser; interpretation and semantic references come from the server.
