# rpg-text

Motor de RPG narrativo desarrollado desde el juego hacia afuera. El estado actual es un núcleo de combate aislado, determinista y ejecutable sin servidor ni navegador.

## Ejecutar la demo

```bash
npm run game
```

La demo:

- instancia un guerrero humano y un goblin desde definiciones de contenido;
- crea entidades ECS con componentes independientes;
- tira iniciativa con RNG sembrado;
- alterna turnos;
- recibe intenciones de ataque;
- resuelve impacto, daño y derrota;
- emite eventos estructurados;
- presenta los eventos por consola mediante las voces de criatura, dado y Dungeon Master;
- termina cuando queda una sola facción activa.

## Ejecutar pruebas

```bash
npm test
```

Las pruebas cubren almacenamiento ECS, eliminación de entidades, eventos de combate, reproducibilidad por semilla y finalización del combate.

## Estructura actual

- `src/game/ecs`: mundo, entidades y almacenamiento de componentes.
- `src/game/components`: tipos de componentes del núcleo.
- `src/game/entities`: construcción de entidades desde definiciones.
- `src/game/random`: fuente aleatoria determinista e inyectable.
- `src/game/events`: registro ordenado de eventos estructurados.
- `src/game/systems`: resolución autoritativa de ataques, daño y derrota.
- `src/game/simulation`: sesión de combate, iniciativa, turnos y snapshots.
- `src/content`: definiciones del guerrero, goblin y espada larga.
- `src/cli`: cliente temporal de consola y presentador de eventos.
- `tests`: pruebas automáticas del núcleo.

## Frontera futura

El servidor enviará intenciones al `game core` y coordinará sesiones, persistencia y multijugador. El cliente representará eventos y snapshots. Ninguna de esas capas contendrá reglas autoritativas de combate.
