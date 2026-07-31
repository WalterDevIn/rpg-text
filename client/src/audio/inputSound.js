export function shouldPlayInputSound(event, composing = false) {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing && !composing;
}
