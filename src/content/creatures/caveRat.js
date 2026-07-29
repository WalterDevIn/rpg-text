import { dagger } from "../items/dagger.js";

export const caveRat = Object.freeze({
  id: "cave-rat",
  kind: "creature",
  name: "Cave Rat",
  hitPoints: 5,
  initiativeBonus: 3,
  abilityScores: {
    strength: 6,
    dexterity: 16,
    constitution: 10,
    intelligence: 2,
    wisdom: 10,
    charisma: 4,
  },
  controller: "manual",
  faction: "monsters",
  weapon: dagger,
  inventory: [],
});
