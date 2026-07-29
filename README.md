# rpg-text

Motor de RPG narrativo desarrollado desde el juego hacia afuera. El estado actual es un núcleo de combate aislado, determinista, configurable y ejecutable sin servidor ni navegador.

## Ejecutar el simulador

```bash
npm run game
```

La CLI inicia un combate de cuatro participantes y acepta:

```text
status
inspect <entityId>
attack <entityId>
dodge
pass
events
quit
```

## Capacidades actuales

- ECS con entidades y componentes independientes.
- Construcción configurable de combates con múltiples participantes y facciones.
- Controlador asignable por combatiente.
- Iniciativa individual, orden de turnos y rondas.
- Acciones estructuradas `ATTACK`, `DODGE` y `PASS`.
- Rechazos estructurados para actores, turnos y objetivos inválidos.
- Ataques derivados del arma equipada o del ataque desarmado.
- Inventario, arma, armadura, escudo y condiciones de combate.
- Esquiva con desventaja para los ataques recibidos hasta el próximo turno.
- Daño, derrota, omisión de derrotados y victoria por facción.
- RNG sembrado, snapshots, historial de intenciones y eventos estructurados.
- Guerrero, mago, goblin, rata de cueva y slime.
- Espada larga, daga, bastón, armaduras y escudo.

## Ejecutar pruebas

```bash
npm test
```

Las pruebas cubren el almacenamiento ECS, reproducibilidad, finalización del combate, construcción configurable, múltiples participantes, rondas, validación de intenciones y esquiva.

## Estructura

- `src/game/ecs`: mundo y almacenamiento de componentes.
- `src/game/components`: tipos de componentes.
- `src/game/entities`: creación de combatientes desde contenido.
- `src/game/intents`: acciones y errores públicos de validación.
- `src/game/rules`: reglas derivadas de equipo.
- `src/game/random`: fuente aleatoria determinista.
- `src/game/events`: registro ordenado de eventos.
- `src/game/systems`: resolución autoritativa de acciones.
- `src/game/simulation`: builder, sesión, iniciativa, rondas y snapshots.
- `src/content`: personajes, criaturas y equipo reutilizable.
- `src/cli`: cliente temporal de consola.
- `tests`: pruebas automáticas del núcleo.

## Frontera futura

El servidor enviará intenciones al `game core` y coordinará sesiones, persistencia y multijugador. El cliente representará eventos y snapshots. Ninguna de esas capas contendrá reglas autoritativas de combate.
