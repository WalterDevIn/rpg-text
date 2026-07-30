export function SelectionCard({ entry, selected, tone, onToggle }) {
  const card = document.createElement("article");
  card.className = `selection-card ${selected ? "is-selected" : ""} ${tone}`;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "selection-card-button";
  button.setAttribute("aria-pressed", String(selected));
  button.addEventListener("click", () => onToggle(entry.id));

  const marker = document.createElement("span");
  marker.className = "selection-marker";
  marker.textContent = selected ? "[x]" : "[ ]";
  marker.setAttribute("aria-hidden", "true");

  const identity = document.createElement("span");
  identity.className = "selection-identity";
  identity.innerHTML = `<strong>${escapeHtml(entry.name)}</strong><small>${escapeHtml(entry.role)}${entry.level ? ` · LV ${entry.level}` : ""}</small>`;

  const stats = document.createElement("span");
  stats.className = "selection-stats";
  stats.innerHTML = `<span>HP ${entry.hitPoints.current}/${entry.hitPoints.max}</span><span>AC ${entry.armorClass}</span><span>${escapeHtml(entry.controller)}</span>`;

  const description = document.createElement("span");
  description.className = "selection-description";
  description.textContent = entry.description;

  const attack = document.createElement("span");
  attack.className = "selection-attack";
  attack.textContent = entry.attack ? `${entry.attack.name}${entry.attack.damageDie ? ` · 1d${entry.attack.damageDie}` : ""}` : "";

  button.append(marker, identity, stats, description, attack);
  card.append(button);
  return card;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}
