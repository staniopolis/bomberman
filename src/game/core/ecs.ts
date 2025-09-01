export type Entity = number;

export interface ComponentMap<T = any> {
  [id: number]: T;
}

export interface System {
  update(dt: number, world: World): void;
}

export class World {
  private nextId = 1;
  private stores: Map<string, ComponentMap> = new Map();
  systems: System[] = [];

  createEntity(): Entity {
    return this.nextId++;
  }

  register<T>(name: string): ComponentMap<T> {
    let store = this.stores.get(name);
    if (!store) {
      store = {};
      this.stores.set(name, store);
    }
    return store as ComponentMap<T>;
  }

  addComponent<T>(e: Entity, name: string, data: T) {
    this.register<T>(name)[e] = data;
  }

  removeComponent(e: Entity, name: string) {
    const store = this.stores.get(name);
    if (store) delete store[e];
  }

  get<T>(name: string): ComponentMap<T> {
    return this.register<T>(name);
  }

  removeEntity(e: Entity) {
    for (const store of this.stores.values()) delete store[e];
  }

  query(...names: string[]): Entity[] {
    const [first, ...rest] = names;
    const base = Object.keys(this.get(first));
    return base.filter(id => rest.every(n => this.get(n)[+id] !== undefined)).map(Number);
  }

  update(dt: number) {
    for (const system of this.systems) system.update(dt, this);
  }
}
