import { quarterstaff } from "../items/quarterstaff.js";

export const humanWizard = Object.freeze({
  id: "human-wizard",
  kind: "character",
  name: "Human Wizard",
  hitPoints: 8,
  abilityScores: {
    strength: 8,
    dexterity: 14,
    constitution: 12,
    intelligence: 16,
    wisdom: 12,
    charisma: 10,
  },
  initiativeBonus: 2,
  controller: "manual",
  faction: "heroes",
  weapon: quarterstaff,
  inventory: [],
});
