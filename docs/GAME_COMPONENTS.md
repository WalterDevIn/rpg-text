# Game Components

This document defines the first combat-focused model of the game core.

The goal is not to model the complete RPG world yet, but the minimum data required for isolated combat simulation.

## Initial entities

### Character

A player-created combat entity.

Relevant concepts:

- identity;
- race;
- background;
- class;
- ability scores;
- health;
- inventory;
- equipment;
- spell book.

### Creature

A monster or NPC combat entity.

Relevant concepts:

- identity;
- ability scores;
- health;
- combat capabilities;
- controller;
- relationship/faction.

### Companion

A combat entity that can accompany another entity and may be controlled by logic or a player.

### Item

A physical object relevant to combat or inventory.

Examples:

- weapons;
- armor;
- consumables;
- magical objects.

### Spell

A magical action definition.

## Initial components

```
Identity
AbilityScores
Health
Inventory
Equipment
SpellBook
Combatant
Controller
Relationship
```

## Simulation boundary

The game core owns the state and rules.

The client and future server only interact through intents, events and snapshots.

## Explicit exclusions

The first version does not include:

- Position;
- Movement;
- Maps;
- Dungeon generation;
- Exploration;
- Travel;
- World simulation.

Those belong to later versions.
