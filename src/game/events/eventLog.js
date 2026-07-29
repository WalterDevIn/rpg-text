export class EventLog {
  #events = [];
  #nextSequence = 1;

  append(type, payload = {}) {
    const event = Object.freeze({ sequence: this.#nextSequence++, type, ...structuredClone(payload) });
    this.#events.push(event);
    return event;
  }

  all() {
    return [...this.#events];
  }

  since(sequence = 0) {
    return this.#events.filter((event) => event.sequence > sequence);
  }
}
