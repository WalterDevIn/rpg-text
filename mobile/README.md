# RPG Text Mobile

The mobile client is an Expo SDK 54 React Native application compatible with the current Expo Go Android release used by this repository.

## Commands

```bash
npm run mobile
npm run mobile -- --tunnel --clear
npm run test:mobile
```

From `mobile/`, use `npx expo-doctor`, `npx expo start --tunnel --clear`, and `npx expo export --platform android`.

The app connects to the authoritative REST server and plays combat through Spanish command interpretation. Commands submit only with the keyboard Send action after a `RESOLVED` preview; there is no visible send button.

Structured semantic segments and reference dictionaries are retained during progressive rendering. Completed references open a local inspector for public character, creature, item, spell, action, damage, and dice details. Interpretation previews expose authoritative annotations, actor, target, status, ambiguity candidates, and correction suggestions.

New live output is queued in authoritative order. Historical session events render immediately without animation or sound. Non-dice live output uses shared Unicode-safe typewriter timing, while player commands and dice entries appear complete. Skip completes presentation without changing game state.

The mobile audio adapter uses Expo `expo-audio` with local copies of `client/public/sounds/key-press.mp3`, `dice.mp3`, and `dices.mp3`. Sound, master volume, text animation, reduced motion, and presentation behavior are persisted through AsyncStorage. Platform-neutral timing, punctuation, dice classification, typewriter behavior, and semantic prefix visibility are shared under `shared/src/clientPresentation.js`.

## Application Flow

Startup loads the persisted server URL and checks `/api/health`. A successful check opens Home; unavailable servers remain on the connection screen. The stack flow is `Connection -> Home -> NewCombatParticipants -> NewCombatScenario -> NewCombatRules -> NewCombatReview -> Combat`, with Add Participant, Creation Hub, and Settings as secondary destinations.

Continue Combat appears only when a stored session reference can be recovered. Home fetches the authoritative snapshot and missing events; a missing or finished session clears the local reference and explains the result. Leaving active Combat for Home preserves the reference. There is no Exit action because the operating system owns application closing.

The setup draft is owned by the application context and persisted as a versioned compact object. Each participant stores a source ID, encounter-local instance key, display metadata, side, and controller separately. Duplicate templates are labeled by instance number. Review is the only screen with Start Combat and sends structured participant data through server validation before creating a real session. The current server supports `party`/`hostiles`, `manual`/`ai`, scenario selection, and a deterministic seed; no unsupported optional mechanics are exposed.

Creation Hub contains disabled Create Character, Create Companion, and Create Creature actions. They do not navigate, call the server, mutate the draft, or write storage. Settings provides persisted sound, volume, animation, reduced motion, server testing/change, and safe local-reference/preferences clearing without deleting authoritative server data.

## Connection and Version

The connection screen provides the predefined `Codespaces Development` server at `https://shiny-winner-g4qwrwp65g593vg7w-3000.app.github.dev` plus the existing custom address option. Server addresses are stored origin-only and the health request is built centrally as `/api/health`. Health checks use a 10-second timeout and report invalid addresses, unreachable or timed-out servers, authorization/private Codespaces ports, missing health endpoints, HTML pages, invalid JSON, incompatible JSON, and server errors with retry and change-server actions.

The mobile version is read from Expo application metadata through `expo-constants`. The current version is `0.1.0`, matching `mobile/app.json` and `mobile/package.json`, and appears on the connection screen and in Settings.
