# Development Strategy

## 1. Operating model

`rpg-text` is developed with two complementary AI roles:

- ChatGPT in the planning conversation acts as product designer, architect, documentation author, and reviewer.
- ChatGPT used through OpenCode acts as the repository implementer.

The implementer works from repository state and repository documentation. It must not depend on access to `solo-adventuring-txt` or on private conversation history.

## 2. Primary objective

Optimize for rapid delivery of demonstrable, playable features without sacrificing authoritative game boundaries.

Speed does not mean maximizing generated files or lines of code. Speed means reducing the time between:

```text
product decision
  -> implementation
  -> executable demonstration
  -> review
  -> next feature
```

## 3. Unit of delivery

The default unit of work is a vertical feature slice.

A vertical slice includes the minimum necessary parts of:

- client interaction;
- application/server coordination;
- authoritative game behavior;
- structured output;
- tests;
- documentation updates.

Not every slice must include all final layers. A temporary local adapter is acceptable when it accelerates a visible feature and preserves the future boundary.

## 4. Definition of a demonstrable feature

A feature is demonstrable when it has:

1. A clear user entry point.
2. A concrete action the user can perform.
3. An observable result.
4. A repeatable manual demonstration.
5. Automated verification for its critical behavior.
6. No placeholder in the main path pretending to be implemented behavior.

A feature is not complete when only interfaces, folders, types, fixtures, or TODOs exist.

## 5. Feature contract format

Every significant implementation request should define:

```text
FEATURE
A concise capability name.

USER VALUE
Why the capability matters to the playable product.

CURRENT STATE
Relevant implemented behavior and files.

DEMONSTRATION
Exact steps a reviewer can execute.

FUNCTIONAL REQUIREMENTS
Observable behavior that must exist.

TECHNICAL BOUNDARIES
Ownership and dependency constraints.

ACCEPTANCE CRITERIA
Binary checks for completion.

TEST REQUIREMENTS
Critical automated coverage.

OUT OF SCOPE
Explicit exclusions.

DOCUMENTATION UPDATES
Documents that must reflect the completed state.
```

The contract should be broad enough to deliver value and narrow enough to finish coherently.

## 6. Implementer behavior

The OpenCode implementer should:

- read `AGENTS.md` first;
- read the feature contract;
- inspect only the documentation and code relevant to the feature;
- understand existing behavior before replacing it;
- implement the complete accepted scope;
- run tests and the demonstration path;
- review the diff for accidental scope expansion;
- update current-state documentation;
- report what changed, what was executed, and any remaining limitation.

The implementer should not stop after the first valid edit while acceptance criteria remain unsatisfied.

## 7. Avoiding mini-implementations

Each implementation contract should include this expectation:

> Complete the capability as an executable vertical slice. Creating only scaffolding, interfaces, placeholders, data types, documentation, or isolated helpers is not sufficient. Continue until the demonstration and acceptance criteria work.

Small diffs are acceptable only when the repository already satisfies most criteria. In that case, the implementer must explain and demonstrate why.

## 8. Avoiding uncontrolled expansion

The implementer may create or modify the files genuinely required by the accepted feature inside the permitted architectural areas.

Avoid overly restrictive file lists when they prevent a complete slice. Prefer directory and ownership boundaries.

Example:

```text
Allowed:
- client/src/screens/combat/**
- client/src/components/chat/**
- client/src/services/**
- server/src/application/combat/**
- server/src/game/** when required by an accepted rule
- relevant tests and documentation

Forbidden:
- world exploration
- authentication
- multiplayer
- unrelated refactors
```

## 9. Existing code policy

The current combat core is preserved and evolved.

Before changing it, the implementer must identify:

- current public behavior;
- relevant tests;
- consumers;
- migration impact;
- whether a change is a move, adaptation, or replacement.

A structural move must retain an executable CLI or test path throughout the change.

## 10. Frontend-first visibility

The project should expose simulation progress through the frontend early.

Recommended pattern:

```text
Feature A: frontend shell and encounter setup with real local data
Feature B: start combat and render authoritative initial events
Feature C: submit one real action and render resolution
Feature D: play to combat conclusion
Feature E: persist result and reuse survivors
```

Do not spend multiple milestones completing internal subsystems that have no visible consumer.

## 11. Refactoring policy

Refactoring is allowed when required to complete the active feature or preserve boundaries.

A refactor must:

- have a stated reason;
- preserve or improve tests;
- avoid unrelated cleanup;
- maintain the demonstration path;
- not introduce speculative layers.

Separate large purely technical refactors from feature work only when combining them would make the feature unsafe or unreviewable.

## 12. Testing expectations

At minimum, each vertical feature should provide:

- focused unit or integration tests for authoritative behavior;
- one test covering the primary feature path at the highest practical layer;
- at least one important rejection or error case;
- deterministic inputs where randomness is involved.

Manual demonstration does not replace automated testing. Automated testing does not replace verifying the actual UI flow.

## 13. Documentation ownership

Stable documents:

- `docs/VISION.md`: long-term product direction.
- `docs/PRODUCT_DECISIONS.md`: accepted product choices.
- `docs/ARCHITECTURE.md`: target boundaries and dependency direction.
- `docs/FRONTEND_DESIGN.md`: accepted visual and interaction language.
- `docs/DEVELOPMENT_STRATEGY.md`: execution process.
- `docs/ROADMAP.md`: feature sequence and milestone status.
- `docs/CURRENT_CONTEXT.md`: concise implemented state and immediate next target.

Implementation should update stable documents only when decisions change. `CURRENT_CONTEXT.md` should be updated after meaningful implementation work.

## 14. Review process

After implementation, review should classify the result as:

- `ACCEPTED`: all critical criteria are met.
- `CORRECTION_REQUIRED`: the feature is incomplete or violates a boundary.
- `ACCEPTED_WITH_DEBT`: the user flow works and a bounded non-critical debt is recorded.
- `REPLAN_REQUIRED`: repository reality invalidates the original contract.

Review focuses on behavior first, then architecture, tests, and code quality.

## 15. Progress metrics

Track:

- completed user flows;
- demonstrated features;
- acceptance criteria satisfied;
- regressions;
- time spent on corrections;
- number of manual interventions required by the implementer;
- tests protecting shipped behavior.

Do not use line count, file count, or commit count as primary progress metrics.

## 16. Commit strategy

Work is performed on `master` unless the user explicitly changes the policy.

Multiple intentional commits are acceptable for one feature when they preserve understandable checkpoints. The final repository state must be coherent and tested.

Commit messages should describe delivered behavior or structural purpose, for example:

```text
feat(client): add encounter setup flow
feat(combat): expose initial combat snapshot
refactor: move game core under server boundary
test: cover combat action request lifecycle
docs: update current implementation context
```

## 17. Completion report

The implementer should end with:

```text
Implemented
- observable capabilities delivered

Key changes
- important code and boundary changes

Verification
- commands executed and results
- manual demonstration performed

Files changed
- concise grouped summary

Remaining limitations
- only real limitations inside or adjacent to scope
```

Do not claim a command or demonstration was executed when it was not.
