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
