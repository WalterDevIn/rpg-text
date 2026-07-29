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

Initial scope excludes server, client, persistence and world exploration.
