export class World {
  #nextEntityId = 1;
  #entities = new Set();
  #components = new Map();

  createEntity(prefix = "entity") {
    const id = `${prefix}-${this.#nextEntityId++}`;
    this.#entities.add(id);
    return id;
  }

  hasEntity(entityId) {
    return this.#entities.has(entityId);
  }

  removeEntity(entityId) {
    if (!this.#entities.delete(entityId)) return false;
    for (const store of this.#components.values()) store.delete(entityId);
    return true;
  }

  addComponent(entityId, componentType, data) {
    this.#assertEntity(entityId);
    const store = this.#components.get(componentType) ?? new Map();
    store.set(entityId, structuredClone(data));
    this.#components.set(componentType, store);
    return store.get(entityId);
  }

  getComponent(entityId, componentType) {
    return this.#components.get(componentType)?.get(entityId) ?? null;
  }

  requireComponent(entityId, componentType) {
    const component = this.getComponent(entityId, componentType);
    if (!component) throw new Error(`Entity ${entityId} lacks component ${componentType}`);
    return component;
  }

  query(...componentTypes) {
    if (componentTypes.length === 0) return [...this.#entities];
    return [...this.#entities].filter((entityId) =>
      componentTypes.every((type) => this.#components.get(type)?.has(entityId)),
    );
  }

  #assertEntity(entityId) {
    if (!this.hasEntity(entityId)) throw new Error(`Unknown entity: ${entityId}`);
  }
}
