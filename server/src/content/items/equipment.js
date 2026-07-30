export const dagger = Object.freeze({
  id: "dagger",
  name: "Dagger",
  kind: "weapon",
  attack: { attackBonus: 4, damageDie: 4, damageBonus: 2, damageType: "PIERCING" },
});

export const quarterstaff = Object.freeze({
  id: "quarterstaff",
  name: "Quarterstaff",
  kind: "weapon",
  attack: { attackBonus: 4, damageDie: 6, damageBonus: 2, damageType: "BLUDGEONING" },
});

export const leatherArmor = Object.freeze({ id: "leather-armor", name: "Leather Armor", kind: "armor", armorClass: 13 });
export const chainMail = Object.freeze({ id: "chain-mail", name: "Chain Mail", kind: "armor", armorClass: 16 });
export const shield = Object.freeze({ id: "shield", name: "Shield", kind: "shield", armorClassBonus: 2 });
