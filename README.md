# rpg-text

RPG de texto centrado en una simulación de juego independiente.

La arquitectura comienza por el núcleo del juego:

- `src/game`: ECS, simulación y reglas.
- `src/content`: definiciones de personajes, criaturas, objetos y hechizos.
- `src/cli`: herramienta de consola para probar el juego.
- `tests`: pruebas automáticas del núcleo.

Servidor y cliente se agregarán posteriormente como capas externas.
