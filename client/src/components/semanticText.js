export function renderSemanticSegments(container, segments = [], references = {}) {
  for (const segment of segments) {
    if (!segment.semantic) {
      container.append(document.createTextNode(segment.text));
      continue;
    }
    appendSemantic(container, segment.text, segment.semantic, references[segment.semantic.referenceId]);
  }
}

export function renderAnnotatedText(container, text, annotations = [], references = {}) {
  let cursor = 0;
  for (const annotation of [...annotations].sort((left, right) => left.start - right.start)) {
    if (annotation.start < cursor) continue;
    if (annotation.start > cursor) container.append(document.createTextNode(text.slice(cursor, annotation.start)));
    appendSemantic(container, text.slice(annotation.start, annotation.end), annotation, references[annotation.referenceId]);
    cursor = annotation.end;
  }
  if (cursor < text.length) container.append(document.createTextNode(text.slice(cursor)));
}

function appendSemantic(container, text, semantic, reference = {}) {
  const wrapper = document.createElement("span");
  wrapper.className = `semantic-fragment semantic-${String(semantic.kind).toLowerCase()}`;
  wrapper.tabIndex = 0;
  wrapper.setAttribute("role", "button");
  wrapper.setAttribute("aria-label", `${reference.name ?? text}: ${summary(reference)}`);
  wrapper.textContent = text;
  const tooltip = document.createElement("span");
  tooltip.className = "semantic-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.textContent = summary(reference);
  wrapper.append(tooltip);
  let pinned = false;
  const show = () => wrapper.classList.add("is-open");
  const hide = () => { if (!pinned) wrapper.classList.remove("is-open"); };
  wrapper.addEventListener("mouseenter", show);
  wrapper.addEventListener("mouseleave", hide);
  wrapper.addEventListener("focus", show);
  wrapper.addEventListener("blur", hide);
  wrapper.addEventListener("click", () => { pinned = !pinned; wrapper.classList.toggle("is-pinned", pinned); show(); });
  wrapper.addEventListener("keydown", (event) => { if (event.key === "Escape") { pinned = false; wrapper.classList.remove("is-pinned", "is-open"); wrapper.blur(); } });
  container.append(wrapper);
}

function summary(reference = {}) {
  if (!reference || !Object.keys(reference).length) return "Referencia semántica";
  const details = [reference.description, reference.currentHitPoints !== undefined ? `PV ${reference.currentHitPoints}/${reference.maximumHitPoints}` : null, reference.damageNotation, reference.total !== undefined ? `total ${reference.total}` : null].filter(Boolean);
  return details.join(" · ") || reference.name || reference.kind || "Referencia semántica";
}
