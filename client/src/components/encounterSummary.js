import { SideId } from "../../../shared/src/index.js";

export function EncounterSummary({ entries, scenarios, selectedScenarioId, assignments, validation, loading, result, error, onStart }) {
  const section = document.createElement("section");
  section.className = "encounter-summary";
  section.innerHTML = `<div class="section-kicker">04 / REVIEW</div><h2>Selected encounter</h2>`;

  const scenario = scenarios.find((entry) => entry.id === selectedScenarioId);
  const details = document.createElement("div");
  details.className = "summary-details";
  details.innerHTML = `<div><span>Scenario</span><strong>${scenario?.name ?? "Not selected"}</strong></div><div><span>Party</span><strong>${countSide(entries, assignments, SideId.PARTY)}</strong></div><div><span>Hostiles</span><strong>${countSide(entries, assignments, SideId.HOSTILES)}</strong></div>`;
  section.append(details);

  const names = document.createElement("p");
  names.className = "summary-participants";
  names.textContent = entries.length ? entries.map((entry) => entry.name).join(" / ") : "No participants selected";
  section.append(names);

  if (validation.errors.length > 0) {
    const feedback = document.createElement("div");
    feedback.className = "validation-feedback";
    feedback.setAttribute("role", "alert");
    feedback.innerHTML = validation.errors.map((errorItem) => `<span>${escapeHtml(errorItem.message)}</span>`).join("");
    section.append(feedback);
  }
  if (error) {
    const applicationError = document.createElement("div");
    applicationError.className = "validation-feedback application-error";
    applicationError.setAttribute("role", "alert");
    applicationError.innerHTML = `<strong>${escapeHtml(error.message ?? "The server rejected this encounter.")}</strong>${(error.details ?? []).map((detail) => `<span>${escapeHtml(detail.message ?? detail)}</span>`).join("")}`;
    section.append(applicationError);
  }

  const start = document.createElement("button");
  start.type = "button";
  start.className = "start-combat-button";
  start.textContent = loading ? "Creating combat..." : "Start combat";
  start.disabled = !validation.ok || loading;
  start.title = start.disabled && !loading ? "Complete both sides and select a scenario" : "Create this combat session";
  start.addEventListener("click", onStart);
  section.append(start);

  if (result) {
    const ready = document.createElement("div");
    ready.className = "combat-ready";
    ready.setAttribute("role", "status");
    ready.innerHTML = `<strong>Combat ready</strong><span>Session ${escapeHtml(result.sessionId)} · ${escapeHtml(result.snapshot.status)}</span><small>Initial initiative and turn state are authoritative. The combat screen is the next slice.</small>`;
    section.append(ready);
  }
  return section;
}

function countSide(entries, assignments, side) {
  return entries.filter((entry) => assignments[entry.id] === side).length;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}
