import { renderAnnotatedText } from "./semanticText.js";

export function ActionComposer({ snapshot, draft = "", interpretation = null, interpreting = false, pending = false, disabled = false, error = null, onChange, onSubmit, onSuggestion }) {
  const section = document.createElement("section");
  section.className = "action-composer command-composer";
  const active = snapshot.participants.find((participant) => participant.entityId === snapshot.activeEntityId);
  section.innerHTML = `<div class="section-kicker">COMANDO EN ESPAÑOL</div><h2>${active ? `${escapeHtml(active.identity.name)}'s turn` : "Combat complete"}</h2>`;
  if (!active || active.defeated || snapshot.status !== "ACTIVE") return section;
  if (active.controller !== "manual") {
    const resolving = document.createElement("p");
    resolving.className = "muted action-status";
    resolving.textContent = "El servidor está resolviendo el turno de la criatura...";
    section.append(resolving);
    return section;
  }
  if (disabled) {
    const unavailable = document.createElement("p");
    unavailable.className = "muted action-status";
    unavailable.textContent = "Conexión no disponible. Reconecta el servidor para continuar.";
    section.append(unavailable);
    return section;
  }

  const hint = document.createElement("p");
  hint.className = "muted action-status";
  hint.textContent = "Escribe: Ataco al goblin, Esquivo o Paso.";
  section.append(hint);
  const form = document.createElement("form");
  form.className = "command-form";
  const input = document.createElement("textarea");
  input.className = "command-input";
  input.rows = 2;
  input.maxLength = 240;
  input.placeholder = "Ataco al goblin...";
  input.value = draft;
  input.setAttribute("aria-label", "Escribe un comando de combate en español");
  input.disabled = pending || disabled;
  input.addEventListener("input", () => onChange(input.value));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (interpretation?.status === "RESOLVED" && !pending) onSubmit(input.value);
    }
  });
  form.append(input);
  const send = document.createElement("button");
  send.type = "submit";
  send.className = "command-send";
  send.textContent = pending ? "ENVIANDO..." : "ENVIAR";
  send.disabled = pending || disabled || interpretation?.status !== "RESOLVED";
  form.addEventListener("submit", (event) => { event.preventDefault(); if (!send.disabled) onSubmit(input.value); });
  form.append(send);
  section.append(form);

  const feedback = document.createElement("div");
  feedback.className = "interpretation-feedback";
  if (interpreting) feedback.textContent = "Interpretando...";
  else if (interpretation) {
    feedback.classList.add(`interpretation-${interpretation.status.toLowerCase()}`);
    if (interpretation.annotations?.length) {
      const preview = document.createElement("div");
      preview.className = "semantic-preview";
      renderAnnotatedText(preview, interpretation.originalText, interpretation.annotations, interpretation.references);
      feedback.append(preview);
    }
    const message = document.createElement("p");
    message.textContent = interpretation.status === "RESOLVED" ? "Comando listo para ejecutar." : interpretation.message ?? statusMessage(interpretation.status);
    feedback.append(message);
    for (const missing of interpretation.missing ?? []) appendSuggestions(feedback, missing.suggestions ?? [], onSuggestion);
    for (const ambiguity of interpretation.ambiguities ?? []) appendSuggestions(feedback, ambiguity.options ?? [], onSuggestion);
    for (const warning of interpretation.warnings ?? []) { const warningText = document.createElement("small"); warningText.textContent = warning.message; feedback.append(warningText); }
  }
  if (error) { const errorText = document.createElement("p"); errorText.className = "action-error"; errorText.textContent = error.message; feedback.append(errorText); }
  if (feedback.textContent || feedback.children.length) section.append(feedback);
  if (pending) { const pendingText = document.createElement("p"); pendingText.className = "pending-action"; pendingText.textContent = "Enviando al simulador autoritativo..."; section.append(pendingText); }
  return section;
}

function appendSuggestions(parent, options, onSuggestion) {
  if (!options.length) return;
  const list = document.createElement("div");
  list.className = "command-suggestions";
  for (const option of options) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option.name;
    button.title = option.description ?? option.name;
    button.addEventListener("click", () => onSuggestion(option.name));
    list.append(button);
  }
  parent.append(list);
}

function statusMessage(status) { return { INCOMPLETE: "Falta información para ejecutar el comando.", AMBIGUOUS: "Elige una referencia concreta.", UNSUPPORTED: "Ese comando todavía no está disponible.", INVALID_CONTEXT: "El comando no puede usarse en este turno." }[status] ?? "Revisa el comando."; }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character])); }
