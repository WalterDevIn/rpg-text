# AGENTS.md

## Repository purpose

`rpg-text` is a narrative RPG application under active restructuring from an isolated combat core into a client/server product.

The authoritative game simulation will live inside `server/`. The graphical narrative interface will live inside `client/`. Shared public data contracts may live inside `shared/`.

## Required reading order

Before implementing a feature, read:

1. The user-supplied active implementation contract or prompt.
2. `docs/CURRENT_CONTEXT.md`.
3. `docs/ARCHITECTURE.md`.
4. `docs/PRODUCT_DECISIONS.md`.
5. `docs/FRONTEND_DESIGN.md` when frontend behavior or styling is involved.
6. `docs/DEVELOPMENT_STRATEGY.md`.
7. Only the roadmap section relevant to the active milestone.

Do not scan the entire repository by default. Inspect the files, tests, and documentation directly relevant to the requested capability, then expand only when dependencies require it.

## Working branch

Work on `master` unless the user explicitly names another branch.

Do not create a new branch without an explicit request.

## Current commands

```bash
npm run game
npm test
```

These commands must remain valid during the initial structural migration unless the active contract explicitly replaces them with documented equivalents.

## Core implementation rule

Complete capabilities as executable vertical slices.

Scaffolding, interfaces, placeholder files, empty directories, TODOs, isolated helpers, or documentation alone are not sufficient when the contract requests working behavior.

Continue implementation until:

- the demonstration works;
- acceptance criteria are satisfied;
- critical tests pass;
- the diff has been reviewed;
- current-state documentation is accurate.

## Architecture boundaries

### Game core

The authoritative simulation owns:

- ECS state;
- components and entities;
- rules;
- legal-intent validation;
- initiative and turns;
- attacks, damage, conditions, defeat, and victory;
- random resolution;
- authoritative events and snapshots.

It must not import HTTP, DOM, database, browser, animation, or client-state code.

### Server

The server owns:

- API transport;
- application use cases;
- sessions;
- persistence;
- multiplayer coordination;
- mapping game results to public contracts.

It must not reimplement combat rules.

### Client

The client owns:

- screens and navigation;
- input collection;
- narrative and mechanical presentation;
- animations and sound;
- responsive behavior;
- client-only UI state.

It must not calculate authoritative outcomes or directly mutate game state.

### Shared

Shared code contains public contracts only when both client and server need them. Do not place game implementation in `shared/`.

## Existing code policy

The current combat core is valuable and must be preserved.

Do not replace it wholesale because the directory structure is changing. Before modifying existing behavior:

- find the relevant tests;
- identify current consumers;
- preserve deterministic behavior;
- run the affected test suite;
- document intentional behavior changes.

## Frontend direction

The accepted frontend direction is fully documented in `docs/FRONTEND_DESIGN.md`.

Key constraints:

- use the dark `prototype/combat-setup` identity;
- include a subtle centered radial gradient;
- use monospaced typography and thin borders;
- keep chromatic fringe subtle;
- keep narrative chat dominant;
- align player messages right;
- align DM, creature, and dice messages left;
- use violet for dice;
- keep context panels discreet;
- do not substitute a generic dashboard style;
- do not hardcode fake combat logic in DOM components.

## Development policy

Prefer a feature-oriented change such as:

```text
Configure encounter in the client and start a real combat session.
```

Avoid horizontal-only work such as:

```text
Create every possible component type before any UI uses them.
```

Implement technical foundations only when the active feature requires them.

## Scope policy

Respect explicit out-of-scope items.

Within the accepted architectural area, create or modify the files necessary to complete the capability. Do not artificially restrict the implementation to a tiny diff when broader changes are required for a complete slice.

Do not perform unrelated cleanup, rename broad areas, introduce new frameworks, or build future subsystems without a feature requirement.

## Testing policy

For each feature:

- run relevant existing tests;
- add automated coverage for new authoritative behavior;
- add at least one important rejection/error case;
- use deterministic seeds for random behavior;
- verify the actual user-facing demonstration when frontend behavior is involved.

Never claim a command, test, or manual demonstration was executed if it was not.

## Documentation policy

Update `docs/CURRENT_CONTEXT.md` after meaningful implementation work.

Update stable documents only when the implemented feature changes an accepted decision or architectural boundary.

Documentation must distinguish among:

- currently implemented behavior;
- accepted target behavior;
- deferred future direction.

Do not document future behavior as already implemented.

## Completion report

End implementation work with:

```text
Implemented
- completed observable behavior

Key changes
- major code and architecture changes

Verification
- commands and tests actually executed
- manual demonstration actually performed

Remaining limitations
- real bounded limitations only
```

Also state whether `docs/CURRENT_CONTEXT.md` was updated.

## Prohibited shortcuts

- Do not put game rules in UI event handlers.
- Do not duplicate hit, damage, turn, or victory logic in the client or API.
- Do not use prose strings as the only authoritative event representation.
- Do not add generative AI as a dependency for core gameplay.
- Do not discard the existing simulator to make restructuring easier.
- Do not mark a feature complete while its primary path is mocked or hardcoded.
- Do not create empty architecture for world exploration, authentication, multiplayer, or database-backed content before an accepted feature needs it.
