import { actionLexicon } from "./actionLexicon.js";

const phraseActions = [
  [["quiero", "atacar"], "ATTACK"],
  [["quiero", "golpear"], "ATTACK"],
  [["tomo", "una", "postura", "defensiva"], "DODGE"],
  [["me", "defiendo"], "DODGE"],
  [["quiero", "esquivar"], "DODGE"],
  [["paso", "el", "turno"], "PASS"],
  [["termino", "mi", "turno"], "PASS"],
  [["no", "hago", "nada"], "PASS"],
];

export function recognizeAction(tokens) {
  const values = tokens.map(({ normalized }) => normalized);
  for (const [phrase, type] of phraseActions) {
    const index = findPhrase(values, phrase);
    if (index !== -1) return { type, startToken: index, endToken: index + phrase.length - 1 };
  }
  for (const [type, verbs] of Object.entries(actionLexicon)) {
    const index = values.findIndex((value) => verbs.includes(value));
    if (index !== -1) return { type, startToken: index, endToken: index };
  }
  return null;
}

function findPhrase(values, phrase) {
  for (let index = 0; index <= values.length - phrase.length; index += 1) {
    if (phrase.every((value, offset) => values[index + offset] === value)) return index;
  }
  return -1;
}
