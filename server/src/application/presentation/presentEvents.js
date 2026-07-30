import { presentCombatEvent } from "./presentCombatEvent.js";

export function presentEvents(events, snapshot) {
  return events.map((event) => ({ ...event, semantic: presentCombatEvent(event, snapshot.participants) }));
}
