export const actionLexicon = Object.freeze({
  ATTACK: Object.freeze(["ataco", "atacar", "ataca", "golpeo", "golpear", "golpea", "pego", "pegar", "pega"]),
  DODGE: Object.freeze(["esquivo", "esquivar", "defiendo", "defender", "defensiva", "defensivo"]),
  PASS: Object.freeze(["paso", "espera", "espero"]),
});

export const actionDescriptions = Object.freeze({
  ATTACK: "Intenta impactar a un objetivo hostil.",
  DODGE: "Adopta una postura defensiva hasta tu siguiente turno.",
  PASS: "Termina el turno sin realizar otra acción.",
});
