import { SideId } from "../../../shared/src/index.js";

export function SideAssignment({ entries, assignments, onAssign }) {
  const section = document.createElement("section");
  section.className = "side-assignment";
  section.innerHTML = `<div class="section-kicker">03 / SIDES</div><h2>Assign opposing sides</h2><p class="muted">Every selected participant must belong to one side. A participant cannot occupy both.</p>`;

  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Select participants to assign their side.";
    section.append(empty);
    return section;
  }

  const list = document.createElement("div");
  list.className = "assignment-list";
  for (const entry of entries) {
    const row = document.createElement("label");
    row.className = "assignment-row";
    const name = document.createElement("span");
    name.textContent = entry.name;
    const select = document.createElement("select");
    select.setAttribute("aria-label", `Side for ${entry.name}`);
    for (const [value, label] of [[SideId.PARTY, "Party"], [SideId.HOSTILES, "Hostiles"]]) {
      const option = new Option(label, value, false, assignments[entry.id] === value);
      select.append(option);
    }
    select.addEventListener("change", () => onAssign(entry.id, select.value));
    row.append(name, select);
    list.append(row);
  }
  section.append(list);
  return section;
}
