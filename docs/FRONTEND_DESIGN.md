# Frontend Design Direction

## 1. Purpose

This document preserves the useful visual and interaction decisions from the earlier `solo-adventuring-txt` prototypes so that `rpg-text` can be implemented without access to that repository.

The frontend must not copy the prototype code blindly. It should reproduce the accepted product identity and interaction behavior in a maintainable application structure.

## 2. Reference priority

### Primary reference

`solo-adventuring-txt`, branch `prototype/combat-setup`.

Use it as the authority for:

- overall visual identity;
- encounter setup tone;
- dark terminal-like surfaces;
- typography;
- borders and chromatic fringe;
- semantic accent colors;
- combat chat alignment;
- dice styling;
- compact selection cards;
- subtle transitions.

### Secondary reference

`solo-adventuring-txt`, branch `prototype/player-experience`.

Use selected ideas only:

- top context bar;
- location, time, and objective summaries;
- main narrative panel plus contextual side panel;
- player messages aligned to the right;
- creature and system messages aligned to the left;
- party, nearby, encounter, and journal information architecture;
- compact responsive reflow.

Do not adopt its broader blue-gray dashboard appearance as the main style.

## 3. Visual identity

The target is a modern narrative terminal with restrained fantasy-game atmosphere.

It should feel:

- focused;
- dark;
- precise;
- slightly uncanny;
- technical enough to expose game mechanics;
- narrative enough to support immersion.

It should not feel like:

- a generic SaaS dashboard;
- a bright card-based mobile app;
- a literal green CRT terminal parody;
- a dense developer console;
- a traditional fantasy parchment interface.

## 4. Color system

Recommended semantic starting points from the accepted prototype:

```css
--background: #020203;
--surface: rgba(5, 5, 8, 0.94);
--text-primary: #f5f6fa;
--border-strong: rgba(245, 246, 250, 0.72);
--border-soft: rgba(245, 246, 250, 0.16);
--fringe-red: rgba(255, 35, 74, 0.36);
--fringe-blue: rgba(45, 125, 255, 0.38);
--accent-action: #ff9d4d;
--accent-friendly: #75e59a;
--accent-context: #67d9ff;
--accent-enemy: #ff5c73;
--accent-dice: #c79cff;
--accent-damage: #ff704d;
```

These values are reference values, not an immutable token specification. Changes should preserve contrast, semantic meaning, and restrained intensity.

## 5. Background treatment

The main application background should include a subtle circular or radial light treatment inspired by the accepted prototype and the focused central staging seen in narrative AI-game interfaces.

Recommended composition:

```css
background:
  radial-gradient(circle at 50% 47%, rgba(255,255,255,.038), transparent 37%),
  linear-gradient(rgba(255,255,255,.012) 50%, transparent 50%),
  #020203;
```

Additional treatment may include:

- extremely subtle horizontal scanlines;
- sparse texture or noise;
- minimal red/blue edge tint;
- no large colorful gradients;
- no glow strong enough to reduce text clarity.

The radial gradient belongs to the main stage and should visually concentrate attention near the narrative surface.

## 6. Typography

Use a monospaced typeface for the primary interface.

Initial fallback:

```css
font-family: "Courier New", Courier, monospace;
```

Typography rules:

- headings use moderate uppercase tracking;
- labels use small uppercase text with strong spacing;
- body text maintains comfortable narrative line height;
- combat values remain compact and scannable;
- avoid excessive all-caps in prose;
- avoid very small body text;
- line length should remain readable in chat messages.

## 7. Borders and depth

Surfaces use thin borders rather than heavy cards or large shadows.

Accepted characteristics:

- one-pixel light borders;
- softer internal separators;
- subtle inset highlight;
- minimal red fringe on one side and blue fringe on the other;
- occasional corner marks;
- restrained glow on focused or selected states.

The chromatic fringe should be barely noticeable at rest. It is an identity detail, not a constant glitch effect.

## 8. Core screens

### 8.1 Home

Purpose:

- enter the playable flow quickly;
- continue a recent session when persistence exists;
- start a new combat;
- open creature management.

The first implementation may be minimal. It should not become a large dashboard before the combat flow is complete.

### 8.2 Encounter setup

The primary reference is the two-column selection layout from `prototype/combat-setup`.

Required concepts:

- clear title and short instruction;
- numbered or labeled sections;
- selectable creature cards;
- visible key stats;
- faction or side assignment;
- controller assignment when supported;
- scenario selection;
- compact encounter summary;
- prominent Start Combat action;
- disabled start action until the encounter is valid.

