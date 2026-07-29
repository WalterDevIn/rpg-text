# Architecture

## Core

The game is the center of the project.

```
client/server layers
        |
        v
 game core
        |
 ECS + simulation + rules
```

The initial implementation excludes server, client, persistence and world exploration.

## Future layers

```
game core
    |
    +-- server API
    |       - sessions
    |       - persistence
    |       - multiplayer
    |
    +-- client
            - presentation
            - input
            - visualization
```

Neither layer contains authoritative game rules.

## Boundaries

The game owns:

- ECS world;
- entities;
- components;
- systems;
- simulation ticks;
- rules;
- combat resolution;
- game events.

The server owns:

- transport;
- authentication;
- storage;
- coordination.

The client owns:

- visual presentation;
- user input collection;
- animations;
- sound;
- event representation.
