import type Immutable from "immutable";

import type { IDiFactory } from "./IDiFactory.js";

export abstract class AbstractFactory<T> implements IDiFactory<T> {
    public static readonly factories: AbstractFactory<unknown>[] = [];
    private readonly _engines: Immutable.Set<T>;

    public constructor() {
        this._engines = this.populateEngines();
        AbstractFactory.factories.push(this);
    }

    public get engines(): Immutable.Set<T> {
        return this._engines;
    }

    protected abstract populateEngines(): Immutable.Set<T>;
}