Selection card structure:

```text
[index/marker] [identity and description] [compact stats]
```

Selected cards use a context-cyan border or inset marker. Enemy identity may use the hostile accent where appropriate.

### 8.3 Narrative combat

The combat screen is the central product surface.

Recommended desktop composition:

```text
┌──────────────────────────────────────────────────────────┐
│ LOCATION · TIME · OBJECTIVE · ROUND/TURN                │
├────────────────────────────────────┬─────────────────────┤
│                                    │ PARTICIPANTS        │
│ Narrative chat                     │ CURRENT TURN        │
│                                    │ CONDITIONS          │
│                                    │ SCENARIO            │
├────────────────────────────────────┴─────────────────────┤
│ Suggested actions / action input / submit               │
└──────────────────────────────────────────────────────────┘
```

The chat remains visually dominant. Context panels must be discreet.

### 8.4 Post-combat result

Required information:

- winning faction or resolution;
- defeated and surviving creatures;
- HP and persistent-state changes;
- experience awarded;
- resources spent where relevant;
- action to preserve/continue;
- action to return to encounter setup.

The result should feel like the conclusion of the same narrative surface, not an unrelated report page.

## 9. Chat message model

Message origins are semantically distinct.

### Player intention

- aligned right;
- origin label aligned right;
- subtle context-cyan border or surface;
- represents what the player attempts, not the final result.

### Dungeon Master

- aligned left;
- neutral light border;
- communicates environment, action resolution, and consequences.

### Creature intention or speech

- aligned left;
- hostile red for enemies;
- friendly green for allies or neutral creatures when appropriate;
- never used to narrate rules from an omniscient perspective.

### Dice

- aligned left;
- violet accent;
- visually compact;
- may show formula, individual results, modifier, total, and target value;
- remains independently identifiable from narration.

### System

- used sparingly;
- communicates application state, validation, connection, or exceptional operational information;
- should not replace Dungeon Master narration.

## 10. Message grouping

Consecutive messages from the same origin may be grouped:

- hide repeated origin labels;
- reduce vertical spacing;
- retain semantic type;
- preserve event order.

Messages enter with a small upward movement, opacity transition, and optional light blur. Motion must be subtle and disabled or reduced when the user requests reduced motion.

## 11. Chat scrolling

The chat panel is the only primary scroll viewport during combat.

Rules:

- the message list grows naturally;
- the viewport owns vertical scrolling;
- new messages scroll into view when the player is already near the bottom;
- reading older messages should not be forcibly interrupted;
- scrollbar styling is subtle;
- message deletion is not used to solve overflow;
- typewriter or entry animation must not break scroll height.

The early prototype used a limited visible message set. The product should prefer a stable scrollable history, with virtualization considered only when real volume requires it.

## 12. Input model

The normal combat interaction is a Spanish natural-language command composer. Structured action controls remain available only to tests, CLI, or explicit developer adapters.

The input area should:

- remain visible;
- clearly identify when input is disabled;
- show whose turn it is;
- avoid accepting duplicate submissions while resolution is pending;
- preserve typed text after recoverable validation errors;
- display actionable error feedback.

The composer previews server-authoritative annotations after a short debounce. `RESOLVED` text can be submitted; `INCOMPLETE`, `AMBIGUOUS`, `UNSUPPORTED`, and `INVALID_CONTEXT` text cannot. Suggestions insert names into the draft and do not bypass the language path. Enter/keyboard Send submits resolved text; mobile commands are single-line and have no visible send button.

Recognized fragments use an authoritative semantic preview and interactive tooltips. The overlay preserves original offsets and the editable textarea remains the focus target.

On mobile, semantic fragments use nested React Native `Text` elements and tap-to-open inspectors instead of hover tooltips. The editable `TextInput` remains plain; its authoritative interpretation preview appears above it. Incomplete and ambiguous candidates are tappable suggestions that revise the text and trigger another server preview.

Semantic colors use action orange, character cyan, creature faction colors, item amber, spell blue-violet, damage crimson/orange, and dice violet. Damage is visually distinct from dice because `DAMAGE` has priority over `DICE_ROLL`.

## 13. Context information

The secondary reference established useful categories:

- Location;
- Time;
- Objective;
- Party;
- Nearby;
- Encounter;
- Journal.

For the combat-first version, prioritize:

- scenario/location;
- round and current turn;
- participants;
- HP and conditions;
- controller status;
- encounter objective or victory condition.

Do not show empty world-exploration sections merely because they exist in the long-term design.

