# Product Decisions

## Nature of the product

The project is a narrative RPG simulation.

The main flow is:

```
Player intent
    -> interpretation
    -> simulation resolution
    -> events
    -> narrative representation
```

Text is the main interaction model of the final experience, not an accessory layer.

## Architecture separation

```
client
  presentation and interaction

server
  API, persistence, sessions and multiplayer coordination

game
  authoritative simulation and rules
```

The game core is independent from client and server.
The ECS belongs to the game simulation and is not responsible for HTTP, UI, databases or networking.

## Development order

The game grows in these stages:

```
combat simulator
    -> dungeon exploration simulator
    -> RPG simulator
```

The first playable scope is isolated combat.

## Player interaction

Players submit intents through natural language.

The command interpreter should be deterministic and context aware. Generative AI is not used to interpret player commands.

The system should preserve:

- original input;
- interpreted intent;
- decision trace;
- dice results;
- resulting events;
- presented narration.

## Dungeon Master role

The Dungeon Master is the narrative voice of the world, not an ECS entity.

Rules:

- creatures speak as creatures;
- dice are represented independently;
- everything else is communicated by the Dungeon Master.

## Generative AI

Generative AI is not responsible for:

- rules;
- combat resolution;
- command interpretation;
- direct ECS changes;
- general narration.

Future use is limited to complex NPC psychology and reactions.
