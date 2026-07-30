export function ParticipantPanel({ participants, activeEntityId }) {
  const section = document.createElement("section");
  section.className = "participant-panel";
  section.innerHTML = `<div class="section-kicker">PARTICIPANTS</div><h2>Combatants</h2>`;
  const list = document.createElement("div");
  list.className = "combatant-list";
  for (const participant of participants) {
    const row = document.createElement("article");
    const active = participant.entityId === activeEntityId;
    row.className = `combatant-row ${participant.faction === "monsters" ? "hostile" : "friendly"} ${participant.defeated ? "defeated" : ""}`;
    row.innerHTML = `<div class="combatant-heading"><strong>${active ? "> " : ""}${participant.identity.name}</strong><span>${participant.faction}</span></div><div class="combatant-health"><span>HP ${participant.health.current}/${participant.health.max}</span><span>AC ${participant.armorClass}</span></div><div class="health-track"><i style="width: ${Math.max(0, participant.health.current / participant.health.max * 100)}%"></i></div><small>${participant.defeated ? "DEFEATED" : participant.controller}</small>`;
    list.append(row);
  }
  section.append(list);
  return section;
}
