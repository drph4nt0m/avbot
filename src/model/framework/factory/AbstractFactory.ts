import Immutable from "immutable";

import type {IDiFactory} from "./IDiFactory.js";

export abstract class AbstractFactory<T> implements IDiFactory<T> {

    private readonly _engines: Immutable.Set<T>;

    public static readonly factories: AbstractFactory<unknown>[] = [];

    public constructor() {
        this._engines = this.populateEngines();
        AbstractFactory.factories.push(this);
    }

    get engines(): Immutable.Set<T> {
        return Immutable.Set(this._engines);
    }

    protected abstract populateEngines(): Immutable.Set<T>;
}
