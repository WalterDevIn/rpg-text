export function ActionComposer({ snapshot, onSubmit, pending, error }) {
  const section = document.createElement("section");
  section.className = "action-composer";
  const active = snapshot.participants.find((participant) => participant.entityId === snapshot.activeEntityId);
  section.innerHTML = `<div class="section-kicker">ACTION INPUT</div><h2>${active ? `${active.identity.name}'s turn` : "Combat complete"}</h2>`;
  if (!active || active.defeated || snapshot.status !== "ACTIVE") return section;
  if (active.controller !== "manual") {
    const resolving = document.createElement("p");
    resolving.className = "muted action-status";
    resolving.textContent = "The server is resolving the creature's turn...";
    section.append(resolving);
    return section;
  }

  let targetId = null;
  const targets = snapshot.participants.filter((participant) => !participant.defeated && participant.faction !== active.faction);
  const targetLabel = document.createElement("p");
  targetLabel.className = "muted action-status";
  targetLabel.textContent = "Choose a hostile target for ATTACK, or use DODGE/PASS.";
  section.append(targetLabel);
  const targetList = document.createElement("div");
  targetList.className = "target-list";
  let attackButton;
  for (const target of targets) {
    const targetButton = document.createElement("button");
    targetButton.type = "button";
    targetButton.className = "target-button hostile";
    targetButton.textContent = target.identity.name;
    targetButton.setAttribute("aria-pressed", "false");
    targetButton.disabled = pending;
    targetButton.addEventListener("click", () => {
      targetId = target.entityId;
      for (const child of targetList.children) child.setAttribute("aria-pressed", String(child === targetButton));
      if (attackButton) attackButton.disabled = false;
    });
    targetList.append(targetButton);
  }
  section.append(targetList);
  const buttons = document.createElement("div");
  buttons.className = "combat-actions";
  attackButton = actionButton("ATTACK", true, () => onSubmit({ type: "ATTACK", actorId: active.entityId, targetId }));
  const dodge = actionButton("DODGE", pending, () => onSubmit({ type: "DODGE", actorId: active.entityId }));
  const pass = actionButton("PASS", pending, () => onSubmit({ type: "PASS", actorId: active.entityId }));
  buttons.append(attackButton, dodge, pass);
  section.append(buttons);
  if (pending) {
    const pendingText = document.createElement("p");
    pendingText.className = "pending-action";
    pendingText.textContent = "Submitting to the authoritative simulation...";
    section.append(pendingText);
  }
  if (error) {
    const errorText = document.createElement("p");
    errorText.className = "action-error";
    errorText.textContent = error.message;
    section.append(errorText);
  }
  return section;
}

function actionButton(text, disabled, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "action-button";
  button.textContent = text;
  button.disabled = disabled;
  button.addEventListener("click", onClick);
  return button;
}
