import { renderAnnotatedText, renderSemanticSegments } from "./semanticText.js";

export function CombatChat({ messages, autoScroll = true, scrollTop = 0 }) {
  const section = document.createElement("section");
  section.className = "combat-chat-panel";
  section.innerHTML = `<div class="section-kicker">NARRATIVE LOG</div><div class="chat-viewport" aria-live="polite"></div>`;
  const viewport = section.querySelector(".chat-viewport");
  for (const message of messages) {
    const article = document.createElement("article");
    article.className = `chat-message ${message.origin} ${message.tone}`;
    article.dataset.sequence = message.sequence;
    const label = document.createElement("small");
    label.textContent = message.origin === "player" ? "YOU" : message.origin.toUpperCase();
    const text = document.createElement("p");
    if (message.segments) renderSemanticSegments(text, message.segments, message.references);
    else if (message.annotations) renderAnnotatedText(text, message.text, message.annotations, message.references);
    else text.textContent = message.text;
    article.append(label, text);
    viewport.append(article);
  }
  requestAnimationFrame(() => { viewport.scrollTop = autoScroll ? viewport.scrollHeight : scrollTop; });
  return section;
}
