import { longsword } from "../items/longsword.js";

export const humanFighter = Object.freeze({
  id: "human-fighter",
  kind: "character",
  name: "Walter",
  hitPoints: 14,
  armorClass: 16,
  initiativeBonus: 2,
  abilityScores: {
    strength: 16,
    dexterity: 14,
    constitution: 14,
    intelligence: 10,
    wisdom: 12,
    charisma: 10,
  },
  attack: longsword.attack,
  weaponId: longsword.id,
  controller: "player",
  faction: "heroes",
});