## 14. Dice presentation

Dice use violet as their semantic accent.

A dice resolution may appear in stages:

```text
Attack roll
1d20 + 4
13 + 4 = 17
17 vs AC 12 — HIT
```

Presentation may include a short delay or sound, but the authoritative result arrives from the game. Animation never determines the result.

Requirements:

- readable without sound;
- no excessive delay between routine rolls;
- multiple dice remain understandable;
- reduced-motion mode shortens or removes roll animation;
- dice results remain available in history.

## 15. Responsive behavior

Desktop uses a dominant chat area plus a narrow context column.

At medium widths:

- the context panel may move below the chat;
- compact context categories may become a horizontal grid;
- the chat remains the primary flexible region.

At small widths:

- use a single-column layout;
- preserve the input at the bottom of the combat surface;
- allow context to collapse or become a drawer/section;
- increase message maximum width;
- stack encounter setup panels;
- keep primary actions full-width when appropriate.

The application should not require global body scrolling during the main combat view unless mobile constraints make it necessary. Internal layout regions must handle overflow deliberately.

## 16. Accessibility

Minimum requirements:

- semantic headings and regions;
- visible keyboard focus;
- usable keyboard navigation;
- sufficient color contrast without relying on glow;
- color is not the only message-origin indicator;
- `aria-live` for new narrative messages with controlled verbosity;
- labels for inputs and action groups;
- reduced-motion support;
- no essential information conveyed only by sound;
- disabled actions explain why they are unavailable when practical.

## 17. Animation and sound

Use animation to clarify state changes:

- message entry;
- selected card state;
- turn transition;
- damage or HP change;
- dice resolution;
- combat conclusion.

Avoid:

- constant glitching;
- large screen shakes;
- long typewriter delays for every message;
- blocking animation chains;
- decorative motion that slows repeated combat actions.

Sounds may support dice and important transitions. They require mute and volume control before broad use.

The implemented audiovisual presentation uses `client/public/sounds/key-press.mp3` for input typing and output typewriter voices, `dice.mp3` for one-die rolls, and `dices.mp3` for multi-die and initiative batches. Output uses eight voices at base volume `.18` with playback rates `.86-1.14`; input uses five voices at `.18` with `.9-1.1`; dice uses `.72`. Master volume scales these values.

Presentation timing is centralized: player `0 ms`, dice `110 ms`, creature `220 ms`, normal narrative/system `380 ms`, entrance `240 ms`, normal dwell `90 ms`, character delay `24 ms`, punctuation delay `65 ms`, and ordinary dice interval `1000 ms`. Dice never typewrite. Player commands appear immediately. Sound and text animation can be disabled independently, preferences persist, reduced motion uses an approximately `1 ms` transition and suppresses output typewriter audio, and restored historical messages do not replay effects.

The mobile implementation uses the same platform-neutral timing policy from `shared/src/clientPresentation.js`, Expo `expo-audio` for bounded local playback, and AsyncStorage for presentation preferences. It announces completed output once to screen readers rather than exposing each typewriter character. Historical messages never replay animation or sound; only new events after the restored cursor use the live queue.

## 18. Implementation boundaries

Frontend code should separate:

```text
screens      page-level composition and lifecycle
components   reusable visual and interaction units
services     application/server boundary
state        client-owned UI state
styles       tokens, layout, components, utilities
assets       optional static visual/audio resources
```

Do not place combat resolution inside event handlers or components.

Do not reproduce prototype scripts that hardcode an entire staged combat sequence. The new client renders real structured state and events.

## 19. Initial component candidates

Create components only when required by the active feature. Likely early components include:

- `AppShell`;
- `EncounterSetupScreen`;
- `CreatureSelectionCard`;
- `EncounterSummary`;
- `CombatScreen`;
- `WorldContextBar`;
- `NarrativeFeed`;
- `NarrativeMessage`;
- `ParticipantPanel`;
- `ActionComposer`;
- `DiceResult`;
- `CombatResult`.

Names are illustrative. Avoid building a generic design system before these product components exist.

## 20. Acceptance test for visual fidelity

A first frontend foundation is visually accepted when:

1. The application clearly resembles the dark `combat-setup` prototype rather than a default browser form.
2. The radial main-stage gradient is visible but subtle.
3. Selection cards, borders, and accents use the accepted visual language.
4. Player, DM, creature, and dice messages are immediately distinguishable.
5. The chat is the dominant combat surface.
6. The context panel remains secondary.
7. The layout remains usable at desktop and mobile widths.
8. Effects do not compromise text readability.
