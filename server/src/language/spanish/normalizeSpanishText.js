export function normalizeSpanishText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[¿?¡!,.;:()[\]{}"“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeSpanishToken(value = "") {
  return normalizeSpanishText(value).replace(/[-']/g, " ").replace(/\s+/g, " ").trim();
}
