# Product Vision

## Vision statement

`rpg-text` is a persistent narrative role-playing game in which the player creates a world, adds characters and creatures to it, explores meaningful locations, and resolves uncertain situations through an authoritative simulation presented primarily as text.

The product combines the expressive freedom of a solo tabletop role-playing session with the consistency, persistence, and speed of a digital game.

## Source inspiration

The design adapts ideas from fantasy role-playing rulebooks, monster references, game-master guidance, and solo-adventure procedures.

The project does not attempt a literal digital transcription of those sources. It translates useful concepts into a coherent software product with:

- explicit state;
- deterministic and testable rules;
- persistent consequences;
- structured events;
- a narrative interface;
- progressive feature delivery.

Any externally sourced rules, names, descriptions, or content must be handled with appropriate licensing and must not be copied into the repository merely because they inspired the design.

## Long-term game loop

```text
Create world
  -> create characters and creatures
  -> establish relationships and ownership
  -> explore settlements, natural regions, and structures
  -> discover situations
  -> declare intentions
  -> resolve through simulation
  -> narrate results
  -> preserve consequences
  -> progress characters and world
```

## Experience goals

### 1. A world that remembers

Creatures and places retain meaningful state. Injury, resources, equipment, experience, relationships, discoveries, and previous encounters should affect what happens next.

### 2. Narrative clarity backed by real rules

The interface presents actions as readable narrative, but outcomes are not arbitrary prose. Structured rules and state determine what occurred.

### 3. Fast interaction

The digital adaptation should remove unnecessary tabletop friction. Common calculations, legal-action checks, initiative, damage, status changes, and record keeping are automated.

### 4. Player agency

The player should eventually express intentions naturally rather than navigate a rigid menu for every possibility. Early versions may use constrained actions while the authoritative systems mature.

### 5. Emergent play

The game should support outcomes that arise from interacting systems rather than from a single fixed script. Content configures the simulation; it does not replace it.

### 6. Inspectability

Players and developers should be able to understand why an outcome occurred. Dice, modifiers, action validation, and resulting events remain visible when useful.

## Initial focus

The first product stage is an isolated but persistent combat simulator.

This focus exists to create a playable foundation rather than to claim combat is the entire game.

The first stage proves that the project can support:

- persistent creatures;
- encounter configuration;
- authoritative turn-based resolution;
- equipment and combat resources;
- narrative event presentation;
- experience and lasting state;
- frontend, server, and game-core boundaries.

## Expansion path

```text
Persistent combat simulator
  -> tactical positioning and richer scenarios
  -> creature and character progression
  -> dungeon or structure exploration
  -> travel and natural-region exploration
  -> settlements and social interaction
  -> connected world simulation
  -> optional multiplayer coordination
```

Each stage should reuse and expose the systems proven by the previous stage.

## Product identity

The visual and interaction identity is a modern narrative terminal:

- dark and focused;
- text-dominant;
- mechanically transparent;
- restrained rather than ornamental;
- atmospheric without reducing readability;
- responsive and usable on common desktop and mobile sizes.

The desired feeling is closer to entering a living narrative console than operating a generic admin dashboard.

## Success criteria for the first major release

A successful first major release allows a player to:

1. Launch the graphical client.
2. Create or select persistent creatures.
3. Configure an encounter and scenario.
4. Play a complete combat through narrative UI.
5. Understand turns, rolls, damage, conditions, and victory.
6. Finish the encounter without developer commands.
7. Preserve survivor state and awarded experience.
8. Start another encounter with the resulting state.

The release is unsuccessful if it contains substantial architecture but no complete user flow.
