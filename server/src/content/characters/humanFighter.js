import { longsword } from "../items/longsword.js";
import { chainMail } from "../items/chainMail.js";
import { shield } from "../items/shield.js";

export const humanFighter = Object.freeze({
  id: "human-fighter",
  kind: "character",
  name: "Walter",
  aliases: ["walter", "guerrero", "luchador"],
  hitPoints: 14,
  initiativeBonus: 2,
  proficiencyBonus: 2,
  abilityScores: {
    strength: 16,
    dexterity: 14,
    constitution: 14,
    intelligence: 10,
    wisdom: 12,
    charisma: 10,
  },
  inventory: [longsword, chainMail, shield],
  weapon: longsword,
  armor: chainMail,
  shield,
  controller: "manual",
  faction: "heroes",
});
