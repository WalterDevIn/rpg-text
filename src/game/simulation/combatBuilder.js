import { CombatSession } from "./combatSession.js";

export class CombatBuilder {
  constructor({ seed = 1 } = {}) {
    this.seed = seed;
    this.participants = [];
  }

  add(definition, overrides = {}) {
    this.participants.push({ definition, overrides });
    return this;
  }

  validate() {
    const errors = [];
    if (this.participants.length < 2) errors.push("AT_LEAST_TWO_PARTICIPANTS_REQUIRED");
    const factions = new Set(this.participants.map(({ definition, overrides }) => overrides.faction ?? definition.faction));
    if (factions.size < 2) errors.push("AT_LEAST_TWO_FACTIONS_REQUIRED");
    return { ok: errors.length === 0, errors };
  }

  build() {
    const validation = this.validate();
    if (!validation.ok) throw new Error(validation.errors.join(", "));
    const session = new CombatSession({ seed: this.seed });
    const ids = this.participants.map(({ definition, overrides }) => session.addParticipant(definition, overrides));
    return { session, ids };
  }
}
