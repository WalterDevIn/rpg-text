import { renderAnnotatedText, renderSemanticSegments } from "./semanticText.js";

export function CombatChat({ messages, presentationQueue, autoScroll = true, scrollTop = 0 }) {
  const section = document.createElement("section");
  section.className = "combat-chat-panel";
  section.innerHTML = `<div class="chat-toolbar"><div class="section-kicker">NARRATIVE LOG</div><button type="button" class="presentation-skip" hidden>SKIP</button></div><div class="chat-viewport"></div><div class="chat-accessibility" aria-live="polite"></div>`;
  const viewport = section.querySelector(".chat-viewport");
  const skip = section.querySelector(".presentation-skip");
  skip.hidden = !presentationQueue?.isActive;
  skip.addEventListener("click", () => presentationQueue?.skip());
  for (const message of messages) {
    const article = document.createElement("article");
    const previous = messages[messages.indexOf(message) - 1];
    article.className = `chat-message ${message.origin} ${message.tone} presentation-${message.phase ?? "complete"}${previous?.origin === message.origin ? " grouped" : ""}`;
    article.dataset.sequence = message.sequence;
    const label = document.createElement("small");
    label.textContent = message.origin === "player" ? "YOU" : message.origin.toUpperCase();
    if (previous?.origin === message.origin) label.hidden = true;
    const text = document.createElement("p");
    const visibleSegments = message.visibleSegments ?? message.segments;
    if (visibleSegments) renderSemanticSegments(text, visibleSegments, message.references);
    else if (message.annotations) renderAnnotatedText(text, message.text, message.annotations, message.references);
    else if (message.phase === "complete") text.textContent = message.text;
    article.append(label, text);
    viewport.append(article);
    if (message.phase === "complete" && message.origin !== "player") {
      article.setAttribute("aria-label", message.text ?? visibleText(message.segments));
      if (message.announce && !message.a11yAnnounced) {
        section.querySelector(".chat-accessibility").append(document.createTextNode(message.text ?? visibleText(message.segments)));
        message.a11yAnnounced = true;
      }
    }
  }
  requestAnimationFrame(() => { viewport.scrollTop = autoScroll ? viewport.scrollHeight : scrollTop; });
  return section;
}

function visibleText(segments = []) { return segments.map((segment) => segment.text ?? "").join(""); }
