export const goblin = Object.freeze({
  id: "goblin",
  kind: "creature",
  name: "Goblin",
  hitPoints: 7,
  armorClass: 13,
  initiativeBonus: 2,
  abilityScores: {
    strength: 8,
    dexterity: 14,
    constitution: 10,
    intelligence: 10,
    wisdom: 8,
    charisma: 8,
  },
  attack: {
    attackBonus: 4,
    damageDie: 6,
    damageBonus: 2,
    damageType: "PIERCING",
  },
  controller: "ai",
  faction: "monsters",
});
